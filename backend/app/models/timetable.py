from app.extensions import db


class Timetable(db.Model):
    __tablename__ = "timetables"

    id = db.Column(db.Integer, primary_key=True)

    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id"),
        nullable=False
    )

    stream_id = db.Column(
        db.Integer,
        db.ForeignKey("streams.id"),
        nullable=True
    )

    subject_id = db.Column(
        db.Integer,
        db.ForeignKey("subjects.id"),
        nullable=False
    )

    teacher_id = db.Column(
        db.Integer,
        db.ForeignKey("teachers.id"),
        nullable=False
    )

    day_of_week = db.Column(
        db.String(20),
        nullable=False
    )

    start_time = db.Column(
        db.Time,
        nullable=False
    )

    end_time = db.Column(
        db.Time,
        nullable=False
    )

    room = db.Column(
        db.String(50),
        nullable=True
    )

    school_class = db.relationship(
        "SchoolClass",
        backref=db.backref(
            "timetable_entries",
            lazy=True
        )
    )

    stream = db.relationship(
        "Stream",
        backref=db.backref(
            "timetable_entries",
            lazy=True
        )
    )

    subject = db.relationship(
        "Subject",
        backref=db.backref(
            "timetable_entries",
            lazy=True
        )
    )

    teacher = db.relationship(
        "Teacher",
        backref=db.backref(
            "timetable_entries",
            lazy=True
        )
    )

    def to_dict(self):
        return {
            "id": self.id,
            "class_id": self.class_id,
            "stream_id": self.stream_id,
            "subject_id": self.subject_id,
            "teacher_id": self.teacher_id,
            "day_of_week": self.day_of_week,
            "start_time": (
                self.start_time.isoformat()
                if self.start_time else None
            ),
            "end_time": (
                self.end_time.isoformat()
                if self.end_time else None
            ),
            "room": self.room
        }
