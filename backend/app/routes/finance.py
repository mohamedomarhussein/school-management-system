from datetime import datetime
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import (
    Student,
    SchoolClass,
    FeeStructure,
    Payment,
)
from app.utils.auth import role_required


finance_bp = Blueprint(
    "finance",
    __name__,
    url_prefix="/api/admin/finance"
)


# ============================================================
# FEE STRUCTURES
# ============================================================

@finance_bp.route("/fee-structures", methods=["POST"])
@role_required("admin")
def create_fee_structure():
    data = request.get_json() or {}

    required_fields = [
        "class_id",
        "academic_year",
        "term",
        "amount"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "success": False,
                "message": f"{field} is required"
            }), 400

    class_id = data.get("class_id")
    academic_year = data.get("academic_year")
    term = str(data.get("term", "")).strip()
    description = data.get("description")

    if not term:
        return jsonify({
            "success": False,
            "message": "Term is required"
        }), 400

    school_class = db.session.get(SchoolClass, class_id)

    if not school_class:
        return jsonify({
            "success": False,
            "message": "Class not found"
        }), 404

    try:
        amount = Decimal(str(data.get("amount")))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Amount must be a valid number"
        }), 400

    if amount <= 0:
        return jsonify({
            "success": False,
            "message": "Amount must be greater than 0"
        }), 400

    existing = db.session.scalar(
        db.select(FeeStructure).where(
            FeeStructure.class_id == class_id,
            FeeStructure.academic_year == academic_year,
            FeeStructure.term == term
        )
    )

    if existing:
        return jsonify({
            "success": False,
            "message": "Fee structure already exists for this class, academic year and term"
        }), 409

    fee_structure = FeeStructure(
        class_id=class_id,
        academic_year=academic_year,
        term=term,
        amount=amount,
        description=description
    )

    db.session.add(fee_structure)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Fee structure created successfully",
        "data": fee_structure.to_dict()
    }), 201


@finance_bp.route("/fee-structures", methods=["GET"])
@role_required("admin")
def get_fee_structures():
    query = db.select(FeeStructure).order_by(
        FeeStructure.academic_year.desc(),
        FeeStructure.term,
        FeeStructure.class_id
    )

    class_id = request.args.get("class_id")
    academic_year = request.args.get("academic_year")
    term = request.args.get("term")

    if class_id:
        query = query.where(
            FeeStructure.class_id == class_id
        )

    if academic_year:
        query = query.where(
            FeeStructure.academic_year == academic_year
        )

    if term:
        query = query.where(
            FeeStructure.term == term
        )

    fee_structures = db.session.scalars(query).all()

    return jsonify({
        "success": True,
        "count": len(fee_structures),
        "data": [fee.to_dict() for fee in fee_structures]
    })


@finance_bp.route("/fee-structures/<int:fee_id>", methods=["GET"])
@role_required("admin")
def get_fee_structure(fee_id):
    fee_structure = db.session.get(FeeStructure, fee_id)

    if not fee_structure:
        return jsonify({
            "success": False,
            "message": "Fee structure not found"
        }), 404

    return jsonify({
        "success": True,
        "data": fee_structure.to_dict()
    })


