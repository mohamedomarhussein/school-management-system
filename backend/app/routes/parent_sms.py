from collections import defaultdict
from decimal import Decimal
import re

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import Parent, Student, StudentParent, FeeStructure, Payment
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
