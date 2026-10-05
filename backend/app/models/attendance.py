from app.extensions import db


class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id"),
        nullable=False
    )

    attendance_date = db.Column(
        db.Date,
        nullable=False
    )

    status = db.Column(
        db.String(20),
        nullable=False
    )

    remarks = db.Column(
        db.String(255),
        nullable=True
    )

    recorded_by = db.Column(
        db.Integer,
        db.ForeignKey("teachers.id"),
        nullable=True
    )

    student = db.relationship(
        "Student",
        backref=db.backref(
            "attendance_records",
            lazy=True
        )
    )

    school_class = db.relationship(
        "SchoolClass",
        backref=db.backref(
            "attendance_records",
            lazy=True
        )
    )

    teacher = db.relationship(
        "Teacher",
        backref=db.backref(
            "attendance_records",
            lazy=True
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "student_id",
            "attendance_date",
            name="unique_student_attendance_date"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "class_id": self.class_id,
            "attendance_date": (
                self.attendance_date.isoformat()
                if self.attendance_date else None
            ),
            "status": self.status,
            "remarks": self.remarks,
            "recorded_by": self.recorded_by
        }
