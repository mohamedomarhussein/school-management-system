from collections import defaultdict
from decimal import Decimal
import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    Parent, Student, StudentParent, FeeStructure, Payment,
    SmsCampaign, SmsCampaignRecipient,
)
from app.utils.auth import role_required


parent_sms_bp = Blueprint(
    "parent_sms",
    __name__,
    url_prefix="/api/admin/parent-sms"
)


def normalize_kenyan_phone(phone):
    """
    Normalize common Kenyan phone formats to +254XXXXXXXXX.

    Accepted examples:
      0712345678
      0112345678
      254712345678
      +254712345678

    Invalid or missing numbers return None.
    """
    if not phone:
        return None

    value = re.sub(r"[\s().-]", "", str(phone))

    if value.startswith("00"):
        value = "+" + value[2:]

    if value.startswith("0"):
        if len(value) != 10:
            return None
        value = "+254" + value[1:]

    elif value.startswith("254"):
        value = "+" + value

    elif not value.startswith("+"):
        return None

    if not re.fullmatch(r"\+254\d{9}", value):
        return None

    return value


def parse_class_ids():
    """
    Accept either class_id=1 or class_ids=1,2,3.
    Return a set of IDs, or None if no filter was supplied.
    """
    raw = request.args.get("class_ids")

    if raw is None:
        raw = request.args.get("class_id")

    if raw is None or not raw.strip():
        return None

    try:
        values = {
            int(value.strip())
            for value in raw.split(",")
        }
    except ValueError:
        raise ValueError(
            "Class IDs must be comma-separated positive integers"
        )

    if not values or any(value <= 0 for value in values):
        raise ValueError(
            "Class IDs must be comma-separated positive integers"
        )

    return values


def get_student_fee_status(student, academic_year, term):
    """
    Use the existing fee structures and actual payments to determine
    whether a student's applicable fees are outstanding.

    Amounts are deliberately not returned in the preview.
    """
    query = db.select(FeeStructure).where(
        FeeStructure.class_id == student.class_id,
        FeeStructure.academic_year == academic_year,
        FeeStructure.term == term
    )

    fee_structures = db.session.scalars(query).all()

    if not fee_structures:
        return "fee_data_missing"

    fee_ids = [fee.id for fee in fee_structures]

    total_fees = sum(
        (Decimal(str(fee.amount)) for fee in fee_structures),
        Decimal("0")
    )

    payment_query = db.select(
        db.func.coalesce(
            db.func.sum(Payment.amount),
            0
        )
    ).where(
        Payment.student_id == student.id,
        Payment.fee_structure_id.in_(fee_ids)
    )

    total_paid = Decimal(
        str(db.session.scalar(payment_query) or 0)
    )

    balance = total_fees - total_paid

    if balance > 0:
        return "outstanding"

    return "cleared"


