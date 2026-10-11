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
        teacher_name = None

        if self.teacher and self.teacher.user:
            teacher_name = self.teacher.user.full_name

        return {
            "id": self.id,

            "teacher_id": self.teacher_id,
            "teacher_name": teacher_name,
            "employee_number": (
                self.teacher.employee_number
                if self.teacher
                else None
            ),

            "subject_id": self.subject_id,
            "subject_name": (
                self.subject.name
                if self.subject
                else None
            ),
            "subject_code": (
                self.subject.code
                if self.subject
                else None
            ),

            "class_id": self.class_id,
            "class_name": (
                self.school_class.name
                if self.school_class
                else None
            ),

            "stream_id": self.stream_id,
            "stream_name": (
                self.stream.name
                if self.stream
                else None
            )
        }
