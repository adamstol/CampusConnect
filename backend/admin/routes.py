from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from auth.user import User
from club.club import Club
from event.event import Event

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


def _is_platform_admin(user_id):
    """Return True if the user is a platform Administrator."""
    user = db.session.get(User, user_id)
    return user is not None and user.role_name == 'Administrator'


# Endpoint to lock or unlock a user account. Only platform Administrators may perform this action.
# Locking an account covers both the "disable" (TC-044) and "lock" (TC-046) requirements, since
# is_account_enabled is not enforced anywhere in login() — is_account_locked is the only flag that
# actually blocks login.
@admin_bp.route('/users/<int:user_id>/lock-status', methods=['PATCH'])
@jwt_required()
def set_user_lock_status(user_id):
    current_user_id = int(get_jwt_identity())

    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can perform this action'}), 403

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    if 'is_account_locked' not in data:
        return jsonify({'message': 'is_account_locked is required'}), 400

    target_user.is_account_locked = bool(data['is_account_locked'])
    db.session.commit()

    return jsonify({
        'message': 'User account status updated successfully',
        'user_id': target_user.user_id,
        'is_account_locked': target_user.is_account_locked
    }), 200


# Endpoint to return summary counts for the admin dashboard. Only platform Administrators may access this.
@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    current_user_id = int(get_jwt_identity())

    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can view this dashboard'}), 403

    stats = {
        'total_clubs': Club.query.count(),
        'total_events': Event.query.count(),
        'total_users': User.query.count()
    }
    return jsonify(stats), 200


# Endpoint to delete a user account. Only platform Administrators may perform this action.
# UserClub and UserEvent rows cascade-delete automatically via the User model's
# relationship cascades — no manual cleanup needed here.
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(user_id):
    current_user_id = int(get_jwt_identity())

    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can perform this action'}), 403

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({'message': 'User not found'}), 404

    db.session.delete(target_user)
    db.session.commit()

    return jsonify({'message': 'User account deleted successfully'}), 200
