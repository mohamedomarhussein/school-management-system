from app.extensions import db


class Parent(db.Model):
    __tablename__ = "parents"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    phone = db.Column(db.String(30), nullable=True)

    address = db.Column(db.String(255), nullable=True)

    user = db.relationship(
        "User",
        backref=db.backref("parent_profile", uselist=False)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "phone": self.phone,
            "address": self.address,
            "full_name": self.user.full_name if self.user else None,
            "email": self.user.email if self.user else None
        }
