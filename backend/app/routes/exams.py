from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models import (
    Exam,
    Result,
    Student,
    SchoolClass,
    Subject,
)
from app.utils.auth import role_required


exams_bp = Blueprint(
    "exams",
    __name__,
    url_prefix="/api/exams"
)


# ============================================================
# GRADE CALCULATION
# ============================================================

def calculate_grade(marks):
    if marks >= 80:
        return "A"
    elif marks >= 70:
        return "B"
    elif marks >= 60:
        return "C"
    elif marks >= 50:
        return "D"
    else:
        return "E"


# ============================================================
# CREATE EXAM
# ============================================================

@exams_bp.route("", methods=["POST"])
@role_required("admin", "teacher")
def create_exam():

    data = request.get_json() or {}

    name = data.get("name")
    term = data.get("term")
    academic_year = data.get("academic_year")
    exam_date = data.get("exam_date")
    class_id = data.get("class_id")

    if not name or not term or not academic_year or not class_id:
        return jsonify({
            "success": False,
            "message": "name, term, academic_year and class_id are required"
        }), 400

    try:
        academic_year = int(academic_year)
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "academic_year must be a valid year"
        }), 400

    try:
        class_id = int(class_id)
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "class_id must be a valid number"
        }), 400

    school_class = db.session.get(
        SchoolClass,
        class_id
    )

    if not school_class:
        return jsonify({
            "success": False,
            "message": "Class not found"
        }), 404

    parsed_exam_date = None

    if exam_date:
        try:
            parsed_exam_date = datetime.strptime(
                exam_date,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "success": False,
                "message": "exam_date must be in YYYY-MM-DD format"
            }), 400

    # Prevent duplicate exams for the same class, term, academic year and name
    existing_exam = db.session.execute(
        select(Exam).where(
            Exam.name == str(name).strip(),
            Exam.term == str(term).strip(),
            Exam.academic_year == academic_year,
            Exam.class_id == class_id
        )
    ).scalar_one_or_none()

    if existing_exam:
        return jsonify({
            "success": False,
            "message": "An exam with the same name already exists for this class, term and academic year"
        }), 409

    exam = Exam(
        name=str(name).strip(),
        term=str(term).strip(),
        academic_year=academic_year,
        exam_date=parsed_exam_date,
        class_id=class_id
    )

    db.session.add(exam)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Exam created successfully",
        "exam": exam.to_dict()
    }), 201


# ============================================================
# GET ALL EXAMS
# ============================================================

@exams_bp.route("", methods=["GET"])
@role_required("admin", "teacher")
def get_exams():

    class_id = request.args.get("class_id")
    term = request.args.get("term")
    academic_year = request.args.get("academic_year")

    query = select(Exam)

    if class_id:
        try:
            class_id = int(class_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "class_id must be a valid number"
            }), 400

        query = query.where(
            Exam.class_id == class_id
        )

    if term:
        query = query.where(
            Exam.term == term.strip()
        )

    if academic_year:
        try:
            academic_year = int(academic_year)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "academic_year must be a valid year"
            }), 400

        query = query.where(
            Exam.academic_year == academic_year
        )

    query = query.order_by(
        Exam.academic_year.desc(),
        Exam.exam_date.desc(),
        Exam.id.desc()
    )

    exams = db.session.execute(
        query
    ).scalars().all()

    return jsonify({
        "success": True,
        "exams": [
            exam.to_dict()
            for exam in exams
        ]
    }), 200


# ============================================================
# GET SINGLE EXAM
# ============================================================

@exams_bp.route("/<int:exam_id>", methods=["GET"])
@role_required("admin", "teacher")
def get_exam(exam_id):

    exam = db.session.get(
        Exam,
        exam_id
    )

    if not exam:
        return jsonify({
            "success": False,
            "message": "Exam not found"
        }), 404

    return jsonify({
        "success": True,
        "exam": exam.to_dict()
    }), 200


# ============================================================
# UPDATE EXAM
# ============================================================

@exams_bp.route("/<int:exam_id>", methods=["PUT"])
@role_required("admin", "teacher")
def update_exam(exam_id):

    exam = db.session.get(
        Exam,
        exam_id
    )

    if not exam:
        return jsonify({
            "success": False,
            "message": "Exam not found"
        }), 404

    data = request.get_json() or {}

    if "name" in data:
        exam.name = str(data["name"]).strip()

    if "term" in data:
        exam.term = str(data["term"]).strip()

    if "academic_year" in data:
        try:
            exam.academic_year = int(
                data["academic_year"]
            )
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "academic_year must be a valid year"
            }), 400

    if "class_id" in data:

        try:
            class_id = int(data["class_id"])
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "class_id must be a valid number"
            }), 400

        school_class = db.session.get(
            SchoolClass,
            class_id
        )

        if not school_class:
            return jsonify({
                "success": False,
                "message": "Class not found"
            }), 404

        exam.class_id = class_id

    if "exam_date" in data:

        if data["exam_date"] is None:
            exam.exam_date = None
        else:
            try:
                exam.exam_date = datetime.strptime(
                    data["exam_date"],
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "exam_date must be in YYYY-MM-DD format"
                }), 400

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Exam updated successfully",
        "exam": exam.to_dict()
    }), 200


