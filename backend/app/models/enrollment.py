from app.extensions import db


class Enrollment(db.Model):
    __tablename__ = "enrollments"

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

    stream_id = db.Column(
        db.Integer,
        db.ForeignKey("streams.id"),
        nullable=True
    )

    academic_year = db.Column(
        db.Integer,
        nullable=False
    )

    is_current = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    student = db.relationship(
        "Student",
        backref=db.backref(
            "enrollments",
            lazy=True
        )
    )

    school_class = db.relationship(
        "SchoolClass",
        backref=db.backref(
            "enrollments",
            lazy=True
        )
    )

    stream = db.relationship(
        "Stream",
        backref=db.backref(
            "enrollments",
            lazy=True
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "student_id",
            "academic_year",
            name="unique_student_academic_year"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "class_id": self.class_id,
            "stream_id": self.stream_id,
            "academic_year": self.academic_year,
            "is_current": self.is_current
        }
