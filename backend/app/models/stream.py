from app.extensions import db


class Stream(db.Model):
    __tablename__ = "streams"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(50),
        nullable=False
    )

    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id"),
        nullable=False
    )

    students = db.relationship(
        "Student",
        backref="stream",
        lazy=True
    )

    __table_args__ = (
        db.UniqueConstraint(
            "name",
            "class_id",
            name="unique_stream_per_class"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "class_id": self.class_id
        }