@finance_bp.route("/fee-structures/<int:fee_id>", methods=["PUT"])
@role_required("admin")
def update_fee_structure(fee_id):
    fee_structure = db.session.get(FeeStructure, fee_id)

    if not fee_structure:
        return jsonify({
            "success": False,
            "message": "Fee structure not found"
        }), 404

    data = request.get_json() or {}

    if "amount" in data:
        try:
            amount = Decimal(str(data["amount"]))
        except (InvalidOperation, TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Amount must be a valid number"
            }), 400

        if amount <= 0:
            return jsonify({
                "success": False,
                "message": "Amount must be greater than 0"
            }), 400

        fee_structure.amount = amount

    if "description" in data:
        fee_structure.description = data["description"]

    if "term" in data:
        term = str(data["term"]).strip()

        if not term:
            return jsonify({
                "success": False,
                "message": "Term cannot be empty"
            }), 400

        fee_structure.term = term

    if "academic_year" in data:
        fee_structure.academic_year = data["academic_year"]

    if "class_id" in data:
        school_class = db.session.get(
            SchoolClass,
            data["class_id"]
        )

        if not school_class:
            return jsonify({
                "success": False,
                "message": "Class not found"
            }), 404

        fee_structure.class_id = data["class_id"]

    duplicate = db.session.scalar(
        db.select(FeeStructure).where(
            FeeStructure.class_id == fee_structure.class_id,
            FeeStructure.academic_year == fee_structure.academic_year,
            FeeStructure.term == fee_structure.term,
            FeeStructure.id != fee_structure.id
        )
    )

    if duplicate:
        return jsonify({
            "success": False,
            "message": "Another fee structure already exists for this class, academic year and term"
        }), 409

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Fee structure updated successfully",
        "data": fee_structure.to_dict()
    })


@finance_bp.route("/fee-structures/<int:fee_id>", methods=["DELETE"])
@role_required("admin")
def delete_fee_structure(fee_id):
    fee_structure = db.session.get(FeeStructure, fee_id)

    if not fee_structure:
        return jsonify({
            "success": False,
            "message": "Fee structure not found"
        }), 404

    existing_payments = db.session.scalar(
        db.select(
            db.func.count(Payment.id)
        ).where(
            Payment.fee_structure_id == fee_id
        )
    )

    if existing_payments:
        return jsonify({
            "success": False,
            "message": "Cannot delete a fee structure that has payments"
        }), 409

    db.session.delete(fee_structure)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Fee structure deleted successfully"
    })


# ============================================================
# PAYMENTS
# ============================================================

@finance_bp.route("/payments", methods=["POST"])
@role_required("admin")
def create_payment():
    data = request.get_json() or {}

    required_fields = [
        "student_id",
        "fee_structure_id",
        "amount",
        "payment_method"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "success": False,
                "message": f"{field} is required"
            }), 400

    student = db.session.get(
        Student,
        data["student_id"]
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    fee_structure = db.session.get(
        FeeStructure,
        data["fee_structure_id"]
    )

    if not fee_structure:
        return jsonify({
            "success": False,
            "message": "Fee structure not found"
        }), 404

    try:
        amount = Decimal(str(data["amount"]))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Amount must be a valid number"
        }), 400

    if amount <= 0:
        return jsonify({
            "success": False,
            "message": "Payment amount must be greater than 0"
        }), 400

    payment_method = str(
        data.get("payment_method", "")
    ).strip()

    if not payment_method:
        return jsonify({
            "success": False,
            "message": "Payment method is required"
        }), 400

    reference_number = data.get("reference_number")

    if reference_number:
        reference_number = str(
            reference_number
        ).strip()

        existing_reference = db.session.scalar(
            db.select(Payment).where(
                Payment.reference_number == reference_number
            )
        )

        if existing_reference:
            return jsonify({
                "success": False,
                "message": "Reference number already exists"
            }), 409

    payment = Payment(
        student_id=student.id,
        fee_structure_id=fee_structure.id,
        amount=amount,
        payment_method=payment_method,
        reference_number=reference_number,
        remarks=data.get("remarks")
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Payment recorded successfully",
        "data": payment.to_dict()
    }), 201


@finance_bp.route("/payments", methods=["GET"])
@role_required("admin")
def get_payments():
    query = db.select(Payment).order_by(
        Payment.payment_date.desc()
    )

    student_id = request.args.get("student_id")
    fee_structure_id = request.args.get("fee_structure_id")
    payment_method = request.args.get("payment_method")

    if student_id:
        query = query.where(
            Payment.student_id == student_id
        )

    if fee_structure_id:
        query = query.where(
            Payment.fee_structure_id == fee_structure_id
        )

    if payment_method:
        query = query.where(
            Payment.payment_method == payment_method
        )

    payments = db.session.scalars(query).all()

    return jsonify({
        "success": True,
        "count": len(payments),
        "data": [payment.to_dict() for payment in payments]
    })


