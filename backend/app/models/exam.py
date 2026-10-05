from app.extensions import db


class Exam(db.Model):
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        nullable=False
    )

    term = db.Column(
        db.String(50),
        nullable=False
    )

    academic_year = db.Column(
        db.Integer,
        nullable=False
    )

    exam_date = db.Column(
        db.Date,
        nullable=True
    )

    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id"),
        nullable=False
    )

    school_class = db.relationship(
        "SchoolClass",
        backref=db.backref(
            "exams",
            lazy=True
        )
    )

    results = db.relationship(
        "Result",
        backref="exam",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "term": self.term,
            "academic_year": self.academic_year,
            "exam_date": self.exam_date.isoformat()
            if self.exam_date else None,
            "class_id": self.class_id
        }
