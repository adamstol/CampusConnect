import os
import boto3
from botocore.exceptions import ClientError
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from club.club import Club
from event.event import Event
from userclub.userclub import UserClub
from auth.user import User

upload_bp = Blueprint('upload', __name__, url_prefix='/upload')


def _s3_client():
    return boto3.client(
        's3',
        region_name=os.getenv('AWS_S3_REGION'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    )


def _is_club_manager(user_id: int, club_id: int) -> bool:
    user = db.session.get(User, user_id)
    if user and user.role_name == 'Administrator':
        return True
    membership = UserClub.query.filter_by(user_id=user_id, club_id=club_id).first()
    return membership is not None and membership.role in ('admin', 'representative')


# Returns a presigned PUT URL so the frontend can upload a club logo directly to S3.
# Only club admins/representatives and platform administrators can call this.
@upload_bp.route('/clubs/<int:club_id>/logo', methods=['POST'])
@jwt_required()
def club_logo_upload_url(club_id):
    current_user_id = int(get_jwt_identity())
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404
    if not _is_club_manager(current_user_id, club_id):
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json() or {}
    content_type = data.get('content_type', 'image/jpeg')
    allowed = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
    if content_type not in allowed:
        return jsonify({'message': f'content_type must be one of {sorted(allowed)}'}), 400

    bucket = os.getenv('AWS_S3_BUCKET')
    ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
    key = f'clubs/{club_id}/logo.{ext}'
    public_url = f'https://{bucket}.s3.{os.getenv("AWS_S3_REGION")}.amazonaws.com/{key}'

    try:
        presigned_url = _s3_client().generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket, 'Key': key, 'ContentType': content_type},
            ExpiresIn=300,
        )
    except ClientError as e:
        return jsonify({'message': 'Could not generate upload URL', 'error': str(e)}), 500

    club.logo_url = public_url
    db.session.commit()

    return jsonify({'upload_url': presigned_url, 'public_url': public_url}), 200


# Returns a presigned PUT URL so the frontend can upload an event image directly to S3.
# Only club admins/representatives and platform administrators can call this.
@upload_bp.route('/events/<int:event_id>/image', methods=['POST'])
@jwt_required()
def event_image_upload_url(event_id):
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404
    if not _is_club_manager(current_user_id, event.club_id):
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json() or {}
    content_type = data.get('content_type', 'image/jpeg')
    allowed = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
    if content_type not in allowed:
        return jsonify({'message': f'content_type must be one of {sorted(allowed)}'}), 400

    bucket = os.getenv('AWS_S3_BUCKET')
    ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
    key = f'events/{event_id}/image.{ext}'
    public_url = f'https://{bucket}.s3.{os.getenv("AWS_S3_REGION")}.amazonaws.com/{key}'

    try:
        presigned_url = _s3_client().generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket, 'Key': key, 'ContentType': content_type},
            ExpiresIn=300,
        )
    except ClientError as e:
        return jsonify({'message': 'Could not generate upload URL', 'error': str(e)}), 500

    event.image_url = public_url
    db.session.commit()

    return jsonify({'upload_url': presigned_url, 'public_url': public_url}), 200
