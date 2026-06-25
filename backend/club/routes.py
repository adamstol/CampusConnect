from flask import Blueprint, request, jsonify
from extensions import db
from club.club import Club
from userclub.userclub import UserClub
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone

club_bp = Blueprint('club', __name__, url_prefix='/clubs')

"""
Endpoint to create a new club. This endpoint is accessible only to users with the role of 'Club Representative' or 'Admin'.
An Admin or Club Representative can create many clubs, but each club can only have one Admin or Club Representative.
"""
@club_bp.route('/', methods=['POST'])
@jwt_required()
def create_club():
    
    #Get the JSON and JWT identity to identify the user creating the club.
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    club_name = data.get('club_name')
    description = data.get('description')

    if not club_name:
        return jsonify({'message': 'Club name is required'}), 400

    existing_club = Club.query.filter_by(club_name=club_name).first()
    if existing_club:
        return jsonify({'message': 'Club name already exists'}), 400

    new_club = Club(club_name=club_name, description=description)
    db.session.add(new_club)
    db.session.commit()

    user_club = UserClub(user_id=current_user_id, club_id=new_club.club_id, role='admin')
    db.session.add(user_club)
    db.session.commit()

    return jsonify({'message': 'Club created successfully', 'club_id': new_club.club_id}), 201


# Endpoint to get all clubs. This endpoint is accessible to all authenticated users.
@club_bp.route('/', methods=['GET'])
@jwt_required()
def get_clubs():
    
    # Query all clubs and return their details in a JSON format.
    clubs = Club.query.all()
    clubs_data = [{'club_id': club.club_id, 'club_name': club.club_name, 'description': club.description} for club in clubs]
    return jsonify(clubs_data), 200


# Endpoint to get a specific club by ID. This endpoint is accessible to all authenticated users.
@club_bp.route('/<int:club_id>', methods=['GET'])
@jwt_required()
def get_club(club_id):
    
    # Query the club by ID and return its details in a JSON format. 
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    club_data = {'club_id': club.club_id, 'club_name': club.club_name, 'description': club.description}
    return jsonify(club_data), 200

# Endpoint to update a club's information. This endpoint is accessible only to the club's Admin or Club Representative.
@club_bp.route('/<int:club_id>', methods=['PATCH'])
@jwt_required()
def update_club(club_id):
    
    # Get the JWT idenetity and query the club by ID.
    current_user_id = int(get_jwt_identity())
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    user_club = UserClub.query.filter_by(user_id=current_user_id, club_id=club_id).first()
    if not user_club or user_club.role not in ['admin', 'representative']:
        return jsonify({'message': 'Unauthorized: Only admins and representatives can perform this action'}), 403

    data = request.get_json()
    if 'club_name' in data:
        existing_club = Club.query.filter_by(club_name=data['club_name']).first()
        if existing_club and existing_club.club_id != club_id:
            return jsonify({'message': 'Club name already exists'}), 400
        club.club_name = data['club_name']
    if 'description' in data:
        club.description = data['description']

    db.session.commit()
    return jsonify({'message': 'Club updated successfully'}), 200


# Endpoint to delete a club. This endpoint is accessible only to the club's Admin or Club Representative.
@club_bp.route('/<int:club_id>', methods=['DELETE'])
@jwt_required()
def delete_club(club_id):
    
    # Get the JWT identity and query the club by ID. 
    current_user_id = int(get_jwt_identity())
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    user_club = UserClub.query.filter_by(user_id=current_user_id, club_id=club_id).first()
    if not user_club or user_club.role not in ['admin', 'representative']:
        return jsonify({'message': 'Unauthorized: Only admins and representatives can perform this action'}), 403

    db.session.delete(club)
    db.session.commit()
    return jsonify({'message': 'Club deleted successfully'}), 200


# Endpoint to join a club. This endpoint is accessible to all authenticated users.
@club_bp.route('/<int:club_id>/join', methods=['POST'])
@jwt_required()
def join_club(club_id):
    
    # Get the JWT identity and query the club by ID.
    current_user_id = int(get_jwt_identity())
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    existing_membership = UserClub.query.filter_by(user_id=current_user_id, club_id=club_id).first()
    if existing_membership:
        return jsonify({'message': 'Already a member of this club'}), 400

    user_club = UserClub(user_id=current_user_id, club_id=club_id)
    db.session.add(user_club)
    db.session.commit()

    return jsonify({'message': 'Joined club successfully'}), 200

# Endpoint to leave a club. This endpoint is accessible to all authenticated users.
@club_bp.route('/<int:club_id>/leave', methods=['POST'])
@jwt_required()
def leave_club(club_id):
    
    # Get the JWT identity and query the club by ID. 
    current_user_id = int(get_jwt_identity())
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    membership = UserClub.query.filter_by(user_id=current_user_id, club_id=club_id).first()
    if not membership:
        return jsonify({'message': 'Not a member of this club'}), 400

    db.session.delete(membership)
    db.session.commit()

    return jsonify({'message': 'Left club successfully'}), 200


# Endpoint to get all members of a club. This endpoint is accessible to all authenticated users.
@club_bp.route('/<int:club_id>/members', methods=['GET'])
@jwt_required()
def get_club_members(club_id):
    # Query the club by ID and return a list of its members in a JSON format.
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    members = [{'user_id': membership.user_id, 'role': membership.role, 'joined_at': membership.joined_at.isoformat()} for membership in club.user_clubs]
    return jsonify(members), 200


# Endpoint to get all clubs a user is a member of. This endpoint is accessible to all authenticated users.
@club_bp.route('/my-clubs', methods=['GET'])
@jwt_required()
def get_my_clubs():
    
    # Get the JWT identity and query the UserClub table for all clubs the user is a member of
    current_user_id = int(get_jwt_identity())
    memberships = UserClub.query.filter_by(user_id=current_user_id).all()
    clubs = [{'club_id': membership.club_id, 'club_name': membership.club.club_name, 'role': membership.role, 'joined_at': membership.joined_at.isoformat()} for membership in memberships]
    return jsonify(clubs), 200


# Endpoint to show the number of clubs the admin or club representative is managing. This endpoint is accessible only to the club's Admin or Club Representative.
@club_bp.route('/my-managed-clubs', methods=['GET'])
@jwt_required()
def get_my_managed_clubs():
    # Get the JWT identity and query the UserClub table for all clubs the user is managing
    current_user_id = int(get_jwt_identity())
    memberships = UserClub.query.filter_by(user_id=current_user_id).filter(UserClub.role.in_(['admin', 'representative'])).all()
    managed_clubs = [{'club_id': membership.club_id, 'club_name': membership.club.club_name, 'role': membership.role} for membership in memberships]
    return jsonify(managed_clubs), 200