@parent_sms_bp.route("/preview", methods=["GET"])
@role_required("admin")
def preview_parent_sms_recipients():
    """
    Preview unique parent phone numbers without sending SMS.

    Examples:
      /api/admin/parent-sms/preview?type=announcement
      /api/admin/parent-sms/preview?type=announcement&class_ids=1,2
      /api/admin/parent-sms/preview?type=fee_reminder&academic_year=2026&term=Term%201
    """
    message_type = request.args.get(
        "type",
        "announcement"
    ).strip().lower()

    if message_type not in {"announcement", "fee_reminder"}:
        return jsonify({
            "success": False,
            "message": (
                "Type must be announcement or fee_reminder"
            )
        }), 400

    academic_year = None
    term = None

    if message_type == "fee_reminder":
        raw_year = request.args.get("academic_year", "").strip()
        term = request.args.get("term", "").strip()

        if not raw_year or not term:
            return jsonify({
                "success": False,
                "message": (
                    "Fee reminders require academic_year and term. "
                    "Example: academic_year=2026&term=Term 1"
                )
            }), 400

        try:
            academic_year = int(raw_year)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "academic_year must be a valid year"
            }), 400

        if academic_year < 2000 or academic_year > 2100:
            return jsonify({
                "success": False,
                "message": "academic_year is outside the allowed range"
            }), 400

    try:
        selected_class_ids = parse_class_ids()
    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    # Group siblings and parent accounts by normalized phone number.
    recipients = {}

    # Invalid or missing phones cannot receive SMS. Report them separately.
    invalid_parents = {}

    links = db.session.scalars(
        db.select(StudentParent)
    ).all()

    for link in links:
        parent = link.parent
        student = link.student

        if not parent or not student:
            continue

        if (
            selected_class_ids is not None
            and student.class_id not in selected_class_ids
        ):
            continue

        parent_name = (
            parent.user.full_name
            if parent.user
            else f"Parent {parent.id}"
        )

        student_info = {
            "student_id": student.id,
            "student_name": (
                f"{student.first_name} {student.last_name}"
            ).strip(),
            "class_id": student.class_id
        }

        phone = normalize_kenyan_phone(parent.phone)

        if phone is None:
            entry = invalid_parents.setdefault(
                parent.id,
                {
                    "parent_id": parent.id,
                    "parent_name": parent_name,
                    "reason": (
                        "Missing phone number"
                        if not parent.phone
                        else "Invalid Kenyan phone number"
                    ),
                    "children": {}
                }
            )

            entry["children"][student.id] = student_info
            continue

        recipient = recipients.setdefault(
            phone,
            {
                "phone": phone,
                "parent_ids": set(),
                "parent_names": set(),
                "children": {}
            }
        )

        recipient["parent_ids"].add(parent.id)
        recipient["parent_names"].add(parent_name)
        recipient["children"][student.id] = student_info

    preview_recipients = []
    eligible_count = 0
    cleared_count = 0
    incomplete_count = 0

    for phone, recipient in sorted(recipients.items()):
        children = list(recipient["children"].values())

        result = {
            "phone": phone,
            "parent_count": len(recipient["parent_ids"]),
            "parent_names": sorted(recipient["parent_names"]),
            "child_count": len(children),
            "children": children
        }

        if message_type == "fee_reminder":
            statuses = [
                get_student_fee_status(
                    db.session.get(
                        Student,
                        child["student_id"]
                    ),
                    academic_year,
                    term
                )
                for child in children
            ]

            # One outstanding child makes the shared phone eligible.
            # Never reveal which child has an outstanding balance.
            if "outstanding" in statuses:
                result["eligibility"] = "eligible"
                eligible_count += 1

            elif "fee_data_missing" in statuses:
                result["eligibility"] = "fee_data_incomplete"
                incomplete_count += 1

            else:
                result["eligibility"] = "fees_cleared"
                cleared_count += 1

        else:
            result["eligibility"] = "eligible"

        preview_recipients.append(result)

    invalid_results = []

    for entry in invalid_parents.values():
        entry["children"] = list(entry["children"].values())
        entry["child_count"] = len(entry["children"])
        invalid_results.append(entry)

    response_data = {
        "type": message_type,
        "class_ids": (
            sorted(selected_class_ids)
            if selected_class_ids is not None
            else None
        ),
        "recipient_count": len(preview_recipients),
        "invalid_parent_count": len(invalid_results),
        "invalid_parents": invalid_results,
        "recipients": preview_recipients,
        "sms_sent": False
    }

    if message_type == "fee_reminder":
        response_data.update({
            "academic_year": academic_year,
            "term": term,
            "eligible_count": eligible_count,
            "fees_cleared_count": cleared_count,
            "fee_data_incomplete_count": incomplete_count
        })

    return jsonify({
        "success": True,
        "message": "Recipient preview generated. No SMS messages were sent.",
        "data": response_data
    }), 200


# ---------------------------------------------------------
# SMS CAMPAIGN MANAGEMENT
# ---------------------------------------------------------

SMS_CAMPAIGN_TYPES = {
    "announcement",
    "fee_reminder",
    "parents_meeting",
    "opening_closing_dates",
    "custom",
}


def validate_campaign_data(data, existing=None):
    """Validate campaign fields and return cleaned data or an error."""

    existing = existing or {}

    title = data.get("title", existing.get("title", ""))
    message = data.get("message", existing.get("message", ""))

    message_type = data.get(
        "message_type",
        existing.get("message_type", "announcement"),
    )

    if not isinstance(title, str) or not title.strip():
        return None, "A campaign title is required."

    if len(title.strip()) > 200:
        return None, "The campaign title cannot exceed 200 characters."

    if not isinstance(message, str) or not message.strip():
        return None, "An SMS message is required."

    if not isinstance(message_type, str):
        return None, "Invalid campaign message type."

    message_type = message_type.strip().lower()

    if message_type not in SMS_CAMPAIGN_TYPES:
        return None, (
            "Invalid message type. Allowed types: "
            + ", ".join(sorted(SMS_CAMPAIGN_TYPES))
        )

    raw_class_ids = data.get(
        "target_class_ids",
        data.get("class_ids", existing.get("target_class_ids", [])),
    )

    if raw_class_ids is None:
        raw_class_ids = []

    if not isinstance(raw_class_ids, list):
        return None, "target_class_ids must be a list of class IDs."

    class_ids = []

    for value in raw_class_ids:
        if isinstance(value, bool):
            return None, "Each class ID must be a positive integer."

        try:
            class_id = int(value)
        except (TypeError, ValueError):
            return None, "Each class ID must be a positive integer."

        if class_id <= 0 or str(value).strip() != str(class_id):
            return None, "Each class ID must be a positive integer."

        if class_id not in class_ids:
            class_ids.append(class_id)

    academic_year = data.get(
        "academic_year",
        existing.get("academic_year"),
    )

    if academic_year in ("", None):
        academic_year = None
    else:
        if isinstance(academic_year, bool):
            return None, "academic_year must be a valid year."

        try:
            academic_year = int(academic_year)
        except (TypeError, ValueError):
            return None, "academic_year must be a valid year."

        if academic_year < 2000 or academic_year > 2100:
            return None, "academic_year must be between 2000 and 2100."

    term = data.get("term", existing.get("term"))

    if term is not None:
        if not isinstance(term, str):
            return None, "term must be text."

        term = term.strip() or None

        if term and len(term) > 50:
            return None, "term cannot exceed 50 characters."

    if message_type == "fee_reminder":
        if academic_year is None:
            return None, "academic_year is required for fee reminders."

        if not term:
            return None, "term is required for fee reminders."

    return {
        "title": title.strip(),
        "message": message.strip(),
        "message_type": message_type,
        "target_class_ids": class_ids,
        "academic_year": academic_year,
        "term": term,
    }, None


