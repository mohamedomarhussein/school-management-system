from app.extensions import db


class FeeStructure(db.Model):
    __tablename__ = "fee_structures"

    id = db.Column(db.Integer, primary_key=True)

    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id"),
        nullable=False
    )

    academic_year = db.Column(
        db.Integer,
        nullable=False
    )

    term = db.Column(
        db.String(50),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    description = db.Column(
        db.String(255),
        nullable=True
    )

    school_class = db.relationship(
        "SchoolClass",
        backref=db.backref(
            "fee_structures",
            lazy=True
        )
    )

    payments = db.relationship(
        "Payment",
        backref="fee_structure",
        lazy=True
    )

    __table_args__ = (
        db.UniqueConstraint(
            "class_id",
            "academic_year",
            "term",
            name="unique_class_fee_term"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "class_id": self.class_id,
            "academic_year": self.academic_year,
            "term": self.term,
            "amount": float(self.amount),
            "description": self.description
        }
