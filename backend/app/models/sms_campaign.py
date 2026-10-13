from datetime import datetime

from sqlalchemy import UniqueConstraint

from app.extensions import db


class SmsCampaign(db.Model):
    __tablename__ = "sms_campaigns"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200), nullable=False)

    message_type = db.Column(db.String(50), nullable=False)

    message = db.Column(db.Text, nullable=False)

    target_class_ids = db.Column(db.JSON, nullable=False, default=list)

    academic_year = db.Column(db.Integer, nullable=True)

    term = db.Column(db.String(50), nullable=True)

    status = db.Column(
        db.String(30),
        nullable=False,
        default="draft",
        index=True,
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    scheduled_at = db.Column(db.DateTime, nullable=True)

    sent_at = db.Column(db.DateTime, nullable=True)

    creator = db.relationship("User", foreign_keys=[created_by])

    recipients = db.relationship(
        "SmsCampaignRecipient",
        back_populates="campaign",
        cascade="all, delete-orphan",
        order_by="SmsCampaignRecipient.id",
    )

    def to_dict(self, include_recipients=False):
        data = {
            "id": self.id,
            "title": self.title,
            "message_type": self.message_type,
            "message": self.message,
            "target_class_ids": self.target_class_ids or [],
            "academic_year": self.academic_year,
            "term": self.term,
            "status": self.status,
            "created_by": self.created_by,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at else None
            ),
            "scheduled_at": (
                self.scheduled_at.isoformat()
                if self.scheduled_at else None
            ),
            "sent_at": (
                self.sent_at.isoformat()
                if self.sent_at else None
            ),
            "recipient_count": len(self.recipients),
        }

        if include_recipients:
            data["recipients"] = [
                recipient.to_dict()
                for recipient in self.recipients
            ]

        return data


class SmsCampaignRecipient(db.Model):
    __tablename__ = "sms_campaign_recipients"

    __table_args__ = (
        UniqueConstraint(
            "campaign_id",
            "phone",
            name="uq_sms_campaign_recipient_phone",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)

    campaign_id = db.Column(
        db.Integer,
        db.ForeignKey("sms_campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    phone = db.Column(db.String(20), nullable=False)

    parent_ids = db.Column(db.JSON, nullable=False, default=list)

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending",
    )

    provider_message_id = db.Column(db.String(200), nullable=True)

    error_message = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    sent_at = db.Column(db.DateTime, nullable=True)

    campaign = db.relationship(
        "SmsCampaign",
        back_populates="recipients",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "phone": self.phone,
            "parent_ids": self.parent_ids or [],
            "status": self.status,
            "provider_message_id": self.provider_message_id,
            "error_message": self.error_message,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "sent_at": (
                self.sent_at.isoformat()
                if self.sent_at else None
            ),
        }
