from app.extensions import db


class StudentParent(db.Model):
    __tablename__ = "student_parents"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    parent_id = db.Column(
        db.Integer,
        db.ForeignKey("parents.id"),
        nullable=False
    )

    relationship_type = db.Column(
        db.String(50),
        nullable=False,
        default="Parent"
    )

    is_primary = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    student = db.relationship(
        "Student",
        backref=db.backref(
            "parent_links",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    parent = db.relationship(
        "Parent",
        backref=db.backref(
            "student_links",
            lazy=True,
            cascade="all, delete-orphan"
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "student_id",
            "parent_id",
            name="unique_student_parent"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "parent_id": self.parent_id,
            "relationship_type": self.relationship_type,
            "is_primary": self.is_primary
        }
