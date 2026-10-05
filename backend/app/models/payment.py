from datetime import datetime

from app.extensions import db


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    fee_structure_id = db.Column(
        db.Integer,
        db.ForeignKey("fee_structures.id"),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    payment_date = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    payment_method = db.Column(
        db.String(50),
        nullable=False
    )

    reference_number = db.Column(
        db.String(100),
        unique=True,
        nullable=True
    )

    received_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    remarks = db.Column(
        db.String(255),
        nullable=True
    )

    student = db.relationship(
        "Student",
        backref=db.backref(
            "payments",
            lazy=True
        )
    )

    received_by_user = db.relationship(
        "User",
        backref=db.backref(
            "received_payments",
            lazy=True
        )
    )

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "fee_structure_id": self.fee_structure_id,
            "amount": float(self.amount),
            "payment_date": (
                self.payment_date.isoformat()
                if self.payment_date else None
            ),
            "payment_method": self.payment_method,
            "reference_number": self.reference_number,
            "received_by": self.received_by,
            "remarks": self.remarks
        }
