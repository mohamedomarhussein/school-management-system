from app.extensions import db


class TeacherSubject(db.Model):
    __tablename__ = "teacher_subjects"

    id = db.Column(db.Integer, primary_key=True)

    teacher_id = db.Column(
        db.Integer,
        db.ForeignKey("teachers.id"),
        nullable=False
    )

    subject_id = db.Column(
        db.Integer,
        db.ForeignKey("subjects.id"),
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

    teacher = db.relationship(
        "Teacher",
        backref=db.backref(
            "subject_assignments",
            lazy=True
        )
    )

    school_class = db.relationship(
        "SchoolClass",
        backref=db.backref(
            "teacher_subject_assignments",
            lazy=True
        )
    )

    stream = db.relationship(
        "Stream",
        backref=db.backref(
            "teacher_subject_assignments",
            lazy=True
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "teacher_id",
            "subject_id",
            "class_id",
            "stream_id",
            name="unique_teacher_subject_assignment"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "teacher_id": self.teacher_id,
            "subject_id": self.subject_id,
            "class_id": self.class_id,
            "stream_id": self.stream_id
        }
