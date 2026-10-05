from app.extensions import db


class Teacher(db.Model):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    employee_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True
    )

    phone = db.Column(db.String(30), nullable=True)

    qualification = db.Column(db.String(150), nullable=True)

    user = db.relationship(
        "User",
        backref=db.backref("teacher_profile", uselist=False)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "employee_number": self.employee_number,
            "phone": self.phone,
            "qualification": self.qualification,
            "full_name": self.user.full_name if self.user else None,
            "email": self.user.email if self.user else None
        }
