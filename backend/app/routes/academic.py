from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models import (
    Student,
    SchoolClass,
    Stream,
)
from app.utils.auth import role_required


academic_bp = Blueprint(
    "academic",
    __name__,
    url_prefix="/api/admin"
)


# ============================================================
# CLASSES
# ============================================================

@academic_bp.route("/classes", methods=["POST"])
@role_required("admin")
def create_class():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Class name is required"
        }), 400

    existing_class = db.session.scalar(
        select(SchoolClass).where(
            SchoolClass.name == name
        )
    )

    if existing_class:
        return jsonify({
            "success": False,
            "message": "This class already exists"
        }), 409

    school_class = SchoolClass(
        name=name,
        description=description or None
    )

    db.session.add(school_class)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Class created successfully",
        "class": school_class.to_dict()
    }), 201


@academic_bp.route("/classes", methods=["GET"])
@role_required("admin")
def get_classes():
    classes = db.session.scalars(
        select(SchoolClass).order_by(SchoolClass.name)
    ).all()

    return jsonify({
        "success": True,
        "classes": [
            school_class.to_dict()
            for school_class in classes
        ]
    }), 200


@academic_bp.route("/classes/<int:class_id>", methods=["GET"])
@role_required("admin")
def get_class(class_id):
    school_class = db.session.get(
        SchoolClass,
        class_id
    )

    if not school_class:
        return jsonify({
            "success": False,
            "message": "Class not found"
        }), 404

    return jsonify({
        "success": True,
        "class": school_class.to_dict()
    }), 200


# ============================================================
# STREAMS
# ============================================================

@academic_bp.route("/streams", methods=["POST"])
@role_required("admin")
def create_stream():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    class_id = data.get("class_id")

    if not name or not class_id:
        return jsonify({
            "success": False,
            "message": "Stream name and class_id are required"
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

    existing_stream = db.session.scalar(
        select(Stream).where(
            Stream.name == name,
            Stream.class_id == class_id
        )
    )

    if existing_stream:
        return jsonify({
            "success": False,
            "message": "This stream already exists in this class"
        }), 409

    stream = Stream(
        name=name,
        class_id=class_id
    )

    db.session.add(stream)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Stream created successfully",
        "stream": stream.to_dict()
    }), 201


@academic_bp.route("/streams", methods=["GET"])
@role_required("admin")
def get_streams():
    streams = db.session.scalars(
        select(Stream).order_by(
            Stream.class_id,
            Stream.name
        )
    ).all()

    return jsonify({
        "success": True,
        "streams": [
            stream.to_dict()
            for stream in streams
        ]
    }), 200


@academic_bp.route(
    "/classes/<int:class_id>/streams",
    methods=["GET"]
)
@role_required("admin")
def get_class_streams(class_id):
    school_class = db.session.get(
        SchoolClass,
        class_id
    )

    if not school_class:
        return jsonify({
            "success": False,
            "message": "Class not found"
        }), 404

    streams = db.session.scalars(
        select(Stream).where(
            Stream.class_id == class_id
        ).order_by(Stream.name)
    ).all()

    return jsonify({
        "success": True,
        "class": school_class.to_dict(),
        "streams": [
            stream.to_dict()
            for stream in streams
        ]
    }), 200


# ============================================================
# STUDENTS
# ============================================================

