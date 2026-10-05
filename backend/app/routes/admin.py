from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models import User, Teacher, Parent
from app.utils.auth import role_required


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def get_users():
    users = db.session.scalars(
        select(User).order_by(User.created_at.desc())
    ).all()

    return jsonify({
        "success": True,
        "users": [user.to_dict() for user in users]
    }), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@role_required("admin")
def get_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    return jsonify({
        "success": True,
        "user": user.to_dict()
    }), 200


@admin_bp.route("/users", methods=["POST"])
@role_required("admin")
def create_user():
    data = request.get_json() or {}

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "").strip().lower()

    if not full_name or not email or not password or not role:
        return jsonify({
            "success": False,
            "message": "Full name, email, password and role are required"
        }), 400

    if role not in ["teacher", "parent"]:
        return jsonify({
            "success": False,
            "message": "Only teacher and parent accounts can be created here"
        }), 400

    existing_user = db.session.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        return jsonify({
            "success": False,
            "message": "A user with this email already exists"
        }), 409

    user = User(
        full_name=full_name,
        email=email,
        role=role,
        is_active=True
    )

    user.set_password(password)

    db.session.add(user)
    db.session.flush()

    if role == "teacher":
        employee_number = data.get("employee_number", "").strip()
        phone = data.get("phone", "").strip()
        qualification = data.get("qualification", "").strip()

        if not employee_number:
            db.session.rollback()
            return jsonify({
                "success": False,
                "message": "Employee number is required for teachers"
            }), 400

        existing_teacher = db.session.scalar(
            select(Teacher).where(
                Teacher.employee_number == employee_number
            )
        )

        if existing_teacher:
            db.session.rollback()
            return jsonify({
                "success": False,
                "message": "Employee number already exists"
            }), 409

        teacher = Teacher(
            user_id=user.id,
            employee_number=employee_number,
            phone=phone or None,
            qualification=qualification or None
        )

        db.session.add(teacher)

    elif role == "parent":
        phone = data.get("phone", "").strip()
        address = data.get("address", "").strip()

        parent = Parent(
            user_id=user.id,
            phone=phone or None,
            address=address or None
        )

        db.session.add(parent)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"{role.capitalize()} account created successfully",
        "user": user.to_dict()
    }), 201


@admin_bp.route("/users/<int:user_id>/status", methods=["PATCH"])
@role_required("admin")
def update_user_status(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    if user.role == "admin":
        return jsonify({
            "success": False,
            "message": "Admin accounts cannot be deactivated here"
        }), 400

    data = request.get_json() or {}

    if "is_active" not in data:
        return jsonify({
            "success": False,
            "message": "is_active is required"
        }), 400

    is_active = data.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({
            "success": False,
            "message": "is_active must be true or false"
        }), 400

    user.is_active = is_active

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User status updated successfully",
        "user": user.to_dict()
    }), 200
