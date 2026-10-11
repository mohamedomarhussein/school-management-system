from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from app.extensions import db
from app.models import Timetable, SchoolClass, Stream, Subject, Teacher
from app.routes.auth import role_required


timetable_bp = Blueprint(
    "timetable",
    __name__,
    url_prefix="/api/timetable"
)

DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
]


def serialize_entry(entry):
    data = entry.to_dict()

    data.update({
        "class_name": (
            entry.school_class.name
            if entry.school_class else None
        ),
        "stream_name": (
            entry.stream.name
            if entry.stream else None
        ),
        "subject_name": (
            entry.subject.name
            if entry.subject else None
        ),
        "teacher_name": (
            getattr(entry.teacher, "full_name", None)
            or getattr(entry.teacher, "name", None)
        ),
    })

    return data


def validate_entry(data, entry_id=None):
    required = [
        "class_id",
        "subject_id",
        "teacher_id",
        "day_of_week",
        "start_time",
        "end_time"
    ]

    for field in required:
        if data.get(field) is None or data.get(field) == "":
            return f"{field} is required"

    try:
        class_id = int(data["class_id"])
        subject_id = int(data["subject_id"])
        teacher_id = int(data["teacher_id"])
        stream_id = (
            int(data["stream_id"])
            if data.get("stream_id") not in (None, "")
            else None
        )

        start_time = datetime.strptime(
            data["start_time"], "%H:%M"
        ).time()

        end_time = datetime.strptime(
            data["end_time"], "%H:%M"
        ).time()

    except (ValueError, TypeError):
        return (
            "Invalid class, subject, teacher, stream, or time. "
            "Use HH:MM format for times."
        )

    day = str(data["day_of_week"]).strip().title()

    if day not in DAYS:
        return "day_of_week must be Monday through Saturday"

    if start_time >= end_time:
        return "end_time must be later than start_time"

    school_class = db.session.get(SchoolClass, class_id)
    subject = db.session.get(Subject, subject_id)
    teacher = db.session.get(Teacher, teacher_id)

    if not school_class:
        return "Class not found"

    if not subject:
        return "Subject not found"

    if not teacher:
        return "Teacher not found"

    if stream_id is not None:
        stream = db.session.get(Stream, stream_id)

        if not stream:
            return "Stream not found"

        if stream.class_id != class_id:
            return "The selected stream does not belong to this class"

    overlapping = Timetable.query.filter(
        Timetable.class_id == class_id,
        Timetable.day_of_week == day,
        Timetable.start_time < end_time,
        Timetable.end_time > start_time,
    )

    if stream_id is None:
        overlapping = overlapping.filter(
            Timetable.stream_id.is_(None)
        )
    else:
        overlapping = overlapping.filter(
            or_(
                Timetable.stream_id == stream_id,
                Timetable.stream_id.is_(None)
            )
        )

    if entry_id is not None:
        overlapping = overlapping.filter(
            Timetable.id != entry_id
        )

    if overlapping.first():
        return "This class or stream already has a lesson during that time"

    return {
        "class_id": class_id,
        "stream_id": stream_id,
        "subject_id": subject_id,
        "teacher_id": teacher_id,
        "day_of_week": day,
        "start_time": start_time,
        "end_time": end_time,
        "room": (
            str(data.get("room", "")).strip() or None
        )
    }


@timetable_bp.route("", methods=["GET"])
@role_required("admin")
def get_timetable():
    query = Timetable.query

    class_id = request.args.get("class_id")
    stream_id = request.args.get("stream_id")
    day = request.args.get("day_of_week")
    teacher_id = request.args.get("teacher_id")

    if class_id:
        query = query.filter(
            Timetable.class_id == class_id
        )

    if stream_id:
        query = query.filter(
            Timetable.stream_id == stream_id
        )

    if day:
        query = query.filter(
            Timetable.day_of_week == day.title()
        )

    if teacher_id:
        query = query.filter(
            Timetable.teacher_id == teacher_id
        )

    entries = query.order_by(
        Timetable.day_of_week,
        Timetable.start_time
    ).all()

    return jsonify({
        "success": True,
        "count": len(entries),
        "data": [serialize_entry(entry) for entry in entries]
    })


@timetable_bp.route("", methods=["POST"])
@role_required("admin")
def create_timetable_entry():
    data = request.get_json(silent=True) or {}
    validated = validate_entry(data)

    if isinstance(validated, str):
        return jsonify({
            "success": False,
            "message": validated
        }), 400

    entry = Timetable(**validated)
    db.session.add(entry)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Timetable entry created successfully",
        "data": serialize_entry(entry)
    }), 201


@timetable_bp.route("/<int:entry_id>", methods=["PUT"])
@role_required("admin")
def update_timetable_entry(entry_id):
    entry = db.session.get(Timetable, entry_id)

    if not entry:
        return jsonify({
            "success": False,
            "message": "Timetable entry not found"
        }), 404

    data = request.get_json(silent=True) or {}
    validated = validate_entry(data, entry_id)

    if isinstance(validated, str):
        return jsonify({
            "success": False,
            "message": validated
        }), 400

    for field, value in validated.items():
        setattr(entry, field, value)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Timetable entry updated successfully",
        "data": serialize_entry(entry)
    })


@timetable_bp.route("/<int:entry_id>", methods=["DELETE"])
@role_required("admin")
def delete_timetable_entry(entry_id):
    entry = db.session.get(Timetable, entry_id)

    if not entry:
        return jsonify({
            "success": False,
            "message": "Timetable entry not found"
        }), 404

    db.session.delete(entry)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Timetable entry deleted successfully"
    })