@academic_bp.route("/students", methods=["POST"])
@role_required("admin")
def create_student():
    data = request.get_json() or {}

    admission_number = data.get(
        "admission_number",
        ""
    ).strip()

    first_name = data.get(
        "first_name",
        ""
    ).strip()

    last_name = data.get(
        "last_name",
        ""
    ).strip()

    gender = data.get(
        "gender",
        ""
    ).strip()

    date_of_birth = data.get(
        "date_of_birth",
        ""
    ).strip()

    phone = data.get(
        "phone",
        ""
    ).strip()

    address = data.get(
        "address",
        ""
    ).strip()

    class_id = data.get("class_id")
    stream_id = data.get("stream_id")

    if not admission_number:
        return jsonify({
            "success": False,
            "message": "Admission number is required"
        }), 400

    if not first_name or not last_name:
        return jsonify({
            "success": False,
            "message": "First name and last name are required"
        }), 400

    if not gender:
        return jsonify({
            "success": False,
            "message": "Gender is required"
        }), 400

    if not class_id:
        return jsonify({
            "success": False,
            "message": "class_id is required"
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

    if stream_id:
        stream = db.session.get(
            Stream,
            stream_id
        )

        if not stream:
            return jsonify({
                "success": False,
                "message": "Stream not found"
            }), 404

        if stream.class_id != class_id:
            return jsonify({
                "success": False,
                "message": "The selected stream does not belong to the selected class"
            }), 400

    existing_student = db.session.scalar(
        select(Student).where(
            Student.admission_number == admission_number
        )
    )

    if existing_student:
        return jsonify({
            "success": False,
            "message": "Admission number already exists"
        }), 409

    parsed_date = None

    if date_of_birth:
        try:
            parsed_date = datetime.strptime(
                date_of_birth,
                "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify({
                "success": False,
                "message": "date_of_birth must use YYYY-MM-DD format"
            }), 400

    student = Student(
        admission_number=admission_number,
        first_name=first_name,
        last_name=last_name,
        gender=gender,
        date_of_birth=parsed_date,
        phone=phone or None,
        address=address or None,
        class_id=class_id,
        stream_id=stream_id
    )

    db.session.add(student)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Student created successfully",
        "student": student.to_dict()
    }), 201


@academic_bp.route("/students", methods=["GET"])
@role_required("admin")
def get_students():
    students = db.session.scalars(
        select(Student).order_by(
            Student.first_name,
            Student.last_name
        )
    ).all()

    return jsonify({
        "success": True,
        "students": [
            student.to_dict()
            for student in students
        ]
    }), 200


@academic_bp.route(
    "/students/<int:student_id>",
    methods=["GET"]
)
@role_required("admin")
def get_student(student_id):
    student = db.session.get(
        Student,
        student_id
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    return jsonify({
        "success": True,
        "student": student.to_dict()
    }), 200


@academic_bp.route(
    "/students/<int:student_id>",
    methods=["PUT"]
)
@role_required("admin")
def update_student(student_id):
    student = db.session.get(
        Student,
        student_id
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    data = request.get_json() or {}

    if "admission_number" in data:
        admission_number = str(
            data["admission_number"]
        ).strip()

        if not admission_number:
            return jsonify({
                "success": False,
                "message": "Admission number cannot be empty"
            }), 400

        existing_student = db.session.scalar(
            select(Student).where(
                Student.admission_number == admission_number,
                Student.id != student_id
            )
        )

        if existing_student:
            return jsonify({
                "success": False,
                "message": "Admission number already exists"
            }), 409

        student.admission_number = admission_number

    if "first_name" in data:
        student.first_name = str(
            data["first_name"]
        ).strip()

    if "last_name" in data:
        student.last_name = str(
            data["last_name"]
        ).strip()

    if "gender" in data:
        student.gender = str(
            data["gender"]
        ).strip()

    if "phone" in data:
        student.phone = (
            str(data["phone"]).strip()
            if data["phone"]
            else None
        )

    if "address" in data:
        student.address = (
            str(data["address"]).strip()
            if data["address"]
            else None
        )

    if "date_of_birth" in data:
        date_of_birth = str(
            data["date_of_birth"]
        ).strip()

        if date_of_birth:
            try:
                student.date_of_birth = datetime.strptime(
                    date_of_birth,
                    "%Y-%m-%d"
                ).date()
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "date_of_birth must use YYYY-MM-DD format"
                }), 400
        else:
            student.date_of_birth = None

    if "class_id" in data:
        class_id = data["class_id"]

        school_class = db.session.get(
            SchoolClass,
            class_id
        )

        if not school_class:
            return jsonify({
                "success": False,
                "message": "Class not found"
            }), 404

        student.class_id = class_id

    if "stream_id" in data:
        stream_id = data["stream_id"]

        if stream_id:
            stream = db.session.get(
                Stream,
                stream_id
            )

            if not stream:
                return jsonify({
                    "success": False,
                    "message": "Stream not found"
                }), 404

            if stream.class_id != student.class_id:
                return jsonify({
                    "success": False,
                    "message": "The selected stream does not belong to the student's class"
                }), 400

        student.stream_id = stream_id

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Student updated successfully",
        "student": student.to_dict()
    }), 200