# ============================================================
# DELETE EXAM
# ============================================================

@exams_bp.route("/<int:exam_id>", methods=["DELETE"])
@role_required("admin")
def delete_exam(exam_id):

    exam = db.session.get(
        Exam,
        exam_id
    )

    if not exam:
        return jsonify({
            "success": False,
            "message": "Exam not found"
        }), 404

    db.session.delete(exam)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Exam deleted successfully"
    }), 200


# ============================================================
# CREATE RESULT
# ============================================================

@exams_bp.route("/results", methods=["POST"])
@role_required("admin", "teacher")
def create_result():

    data = request.get_json() or {}

    student_id = data.get("student_id")
    subject_id = data.get("subject_id")
    exam_id = data.get("exam_id")
    marks = data.get("marks")
    remarks = data.get("remarks")

    if (
        student_id is None
        or subject_id is None
        or exam_id is None
        or marks is None
    ):
        return jsonify({
            "success": False,
            "message": "student_id, subject_id, exam_id and marks are required"
        }), 400

    try:
        student_id = int(student_id)
        subject_id = int(subject_id)
        exam_id = int(exam_id)
        marks = float(marks)
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "student_id, subject_id, exam_id and marks must be valid values"
        }), 400

    if marks < 0 or marks > 100:
        return jsonify({
            "success": False,
            "message": "marks must be between 0 and 100"
        }), 400

    student = db.session.get(
        Student,
        student_id
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    subject = db.session.get(
        Subject,
        subject_id
    )

    if not subject:
        return jsonify({
            "success": False,
            "message": "Subject not found"
        }), 404

    exam = db.session.get(
        Exam,
        exam_id
    )

    if not exam:
        return jsonify({
            "success": False,
            "message": "Exam not found"
        }), 404

    if student.class_id != exam.class_id:
        return jsonify({
            "success": False,
            "message": "Student does not belong to the class for this exam"
        }), 400

    existing = db.session.execute(
        select(Result).where(
            Result.student_id == student_id,
            Result.subject_id == subject_id,
            Result.exam_id == exam_id
        )
    ).scalar_one_or_none()

    if existing:
        return jsonify({
            "success": False,
            "message": "A result already exists for this student, subject and exam"
        }), 409

    result = Result(
        student_id=student_id,
        subject_id=subject_id,
        exam_id=exam_id,
        marks=marks,
        grade=calculate_grade(marks),
        remarks=remarks
    )

    db.session.add(result)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Result recorded successfully",
        "result": result.to_dict()
    }), 201


# ============================================================
# GET RESULTS
# ============================================================

@exams_bp.route("/results", methods=["GET"])
@role_required("admin", "teacher")
def get_results():

    student_id = request.args.get("student_id")
    subject_id = request.args.get("subject_id")
    exam_id = request.args.get("exam_id")

    query = select(Result)

    if student_id:
        try:
            student_id = int(student_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "student_id must be a valid number"
            }), 400

        query = query.where(
            Result.student_id == student_id
        )

    if subject_id:
        try:
            subject_id = int(subject_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "subject_id must be a valid number"
            }), 400

        query = query.where(
            Result.subject_id == subject_id
        )

    if exam_id:
        try:
            exam_id = int(exam_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "exam_id must be a valid number"
            }), 400

        query = query.where(
            Result.exam_id == exam_id
        )

    query = query.order_by(
        Result.student_id.asc(),
        Result.subject_id.asc()
    )

    results = db.session.execute(
        query
    ).scalars().all()

    return jsonify({
        "success": True,
        "results": [
            result.to_dict()
            for result in results
        ]
    }), 200


# ============================================================
# GET SINGLE RESULT
# ============================================================

@exams_bp.route("/results/<int:result_id>", methods=["GET"])
@role_required("admin", "teacher")
def get_result(result_id):

    result = db.session.get(
        Result,
        result_id
    )

    if not result:
        return jsonify({
            "success": False,
            "message": "Result not found"
        }), 404

    return jsonify({
        "success": True,
        "result": result.to_dict()
    }), 200


# ============================================================
# UPDATE RESULT
# ============================================================

@exams_bp.route("/results/<int:result_id>", methods=["PUT"])
@role_required("admin", "teacher")
def update_result(result_id):

    result = db.session.get(
        Result,
        result_id
    )

    if not result:
        return jsonify({
            "success": False,
            "message": "Result not found"
        }), 404

    data = request.get_json() or {}

    if "marks" in data:

        try:
            marks = float(data["marks"])
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "marks must be a valid number"
            }), 400

        if marks < 0 or marks > 100:
            return jsonify({
                "success": False,
                "message": "marks must be between 0 and 100"
            }), 400

        result.marks = marks
        result.grade = calculate_grade(marks)

    if "remarks" in data:
        result.remarks = data.get("remarks")

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Result updated successfully",
        "result": result.to_dict()
    }), 200


# ============================================================
# DELETE RESULT
# ============================================================

@exams_bp.route("/results/<int:result_id>", methods=["DELETE"])
@role_required("admin")
def delete_result(result_id):

    result = db.session.get(
        Result,
        result_id
    )

    if not result:
        return jsonify({
            "success": False,
            "message": "Result not found"
        }), 404

    db.session.delete(result)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Result deleted successfully"
    }), 200