@parent_sms_bp.route("/campaigns", methods=["POST"])
@role_required("admin")
def create_sms_campaign():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required.",
        }), 400

    cleaned, error = validate_campaign_data(data)

    if error:
        return jsonify({
            "success": False,
            "message": error,
        }), 400

    try:
        campaign = SmsCampaign(
            **cleaned,
            status="draft",
            created_by=int(get_jwt_identity()),
        )

        db.session.add(campaign)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "SMS campaign draft created successfully.",
            "data": campaign.to_dict(),
            "sms_sent": False,
        }), 201

    except (TypeError, ValueError):
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "The authenticated user ID is invalid.",
        }), 400

    except Exception:
        db.session.rollback()
        raise


@parent_sms_bp.route("/campaigns", methods=["GET"])
@role_required("admin")
def get_sms_campaigns():
    status = request.args.get("status", "").strip().lower()

    allowed_statuses = {
        "draft",
        "reviewed",
        "scheduled",
        "sending",
        "sent",
        "failed",
        "cancelled",
    }

    if status and status not in allowed_statuses:
        return jsonify({
            "success": False,
            "message": "Invalid campaign status filter.",
        }), 400

    query = SmsCampaign.query

    if status:
        query = query.filter_by(status=status)

    campaigns = query.order_by(
        SmsCampaign.created_at.desc(),
        SmsCampaign.id.desc(),
    ).limit(100).all()

    return jsonify({
        "success": True,
        "count": len(campaigns),
        "data": [campaign.to_dict() for campaign in campaigns],
        "sms_sent": False,
    }), 200


@parent_sms_bp.route("/campaigns/<int:campaign_id>", methods=["GET"])
@role_required("admin")
def get_sms_campaign(campaign_id):
    campaign = db.session.get(SmsCampaign, campaign_id)

    if not campaign:
        return jsonify({
            "success": False,
            "message": "SMS campaign not found.",
        }), 404

    return jsonify({
        "success": True,
        "data": campaign.to_dict(include_recipients=True),
        "sms_sent": False,
    }), 200


@parent_sms_bp.route("/campaigns/<int:campaign_id>", methods=["PUT"])
@role_required("admin")
def update_sms_campaign(campaign_id):
    campaign = db.session.get(SmsCampaign, campaign_id)

    if not campaign:
        return jsonify({
            "success": False,
            "message": "SMS campaign not found.",
        }), 404

    if campaign.status != "draft":
        return jsonify({
            "success": False,
            "message": "Only draft campaigns can be edited.",
        }), 409

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required.",
        }), 400

    cleaned, error = validate_campaign_data(
        data,
        existing={
            "title": campaign.title,
            "message": campaign.message,
            "message_type": campaign.message_type,
            "target_class_ids": campaign.target_class_ids or [],
            "academic_year": campaign.academic_year,
            "term": campaign.term,
        },
    )

    if error:
        return jsonify({
            "success": False,
            "message": error,
        }), 400

    try:
        for field, value in cleaned.items():
            setattr(campaign, field, value)

        # A changed draft must not retain an outdated recipient preview.
        campaign.recipients.clear()

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "SMS campaign draft updated successfully.",
            "data": campaign.to_dict(),
            "sms_sent": False,
        }), 200

    except Exception:
        db.session.rollback()
        raise


# ---------------------------------------------------------
# CAMPAIGN RECIPIENT PREVIEW AND SNAPSHOT
# ---------------------------------------------------------