@finance_bp.route("/payments/<int:payment_id>", methods=["GET"])
@role_required("admin")
def get_payment(payment_id):
    payment = db.session.get(
        Payment,
        payment_id
    )

    if not payment:
        return jsonify({
            "success": False,
            "message": "Payment not found"
        }), 404

    return jsonify({
        "success": True,
        "data": payment.to_dict()
    })


@finance_bp.route("/payments/<int:payment_id>", methods=["PUT"])
@role_required("admin")
def update_payment(payment_id):
    payment = db.session.get(
        Payment,
        payment_id
    )

    if not payment:
        return jsonify({
            "success": False,
            "message": "Payment not found"
        }), 404

    data = request.get_json() or {}

    if "amount" in data:
        try:
            amount = Decimal(str(data["amount"]))
        except (InvalidOperation, TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Amount must be a valid number"
            }), 400

        if amount <= 0:
            return jsonify({
                "success": False,
                "message": "Payment amount must be greater than 0"
            }), 400

        payment.amount = amount

    if "payment_method" in data:
        payment_method = str(
            data["payment_method"]
        ).strip()

        if not payment_method:
            return jsonify({
                "success": False,
                "message": "Payment method cannot be empty"
            }), 400

        payment.payment_method = payment_method

    if "reference_number" in data:
        reference_number = data["reference_number"]

        if reference_number:
            reference_number = str(
                reference_number
            ).strip()

            existing_reference = db.session.scalar(
                db.select(Payment).where(
                    Payment.reference_number == reference_number,
                    Payment.id != payment.id
                )
            )

            if existing_reference:
                return jsonify({
                    "success": False,
                    "message": "Reference number already exists"
                }), 409

        payment.reference_number = reference_number

    if "remarks" in data:
        payment.remarks = data["remarks"]

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Payment updated successfully",
        "data": payment.to_dict()
    })


@finance_bp.route("/payments/<int:payment_id>", methods=["DELETE"])
@role_required("admin")
def delete_payment(payment_id):
    payment = db.session.get(
        Payment,
        payment_id
    )

    if not payment:
        return jsonify({
            "success": False,
            "message": "Payment not found"
        }), 404

    db.session.delete(payment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Payment deleted successfully"
    })


# ============================================================
# STUDENT FEE BALANCE
# ============================================================

@finance_bp.route(
    "/students/<int:student_id>/balance",
    methods=["GET"]
)
@role_required("admin")
def get_student_balance(student_id):
    student = db.session.get(
        Student,
        student_id
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    academic_year = request.args.get("academic_year")
    term = request.args.get("term")

    query = db.select(FeeStructure).where(
        FeeStructure.class_id == student.class_id
    )

    if academic_year:
        query = query.where(
            FeeStructure.academic_year == academic_year
        )

    if term:
        query = query.where(
            FeeStructure.term == term
        )

    fee_structures = db.session.scalars(query).all()

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
        Payment.student_id == student_id
    )

    if fee_structures:
        fee_ids = [
            fee.id for fee in fee_structures
        ]

        payment_query = payment_query.where(
            Payment.fee_structure_id.in_(fee_ids)
        )
    else:
        payment_query = payment_query.where(
            Payment.id == -1
        )

    total_paid = Decimal(
        str(
            db.session.scalar(payment_query) or 0
        )
    )

    balance = total_fees - total_paid

    if balance <= 0:
        status = "Paid"
    elif total_paid > 0:
        status = "Partially Paid"
    else:
        status = "Unpaid"

    return jsonify({
        "success": True,
        "data": {
            "student_id": student.id,
            "student_name": student.full_name,
            "class_id": student.class_id,
            "academic_year": academic_year,
            "term": term,
            "total_fees": float(total_fees),
            "total_paid": float(total_paid),
            "balance": float(balance),
            "status": status
        }
    })
