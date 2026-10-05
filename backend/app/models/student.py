from datetime import datetime

from app.extensions import db


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)

    admission_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True
    )

    first_name = db.Column(db.String(100), nullable=False)

    last_name = db.Column(db.String(100), nullable=False)

    gender = db.Column(db.String(20), nullable=False)

    date_of_birth = db.Column(db.Date, nullable=True)

    phone = db.Column(db.String(30), nullable=True)

    address = db.Column(db.String(255), nullable=True)

    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id"),
        nullable=True
    )

    stream_id = db.Column(
        db.Integer,
        db.ForeignKey("streams.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "admission_number": self.admission_number,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "gender": self.gender,
            "date_of_birth": self.date_of_birth.isoformat()
            if self.date_of_birth else None,
            "phone": self.phone,
            "address": self.address,
            "class_id": self.class_id,
            "stream_id": self.stream_id,
            "created_at": self.created_at.isoformat()
            if self.created_at else None
        }
