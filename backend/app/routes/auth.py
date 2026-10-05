from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required
)
from sqlalchemy import select

from app.extensions import db
from app.models import User
from app.utils.auth import role_required


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    user = db.session.scalar(
        select(User).where(User.email == email)
    )

    if not user:
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    if not user.is_active:
        return jsonify({
            "success": False,
            "message": "This account is inactive"
        }), 403

    if not user.check_password(password):
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role
        }
    )

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()

    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404

    return jsonify({
        "success": True,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/admin-test", methods=["GET"])
@role_required("admin")
def admin_test():
    return jsonify({
        "success": True,
        "message": "Admin access confirmed"
    }), 200


@auth_bp.route("/teacher-test", methods=["GET"])
@role_required("teacher")
def teacher_test():
    return jsonify({
        "success": True,
        "message": "Teacher access confirmed"
    }), 200


@auth_bp.route("/parent-test", methods=["GET"])
@role_required("parent")
def parent_test():
    return jsonify({
        "success": True,
        "message": "Parent access confirmed"
    }), 200
