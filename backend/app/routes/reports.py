from datetime import datetime
from collections import Counter

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.student import Student
from app.models.school_class import SchoolClass
from app.models.attendance import Attendance
from app.models.exam import Exam
from app.models.result import Result
from app.models.payment import Payment
from app.models.fee_structure import FeeStructure
from app.utils.auth import role_required


reports_bp = Blueprint(
    "reports",
    __name__,
    url_prefix="/api/admin/reports"
)


def parse_date(value, field_name):
    if not value:
        return None

    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(
            f"{field_name} must use YYYY-MM-DD format"
        )


@reports_bp.route("/overview", methods=["GET"])
@role_required("admin")
def get_reports_overview():
    try:
        start_date = parse_date(
            request.args.get("start_date"),
            "start_date"
        )
        end_date = parse_date(
            request.args.get("end_date"),
            "end_date"
        )

        if start_date and end_date and start_date > end_date:
            return jsonify({
                "success": False,
                "message": "start_date cannot be after end_date"
            }), 400

        academic_year = request.args.get("academic_year")

        if academic_year:
            try:
                academic_year = int(academic_year)
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "academic_year must be a valid year"
                }), 400

        # --------------------------------------------------
        # STUDENT STATISTICS
        # --------------------------------------------------

        students = Student.query.all()

        gender_counts = Counter(
            (student.gender or "Unknown").strip().title()
            for student in students
        )

        class_counts = Counter(
            student.class_id
            for student in students
            if student.class_id is not None
        )

        classes = SchoolClass.query.all()
        class_names = {
            school_class.id: (
                getattr(school_class, "name", None)
                or getattr(school_class, "class_name", None)
                or f"Class {school_class.id}"
            )
            for school_class in classes
        }

        students_by_class = [
            {
                "class_id": class_id,
                "class_name": class_names.get(
                    class_id,
                    f"Class {class_id}"
                ),
                "total_students": total
            }
            for class_id, total in sorted(
                class_counts.items(),
                key=lambda item: class_names.get(
                    item[0],
                    f"Class {item[0]}"
                )
            )
        ]

        # --------------------------------------------------
        # ATTENDANCE STATISTICS
        # --------------------------------------------------

        attendance_query = Attendance.query

        if start_date:
            attendance_query = attendance_query.filter(
                Attendance.attendance_date >= start_date
            )

        if end_date:
            attendance_query = attendance_query.filter(
                Attendance.attendance_date <= end_date
            )

        attendance_records = attendance_query.all()

        attendance_counts = Counter(
            (record.status or "Unknown").strip().title()
            for record in attendance_records
        )

        attendance_total = len(attendance_records)
        present_count = attendance_counts.get("Present", 0)

        attendance_percentage = (
            round(present_count / attendance_total * 100, 2)
            if attendance_total
            else 0
        )

        # --------------------------------------------------
        # EXAM AND RESULT STATISTICS
        # --------------------------------------------------

        exams_query = Exam.query

        if academic_year:
            exams_query = exams_query.filter(
                Exam.academic_year == academic_year
            )

        exams = exams_query.all()
        exam_ids = [exam.id for exam in exams]

        results = (
            Result.query.filter(Result.exam_id.in_(exam_ids)).all()
            if exam_ids
            else []
        )

        marks = [float(result.marks) for result in results]

        grade_counts = Counter(
            (result.grade or "Ungraded").strip().upper()
            for result in results
        )

        average_marks = (
            round(sum(marks) / len(marks), 2)
            if marks
            else 0
        )

        # --------------------------------------------------
        # FINANCIAL STATISTICS
        # --------------------------------------------------

        payments_query = Payment.query

        if start_date:
            payments_query = payments_query.filter(
                Payment.payment_date >= datetime.combine(
                    start_date,
                    datetime.min.time()
                )
            )

        if end_date:
            payments_query = payments_query.filter(
                Payment.payment_date < datetime.combine(
                    end_date,
                    datetime.max.time()
                )
            )

        payments = payments_query.all()

        total_collected = round(
            sum(float(payment.amount) for payment in payments),
            2
        )

        fee_structures_query = FeeStructure.query

        if academic_year:
            fee_structures_query = fee_structures_query.filter(
                FeeStructure.academic_year == academic_year
            )

        fee_structures = fee_structures_query.all()

        configured_fees = round(
            sum(float(fee.amount) for fee in fee_structures),
            2
        )

        return jsonify({
            "success": True,
            "filters": {
                "start_date": (
                    start_date.isoformat() if start_date else None
                ),
                "end_date": (
                    end_date.isoformat() if end_date else None
                ),
                "academic_year": academic_year
            },
            "students": {
                "total": len(students),
                "by_gender": dict(gender_counts),
                "by_class": students_by_class
            },
            "attendance": {
                "total_records": attendance_total,
                "by_status": dict(attendance_counts),
                "present_percentage": attendance_percentage
            },
            "exams": {
                "total_exams": len(exams),
                "total_results": len(results),
                "average_marks": average_marks,
                "grade_distribution": dict(grade_counts)
            },
            "finance": {
                "total_collected": total_collected,
                "configured_fees": configured_fees,
                "payment_count": len(payments),
                "fee_structure_count": len(fee_structures)
            }
        }), 200

    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Unable to generate reports. Check the backend logs."
        }), 500
