from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models import (
    Student,
    SchoolClass,
    Stream,
    Enrollment,
    Subject,
    Teacher,
    TeacherSubject,
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

CLASS_LEVELS = {
    "PP1": "Pre-Primary",
    "PP2": "Pre-Primary",
    "Grade 1": "Primary",
    "Grade 2": "Primary",
    "Grade 3": "Primary",
    "Grade 4": "Primary",
    "Grade 5": "Primary",
    "Grade 6": "Primary",
    "Grade 7": "Junior Secondary",
    "Grade 8": "Junior Secondary",
    "Grade 9": "Junior Secondary",
    "Grade 10": "Senior Secondary",
    "Grade 11": "Senior Secondary",
    "Grade 12": "Senior Secondary",
}

CLASS_ORDER = {
    "PP1": 1,
    "PP2": 2,
    "Grade 1": 3,
    "Grade 2": 4,
    "Grade 3": 5,
    "Grade 4": 6,
    "Grade 5": 7,
    "Grade 6": 8,
    "Grade 7": 9,
    "Grade 8": 10,
    "Grade 9": 11,
    "Grade 10": 12,
    "Grade 11": 13,
    "Grade 12": 14,
}


@academic_bp.route("/classes", methods=["POST"])
@role_required("admin")
def create_class():
    data = request.get_json() or {}

    name = str(data.get("name", "")).strip()
    description = str(data.get("description", "")).strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Class name is required"
        }), 400

    level = CLASS_LEVELS.get(name)

    if not level:
        return jsonify({
            "success": False,
            "message": (
                "Invalid class. Allowed classes are: "
                "PP1, PP2, Grade 1 to Grade 12"
            )
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
        description=description or f"{name} students",
        level=level
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
        select(SchoolClass)
    ).all()

    classes.sort(
        key=lambda school_class: CLASS_ORDER.get(
            school_class.name,
            999
        )
    )

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


# ============================================================
# ENROLLMENTS
# ============================================================

@academic_bp.route("/enrollments", methods=["POST"])
@role_required("admin")
def create_enrollment():
    data = request.get_json() or {}

    student_id = data.get("student_id")
    class_id = data.get("class_id")
    stream_id = data.get("stream_id")
    academic_year = data.get("academic_year")

    if not student_id or not class_id or not academic_year:
        return jsonify({
            "success": False,
            "message": "student_id, class_id and academic_year are required"
        }), 400

    try:
        academic_year = int(academic_year)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "academic_year must be a valid year"
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

    if stream_id:
        stream = db.session.get(Stream, stream_id)

        if not stream:
            return jsonify({
                "success": False,
                "message": "Stream not found"
            }), 404

        if stream.class_id != class_id:
            return jsonify({
                "success": False,
                "message": "Stream does not belong to the selected class"
            }), 400

    existing_enrollment = db.session.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.academic_year == academic_year
        )
    )

    if existing_enrollment:
        return jsonify({
            "success": False,
            "message": "Student is already enrolled for this academic year"
        }), 409

    enrollment = Enrollment(
        student_id=student_id,
        class_id=class_id,
        stream_id=stream_id,
        academic_year=academic_year,
        is_current=True
    )

    # Make any previous enrollment non-current
    previous_enrollments = db.session.scalars(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.is_current.is_(True)
        )
    ).all()

    for previous in previous_enrollments:
        previous.is_current = False

    db.session.add(enrollment)

    # Keep the student's current class/stream synchronized
    student.class_id = class_id
    student.stream_id = stream_id

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Student enrolled successfully",
        "enrollment": enrollment.to_dict()
    }), 201


@academic_bp.route("/enrollments", methods=["GET"])
@role_required("admin")
def get_enrollments():
    academic_year = request.args.get("academic_year")
    class_id = request.args.get("class_id")

    query = select(Enrollment)

    if academic_year:
        try:
            academic_year = int(academic_year)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "academic_year must be a valid year"
            }), 400

        query = query.where(
            Enrollment.academic_year == academic_year
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
            Enrollment.class_id == class_id
        )

    enrollments = db.session.scalars(
        query.order_by(
            Enrollment.academic_year.desc(),
            Enrollment.id.desc()
        )
    ).all()

    return jsonify({
        "success": True,
        "enrollments": [
            enrollment.to_dict()
            for enrollment in enrollments
        ]
    }), 200


@academic_bp.route(
    "/students/<int:student_id>/enrollments",
    methods=["GET"]
)
@role_required("admin")
def get_student_enrollments(student_id):
    student = db.session.get(Student, student_id)

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    enrollments = db.session.scalars(
        select(Enrollment).where(
            Enrollment.student_id == student_id
        ).order_by(
            Enrollment.academic_year.desc()
        )
    ).all()

    return jsonify({
        "success": True,
        "student": student.to_dict(),
        "enrollments": [
            enrollment.to_dict()
            for enrollment in enrollments
        ]
    }), 200


# ============================================================
# SUBJECTS
# ============================================================

