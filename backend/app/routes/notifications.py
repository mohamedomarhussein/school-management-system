from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import Notification
from app.utils.auth import role_required


notifications_bp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api/notifications"
)


def get_current_user_id():
    """Return the database ID of the authenticated user."""
    return int(get_jwt_identity())


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@notifications_bp.route("", methods=["GET"])
@role_required("admin")
def get_notifications():
    user_id = get_current_user_id()

    query = Notification.query.filter_by(user_id=user_id)

    unread_only = request.args.get("unread_only", "").lower()

    if unread_only in ("true", "1", "yes"):
        query = query.filter_by(is_read=False)

    notifications = query.order_by(
        Notification.created_at.desc(),
        Notification.id.desc()
    ).all()

    return jsonify({
        "success": True,
        "count": len(notifications),
        "data": [notification.to_dict() for notification in notifications]
    }), 200


# ============================================================
# GET UNREAD NOTIFICATION COUNT
# ============================================================

@notifications_bp.route("/unread-count", methods=["GET"])
@role_required("admin")
def get_unread_count():
    user_id = get_current_user_id()

    count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()

    return jsonify({
        "success": True,
        "unread_count": count
    }), 200


# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

@notifications_bp.route("/<int:notification_id>/read", methods=["PATCH"])
@role_required("admin")
def mark_notification_read(notification_id):
    user_id = get_current_user_id()

    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()

    if not notification:
        return jsonify({
            "success": False,
            "message": "Notification not found"
        }), 404

    if not notification.is_read:
        notification.is_read = True

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

            return jsonify({
                "success": False,
                "message": "Unable to mark notification as read"
            }), 500

    return jsonify({
        "success": True,
        "message": "Notification marked as read",
        "data": notification.to_dict()
    }), 200


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

@notifications_bp.route("/read-all", methods=["PATCH"])
@role_required("admin")
def mark_all_notifications_read():
    user_id = get_current_user_id()

    try:
        updated_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update(
            {Notification.is_read: True},
            synchronize_session=False
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "All notifications marked as read",
            "updated_count": updated_count
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to mark notifications as read"
        }), 500


# ============================================================
# DELETE NOTIFICATION
# ============================================================

@notifications_bp.route("/<int:notification_id>", methods=["DELETE"])
@role_required("admin")
def delete_notification(notification_id):
    user_id = get_current_user_id()

    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()

    if not notification:
        return jsonify({
            "success": False,
            "message": "Notification not found"
        }), 404

    try:
        db.session.delete(notification)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Notification deleted successfully"
        }), 200

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to delete notification"
        }), 500
