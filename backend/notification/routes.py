from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from notification.notification import Notification

notification_bp = Blueprint('notification', __name__)


@notification_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([{
        'notification_id': n.notification_id,
        'title': n.title,
        'body': n.body,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
        'club_id': n.club_id,
        'announcement_id': n.announcement_id,
    } for n in notifications]), 200


@notification_bp.route('/notifications/<int:notification_id>/read', methods=['PATCH'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = int(get_jwt_identity())
    notification = db.session.get(Notification, notification_id)
    if not notification or notification.user_id != user_id:
        return jsonify({'message': 'Notification not found'}), 404
    notification.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200


@notification_bp.route('/notifications/read-all', methods=['PATCH'])
@jwt_required()
def mark_all_notifications_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200