@parent_sms_bp.route(
    "/campaigns/<int:campaign_id>/preview",
    methods=["POST"],
)
@role_required("admin")
def preview_sms_campaign(campaign_id):
    """
    Recalculate and save a campaign's eligible recipient snapshot.
    This endpoint never sends SMS messages.
    """
    campaign = db.session.get(SmsCampaign, campaign_id)

    if not campaign:
        return jsonify({
            "success": False,
            "message": "SMS campaign not found.",
        }), 404

    if campaign.status != "draft":
        return jsonify({
            "success": False,
            "message": "Only draft campaigns can be previewed.",
        }), 409

    # Validate selected classes before querying recipients.
    selected_class_ids = campaign.target_class_ids or []

    if selected_class_ids:
        from app.models import SchoolClass

        existing_class_ids = set(
            db.session.scalars(
                db.select(SchoolClass.id).where(
                    SchoolClass.id.in_(selected_class_ids)
                )
            ).all()
        )

        unknown_class_ids = (
            set(selected_class_ids) - existing_class_ids
        )

        if unknown_class_ids:
            return jsonify({
                "success": False,
                "message": "The campaign contains unknown class IDs.",
                "unknown_class_ids": sorted(unknown_class_ids),
            }), 400

    if campaign.message_type == "fee_reminder":
        if campaign.academic_year is None or not campaign.term:
            return jsonify({
                "success": False,
                "message": (
                    "Fee reminders require an academic year and term."
                ),
            }), 400

    # Group parents sharing a phone number, including siblings.
    recipients = {}
    invalid_parents = {}

    links = db.session.scalars(
        db.select(StudentParent)
    ).all()

    for link in links:
        parent = link.parent
        student = link.student

        if not parent or not student:
            continue

        if (
            selected_class_ids
            and student.class_id not in selected_class_ids
        ):
            continue

        phone = normalize_kenyan_phone(parent.phone)

        if phone is None:
            invalid_entry = invalid_parents.setdefault(
                parent.id,
                {
                    "parent_id": parent.id,
                    "reason": (
                        "Missing phone number"
                        if not parent.phone
                        else "Invalid Kenyan phone number"
                    ),
                },
            )
            continue

        recipient = recipients.setdefault(
            phone,
            {
                "phone": phone,
                "parent_ids": set(),
                "student_ids": set(),
                "eligibility": "eligible",
            },
        )

        recipient["parent_ids"].add(parent.id)
        recipient["student_ids"].add(student.id)

    # Determine fee eligibility without exposing individual balances.
    eligible_recipients = []
    excluded_fee_count = 0
    incomplete_fee_count = 0

    for phone, recipient in sorted(recipients.items()):
        if campaign.message_type == "fee_reminder":
            statuses = []

            for student_id in recipient["student_ids"]:
                student = db.session.get(Student, student_id)

                statuses.append(
                    get_student_fee_status(
                        student,
                        campaign.academic_year,
                        campaign.term,
                    )
                )

            if "outstanding" in statuses:
                recipient["eligibility"] = "eligible"

            elif "fee_data_missing" in statuses:
                recipient["eligibility"] = "fee_data_incomplete"
                incomplete_fee_count += 1
                continue

            else:
                recipient["eligibility"] = "fees_cleared"
                excluded_fee_count += 1
                continue

        eligible_recipients.append(recipient)

    # Do not leave a previous snapshot if this preview has no eligible
    # recipients. Replace the previous draft snapshot transactionally.
    try:
        campaign.recipients.clear()
        db.session.flush()

        for recipient in eligible_recipients:
            db.session.add(
                SmsCampaignRecipient(
                    campaign_id=campaign.id,
                    phone=recipient["phone"],
                    parent_ids=sorted(recipient["parent_ids"]),
                    status="pending",
                )
            )

        db.session.commit()

    except Exception:
        db.session.rollback()
        raise

    return jsonify({
        "success": True,
        "message": (
            "Campaign recipient preview saved. No SMS messages were sent."
        ),
        "data": {
            "campaign_id": campaign.id,
            "campaign_title": campaign.title,
            "message_type": campaign.message_type,
            "status": campaign.status,
            "target_class_ids": selected_class_ids,
            "recipient_count": len(eligible_recipients),
            "invalid_parent_count": len(invalid_parents),
            "excluded_fee_cleared_count": excluded_fee_count,
            "excluded_fee_incomplete_count": incomplete_fee_count,
            "recipients": [
                {
                    "phone": recipient["phone"],
                    "parent_ids": sorted(recipient["parent_ids"]),
                    "eligibility": recipient["eligibility"],
                }
                for recipient in eligible_recipients
            ],
            "sms_sent": False,
        },
    }), 200
