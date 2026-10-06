from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models import Attendance, Student, SchoolClass
from app.utils.auth import role_required


attendance_bp = Blueprint(
    "attendance",
    __name__,
    url_prefix="/api/attendance"
)


VALID_STATUSES = {
    "Present",
    "Absent",
    "Late",
    "Excused"
}


# ============================================================
# CREATE ATTENDANCE
# ============================================================

@attendance_bp.route("", methods=["POST"])
@role_required("admin", "teacher")
def create_attendance():

    data = request.get_json() or {}

    student_id = data.get("student_id")
    class_id = data.get("class_id")
    attendance_date = data.get("attendance_date")
    status = data.get("status")
    remarks = data.get("remarks")

    if not student_id or not class_id or not attendance_date or not status:
        return jsonify({
            "success": False,
            "message": "student_id, class_id, attendance_date and status are required"
        }), 400

    status = str(status).strip().title()

    if status not in VALID_STATUSES:
        return jsonify({
            "success": False,
            "message": "Invalid status. Allowed statuses are: Present, Absent, Late, Excused"
        }), 400

    try:
        attendance_date = datetime.strptime(
            attendance_date,
            "%Y-%m-%d"
        ).date()
    except ValueError:
        return jsonify({
            "success": False,
            "message": "attendance_date must be in YYYY-MM-DD format"
        }), 400

    student = db.session.get(Student, student_id)

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    school_class = db.session.get(SchoolClass, class_id)

    if not school_class:
        return jsonify({
            "success": False,
            "message": "Class not found"
        }), 404

    if student.class_id != class_id:
        return jsonify({
            "success": False,
            "message": "Student does not belong to this class"
        }), 400

    existing = db.session.execute(
        select(Attendance).where(
            Attendance.student_id == student_id,
            Attendance.attendance_date == attendance_date
        )
    ).scalar_one_or_none()

    if existing:
        return jsonify({
            "success": False,
            "message": "Attendance has already been recorded for this student on this date"
        }), 409

    attendance = Attendance(
        student_id=student_id,
        class_id=class_id,
        attendance_date=attendance_date,
        status=status,
        remarks=remarks
    )

    db.session.add(attendance)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance recorded successfully",
        "attendance": attendance.to_dict()
    }), 201


# ============================================================
# GET ATTENDANCE
# ============================================================

@attendance_bp.route("", methods=["GET"])
@role_required("admin", "teacher")
def get_attendance():

    student_id = request.args.get("student_id")
    class_id = request.args.get("class_id")
    attendance_date = request.args.get("attendance_date")
    status = request.args.get("status")

    query = select(Attendance)

    if student_id:
        try:
            student_id = int(student_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "student_id must be a valid number"
            }), 400

        query = query.where(
            Attendance.student_id == student_id
        )

    if class_id:
        try:
            class_id = int(class_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "class_id must be a valid number"
            }), 400

        query = query.where(
            Attendance.class_id == class_id
        )

    if attendance_date:
        try:
            attendance_date = datetime.strptime(
                attendance_date,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "success": False,
                "message": "attendance_date must be in YYYY-MM-DD format"
            }), 400

        query = query.where(
            Attendance.attendance_date == attendance_date
        )

    if status:
        status = str(status).strip().title()

        if status not in VALID_STATUSES:
            return jsonify({
                "success": False,
                "message": "Invalid status. Allowed statuses are: Present, Absent, Late, Excused"
            }), 400

        query = query.where(
            Attendance.status == status
        )

    query = query.order_by(
        Attendance.attendance_date.desc(),
        Attendance.id.desc()
    )

    records = db.session.execute(query).scalars().all()

    return jsonify({
        "success": True,
        "attendance": [
            record.to_dict()
            for record in records
        ]
    }), 200


# ============================================================
# GET SINGLE ATTENDANCE RECORD
# ============================================================

@attendance_bp.route("/<int:attendance_id>", methods=["GET"])
@role_required("admin", "teacher")
def get_single_attendance(attendance_id):

    attendance = db.session.get(
        Attendance,
        attendance_id
    )

    if not attendance:
        return jsonify({
            "success": False,
            "message": "Attendance record not found"
        }), 404

    return jsonify({
        "success": True,
        "attendance": attendance.to_dict()
    }), 200


# ============================================================
# UPDATE ATTENDANCE
# ============================================================

@attendance_bp.route("/<int:attendance_id>", methods=["PUT"])
@role_required("admin", "teacher")
def update_attendance(attendance_id):

    attendance = db.session.get(
        Attendance,
        attendance_id
    )

    if not attendance:
        return jsonify({
            "success": False,
            "message": "Attendance record not found"
        }), 404

    data = request.get_json() or {}

    status = data.get("status")
    remarks = data.get("remarks")

    if status is not None:
        status = str(status).strip().title()

        if status not in VALID_STATUSES:
            return jsonify({
                "success": False,
                "message": "Invalid status. Allowed statuses are: Present, Absent, Late, Excused"
            }), 400

        attendance.status = status

    if "remarks" in data:
        attendance.remarks = data.get("remarks")

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance updated successfully",
        "attendance": attendance.to_dict()
    }), 200


# ============================================================
# DELETE ATTENDANCE
# ============================================================

@attendance_bp.route("/<int:attendance_id>", methods=["DELETE"])
@role_required("admin")
def delete_attendance(attendance_id):

    attendance = db.session.get(
        Attendance,
        attendance_id
    )

    if not attendance:
        return jsonify({
            "success": False,
            "message": "Attendance record not found"
        }), 404

    db.session.delete(attendance)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance deleted successfully"
    }), 200
