from flask import Blueprint, request, jsonify
from flask_mail import Message
from extensions import db, mail
from announcement.announcement import Announcement
from club.club import Club
from auth.user import User
from userclub.userclub import UserClub
from notification.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

announcement_bp = Blueprint('announcement', __name__)


def _can_manage_announcements(user_id, club_id):
    """Return True if the user is a club admin/representative or a platform Administrator."""
    user = db.session.get(User, user_id)
    if user and user.role_name == 'Administrator':
        return True
    user_club = UserClub.query.filter_by(user_id=user_id, club_id=club_id).first()
    return user_club is not None and user_club.role in ['admin', 'representative']


# Endpoint to create an announcement for a club. Only club admins/representatives and platform administrators can post.
@announcement_bp.route('/clubs/<int:club_id>/announcements', methods=['POST'])
@jwt_required()
def create_announcement(club_id):
    current_user_id = int(get_jwt_identity())

    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    if not _can_manage_announcements(current_user_id, club_id):
        return jsonify({'message': 'Unauthorized: Only admins and representatives can post announcements'}), 403

    data = request.get_json()
    title = data.get('title')
    body = data.get('body')

    if not all([title, body]):
        return jsonify({'message': 'title and body are required'}), 400

    announcement = Announcement(
        club_id=club_id,
        created_by=current_user_id,
        title=title,
        body=body
    )
    db.session.add(announcement)
    db.session.flush()  # assign announcement_id before creating notifications

    # Notify all club members except the poster
    members = UserClub.query.filter_by(club_id=club_id).all()
    notif_title = f"New announcement from {club.club_name}"
    notif_body = f"{title}: {body[:120]}{'...' if len(body) > 120 else ''}"

    for uc in members:
        if uc.user_id == current_user_id:
            continue
        member = db.session.get(User, uc.user_id)
        if not member:
            continue
        if member.notify_in_app:
            db.session.add(Notification(
                user_id=uc.user_id,
                title=notif_title,
                body=notif_body,
                club_id=club_id,
                announcement_id=announcement.announcement_id,
            ))

    db.session.commit()

    # Send email notifications (non-blocking — failures are logged, not raised)
    for uc in members:
        if uc.user_id == current_user_id:
            continue
        member = db.session.get(User, uc.user_id)
        if member and member.email and member.notify_email:
            try:
                msg = Message(
                    subject=f"[CampusConnect] New announcement from {club.club_name}",
                    recipients=[member.email],
                    body=(
                        f"Hi {member.first_name},\n\n"
                        f"{club.club_name} has posted a new announcement:\n\n"
                        f"{title}\n\n"
                        f"{body}\n\n"
                        f"— The CampusConnect Team"
                    ),
                )
                mail.send(msg)
            except Exception as e:
                print(f"[WARN] Failed to send announcement email to {member.email}: {e}")

    return jsonify({'message': 'Announcement created successfully', 'announcement_id': announcement.announcement_id}), 201


# Endpoint to list all announcements for a club. Public — no authentication required, for club discovery/browsing.
@announcement_bp.route('/clubs/<int:club_id>/announcements', methods=['GET'])
def get_club_announcements(club_id):
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    announcements = Announcement.query.filter_by(club_id=club_id).order_by(Announcement.created_at.desc()).all()
    data = [{
        'announcement_id': a.announcement_id,
        'club_id': a.club_id,
        'created_by': a.created_by,
        'title': a.title,
        'body': a.body,
        'created_at': a.created_at.isoformat(),
        'updated_at': a.updated_at.isoformat()
    } for a in announcements]

    return jsonify(data), 200


# Endpoint to get a specific announcement by ID. Accessible to all authenticated users.
@announcement_bp.route('/announcements/<int:announcement_id>', methods=['GET'])
@jwt_required()
def get_announcement(announcement_id):
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return jsonify({'message': 'Announcement not found'}), 404

    return jsonify({
        'announcement_id': announcement.announcement_id,
        'club_id': announcement.club_id,
        'created_by': announcement.created_by,
        'title': announcement.title,
        'body': announcement.body,
        'created_at': announcement.created_at.isoformat(),
        'updated_at': announcement.updated_at.isoformat()
    }), 200


# Endpoint to update an announcement. Only club admins/representatives and platform administrators can update.
@announcement_bp.route('/announcements/<int:announcement_id>', methods=['PATCH'])
@jwt_required()
def update_announcement(announcement_id):
    current_user_id = int(get_jwt_identity())

    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return jsonify({'message': 'Announcement not found'}), 404

    if not _can_manage_announcements(current_user_id, announcement.club_id):
        return jsonify({'message': 'Unauthorized: Only admins and representatives can update announcements'}), 403

    data = request.get_json()
    if 'title' in data:
        announcement.title = data['title']
    if 'body' in data:
        announcement.body = data['body']

    db.session.commit()
    return jsonify({'message': 'Announcement updated successfully'}), 200


# Endpoint to delete an announcement. Only club admins/representatives and platform administrators can delete.
@announcement_bp.route('/announcements/<int:announcement_id>', methods=['DELETE'])
@jwt_required()
def delete_announcement(announcement_id):
    current_user_id = int(get_jwt_identity())

    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return jsonify({'message': 'Announcement not found'}), 404

    if not _can_manage_announcements(current_user_id, announcement.club_id):
        return jsonify({'message': 'Unauthorized: Only admins and representatives can delete announcements'}), 403

    db.session.delete(announcement)
    db.session.commit()
    return jsonify({'message': 'Announcement deleted successfully'}), 200
