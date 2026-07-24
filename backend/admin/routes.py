from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from auth.user import User
from club.club import Club
from event.event import Event
from userclub.userclub import UserClub

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


def _is_platform_admin(user_id):
    """Return True if the user is a platform Administrator."""
    user = db.session.get(User, user_id)
    return user is not None and user.role_name == 'admin'


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

    # Reset failed login attempts when unlocking an account
    if not target_user.is_account_locked:
        target_user.failed_login_attempts = 0

    db.session.commit()

    return jsonify({
        'message': 'User account status updated successfully',
        'user_id': target_user.user_id,
        'is_account_locked': target_user.is_account_locked,
        'failed_login_attempts': target_user.failed_login_attempts
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


# Endpoint to list all users. Only platform Administrators may perform this action.
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    current_user_id = int(get_jwt_identity())

    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can perform this action'}), 403

    users = User.query.order_by(User.user_id.asc()).all()
    return jsonify([{
        'user_id': u.user_id,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'email': u.email,
        'role_name': u.role_name,
        'is_account_locked': u.is_account_locked,
        'is_account_enabled': u.is_account_enabled,
        'created_at': u.created_at.isoformat(),
    } for u in users]), 200


# Endpoint to change a user's role. Only platform Administrators may perform this action.
@admin_bp.route('/users/<int:user_id>/role', methods=['PATCH'])
@jwt_required()
def set_user_role(user_id):
    current_user_id = int(get_jwt_identity())

    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can perform this action'}), 403

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    role_name = data.get('role_name')
    allowed_roles = ('Student', 'Club Representative', 'Administrator')
    if role_name not in allowed_roles:
        return jsonify({'message': f'Invalid role. Must be one of: {allowed_roles}'}), 400

    target_user.role_name = role_name
    db.session.commit()

    return jsonify({
        'message': 'User role updated successfully',
        'user_id': target_user.user_id,
        'role_name': target_user.role_name,
    }), 200


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

# Endpoint to retrieve failed login attempt information.
# Only platform Administrators may access this.
@admin_bp.route('/security', methods=['GET'])
@jwt_required()
def get_security_logs():

    current_user_id = int(get_jwt_identity())

    if not _is_platform_admin(current_user_id):
        return jsonify({
            'message': 'Unauthorized: Only administrators can view security data'
        }), 403

    users = User.query.all()

    security_logs = []

    for user in users:
        security_logs.append({
            'user_id': user.user_id,
            'email': user.email,
            'failed_login_attempts': user.failed_login_attempts
        })

    return jsonify(security_logs), 200

# Endpoint to retrieve all users for admin user management.
# Only platform Administrators may access this.
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():

    current_user_id = int(get_jwt_identity())

    if not _is_platform_admin(current_user_id):
        return jsonify({
            'message': 'Unauthorized: Only administrators can view users'
        }), 403

    users = User.query.all()

    user_list = []

    for user in users:

        # Determine if user is a club representative
        is_club_representative = UserClub.query.filter_by(
            user_id=user.user_id,
            role='admin'
        ).first() is not None

        role = (
            'Club Representative'
            if is_club_representative
            else 'Student'
        )

        status = (
            'Inactive'
            if user.is_account_locked
            else 'Active'
        )

        user_list.append({
            'user_id': user.user_id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': role,
            'status': status
        })

    return jsonify(user_list), 200

# Endpoint to list all pending club applications awaiting review. Only platform Administrators.
@admin_bp.route('/clubs/pending', methods=['GET'])
@jwt_required()
def get_pending_clubs():
    current_user_id = int(get_jwt_identity())
    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can view pending applications'}), 403

    pending_clubs = Club.query.filter_by(status='pending').all()
    data = [{
        'club_id': club.club_id,
        'club_name': club.club_name,
        'description': club.description,
        'created_at': club.created_at.isoformat()
    } for club in pending_clubs]
    return jsonify(data), 200


# Endpoint to approve a pending club application. Only platform Administrators.
@admin_bp.route('/clubs/<int:club_id>/approve', methods=['PATCH'])
@jwt_required()
def approve_club(club_id):
    current_user_id = int(get_jwt_identity())
    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can approve club applications'}), 403

    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    club.status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Club application approved', 'club_id': club.club_id, 'status': club.status}), 200


# Endpoint to reject a pending club application. Only platform Administrators.
@admin_bp.route('/clubs/<int:club_id>/reject', methods=['PATCH'])
@jwt_required()
def reject_club(club_id):
    current_user_id = int(get_jwt_identity())
    if not _is_platform_admin(current_user_id):
        return jsonify({'message': 'Unauthorized: Only administrators can reject club applications'}), 403

    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    club.status = 'rejected'
    db.session.commit()
    return jsonify({'message': 'Club application rejected', 'club_id': club.club_id, 'status': club.status}), 200



