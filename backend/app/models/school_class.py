from app.extensions import db


class SchoolClass(db.Model):
    __tablename__ = "classes"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.String(255),
        nullable=True
    )

    level = db.Column(
        db.String(50),
        nullable=False
    )

    streams = db.relationship(
        "Stream",
        backref="school_class",
        lazy=True
    )

    students = db.relationship(
        "Student",
        backref="school_class",
        lazy=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "level": self.level
        }
