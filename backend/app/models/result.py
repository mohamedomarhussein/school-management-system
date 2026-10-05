from app.extensions import db


class Result(db.Model):
    __tablename__ = "results"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    subject_id = db.Column(
        db.Integer,
        db.ForeignKey("subjects.id"),
        nullable=False
    )

    exam_id = db.Column(
        db.Integer,
        db.ForeignKey("exams.id"),
        nullable=False
    )

    marks = db.Column(
        db.Float,
        nullable=False
    )

    grade = db.Column(
        db.String(10),
        nullable=True
    )

    remarks = db.Column(
        db.String(255),
        nullable=True
    )

    student = db.relationship(
        "Student",
        backref=db.backref(
            "results",
            lazy=True
        )
    )

    subject = db.relationship(
        "Subject",
        backref=db.backref(
            "results",
            lazy=True
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "student_id",
            "subject_id",
            "exam_id",
            name="unique_student_subject_exam"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "subject_id": self.subject_id,
            "exam_id": self.exam_id,
            "marks": self.marks,
            "grade": self.grade,
            "remarks": self.remarks
        }