@academic_bp.route("/subjects", methods=["POST"])
@role_required("admin")
def create_subject():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    code = data.get("code", "").strip().upper()
    description = data.get("description", "").strip()

    if not name or not code:
        return jsonify({
            "success": False,
            "message": "Subject name and code are required"
        }), 400

    existing_name = db.session.scalar(
        select(Subject).where(
            Subject.name == name
        )
    )

    if existing_name:
        return jsonify({
            "success": False,
            "message": "A subject with this name already exists"
        }), 409

    existing_code = db.session.scalar(
        select(Subject).where(
            Subject.code == code
        )
    )

    if existing_code:
        return jsonify({
            "success": False,
            "message": "A subject with this code already exists"
        }), 409

    subject = Subject(
        name=name,
        code=code,
        description=description or None,
        is_active=True
    )

    db.session.add(subject)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Subject created successfully",
        "subject": subject.to_dict()
    }), 201


@academic_bp.route("/subjects", methods=["GET"])
@role_required("admin")
def get_subjects():
    subjects = db.session.scalars(
        select(Subject).order_by(Subject.name)
    ).all()

    return jsonify({
        "success": True,
        "subjects": [
            subject.to_dict()
            for subject in subjects
        ]
    }), 200


@academic_bp.route("/subjects/<int:subject_id>", methods=["GET"])
@role_required("admin")
def get_subject(subject_id):
    subject = db.session.get(
        Subject,
        subject_id
    )

    if not subject:
        return jsonify({
            "success": False,
            "message": "Subject not found"
        }), 404

    return jsonify({
        "success": True,
        "subject": subject.to_dict()
    }), 200


@academic_bp.route(
    "/subjects/<int:subject_id>",
    methods=["PUT"]
)
@role_required("admin")
def update_subject(subject_id):
    subject = db.session.get(
        Subject,
        subject_id
    )

    if not subject:
        return jsonify({
            "success": False,
            "message": "Subject not found"
        }), 404

    data = request.get_json() or {}

    if "name" in data:
        name = str(data["name"]).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Subject name cannot be empty"
            }), 400

        existing = db.session.scalar(
            select(Subject).where(
                Subject.name == name,
                Subject.id != subject_id
            )
        )

        if existing:
            return jsonify({
                "success": False,
                "message": "A subject with this name already exists"
            }), 409

        subject.name = name

    if "code" in data:
        code = str(data["code"]).strip().upper()

        if not code:
            return jsonify({
                "success": False,
                "message": "Subject code cannot be empty"
            }), 400

        existing = db.session.scalar(
            select(Subject).where(
                Subject.code == code,
                Subject.id != subject_id
            )
        )

        if existing:
            return jsonify({
                "success": False,
                "message": "A subject with this code already exists"
            }), 409

        subject.code = code

    if "description" in data:
        subject.description = (
            str(data["description"]).strip()
            if data["description"]
            else None
        )

    if "is_active" in data:
        if not isinstance(data["is_active"], bool):
            return jsonify({
                "success": False,
                "message": "is_active must be true or false"
            }), 400

        subject.is_active = data["is_active"]

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Subject updated successfully",
        "subject": subject.to_dict()
    }), 200


# ============================================================
# TEACHER-SUBJECT ASSIGNMENTS
# ============================================================

@academic_bp.route(
    "/teacher-assignments",
    methods=["POST"]
)
@role_required("admin")
def create_teacher_assignment():
    data = request.get_json() or {}

    teacher_id = data.get("teacher_id")
    subject_id = data.get("subject_id")
    class_id = data.get("class_id")
    stream_id = data.get("stream_id")

    if not teacher_id or not subject_id or not class_id:
        return jsonify({
            "success": False,
            "message": "teacher_id, subject_id and class_id are required"
        }), 400

    teacher = db.session.get(
        Teacher,
        teacher_id
    )

    if not teacher:
        return jsonify({
            "success": False,
            "message": "Teacher not found"
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

    if not subject.is_active:
        return jsonify({
            "success": False,
            "message": "This subject is inactive"
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
                "message": "Stream does not belong to the selected class"
            }), 400

    existing_assignment = db.session.scalar(
        select(TeacherSubject).where(
            TeacherSubject.teacher_id == teacher_id,
            TeacherSubject.subject_id == subject_id,
            TeacherSubject.class_id == class_id,
            TeacherSubject.stream_id == stream_id
        )
    )

    if existing_assignment:
        return jsonify({
            "success": False,
            "message": "This teacher is already assigned to this subject and class"
        }), 409

    assignment = TeacherSubject(
        teacher_id=teacher_id,
        subject_id=subject_id,
        class_id=class_id,
        stream_id=stream_id
    )

    db.session.add(assignment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Teacher assignment created successfully",
        "assignment": assignment.to_dict()
    }), 201


@academic_bp.route(
    "/teacher-assignments",
    methods=["GET"]
)
@role_required("admin")
def get_teacher_assignments():
    teacher_id = request.args.get("teacher_id")
    class_id = request.args.get("class_id")
    subject_id = request.args.get("subject_id")

    query = select(TeacherSubject)

    if teacher_id:
        try:
            teacher_id = int(teacher_id)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "teacher_id must be a valid number"
            }), 400

        query = query.where(
            TeacherSubject.teacher_id == teacher_id
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
            TeacherSubject.class_id == class_id
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
            TeacherSubject.subject_id == subject_id
        )

    assignments = db.session.scalars(
        query.order_by(TeacherSubject.id.desc())
    ).all()

    return jsonify({
        "success": True,
        "assignments": [
            assignment.to_dict()
            for assignment in assignments
        ]
    }), 200


