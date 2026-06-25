from flask import Blueprint, request, jsonify
from extensions import db
from event.event import Event
from club.club import Club
from userclub.userclub import UserClub
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone

event_bp = Blueprint('event', __name__, url_prefix='/events')

"""
Endpoint to create a new event. This endpoint is accessible only to users who are members of the club (Admin or Club Representative).
"""
@event_bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    
    # Get the JSON and JWT identity to identify the user creating the event.
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    club_id = data.get('club_id')
    event_name = data.get('event_name')
    description = data.get('description')
    event_date = data.get('event_date')
    location = data.get('location')

    if not all([club_id, event_name, event_date]):
        return jsonify({'message': 'club_id, event_name, and event_date are required'}), 400

    # Check if the club exists
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    # Check if the user is a member of the club with admin or representative role
    user_club = UserClub.query.filter_by(user_id=current_user_id, club_id=club_id).first()
    if not user_club or user_club.role not in ['admin', 'representative']:
        return jsonify({'message': 'Unauthorized: Only admins and representatives can create events'}), 403

    # Parse the event_date string to datetime
    try:
        event_datetime = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'message': 'Invalid event_date format. Use ISO format (e.g., 2024-01-01T12:00:00)'}), 400

    new_event = Event(
        club_id=club_id,
        event_name=event_name,
        description=description,
        event_date=event_datetime,
        location=location
    )
    db.session.add(new_event)
    db.session.commit()

    return jsonify({'message': 'Event created successfully', 'event_id': new_event.event_id}), 201


# Endpoint to get all events. This endpoint is accessible to all authenticated users.
@event_bp.route('/', methods=['GET'])
@jwt_required()
def get_events():
    
    # Query all events and return their details in a JSON format.
    events = Event.query.all()
    events_data = [{
        'event_id': event.event_id,
        'club_id': event.club_id,
        'club_name': event.club.club_name,
        'event_name': event.event_name,
        'description': event.description,
        'event_date': event.event_date.isoformat(),
        'location': event.location
    } for event in events]
    return jsonify(events_data), 200


# Endpoint to get a specific event by ID. This endpoint is accessible to all authenticated users.
@event_bp.route('/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    
    # Query the event by ID and return its details in a JSON format.
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    event_data = {
        'event_id': event.event_id,
        'club_id': event.club_id,
        'club_name': event.club.club_name,
        'event_name': event.event_name,
        'description': event.description,
        'event_date': event.event_date.isoformat(),
        'location': event.location
    }
    return jsonify(event_data), 200


# Endpoint to update an event's information. This endpoint is accessible only to members of the club.
@event_bp.route('/<int:event_id>', methods=['PATCH'])
@jwt_required()
def update_event(event_id):
    
    # Get the JWT identity and query the event by ID.
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # Check if the user is a member of the club with admin or representative role
    user_club = UserClub.query.filter_by(user_id=current_user_id, club_id=event.club_id).first()
    if not user_club or user_club.role not in ['admin', 'representative']:
        return jsonify({'message': 'Unauthorized: Only admins and representatives can update events'}), 403

    data = request.get_json()
    if 'event_name' in data:
        event.event_name = data['event_name']
    if 'description' in data:
        event.description = data['description']
    if 'event_date' in data:
        try:
            event_datetime = datetime.fromisoformat(data['event_date'].replace('Z', '+00:00'))
            event.event_date = event_datetime
        except ValueError:
            return jsonify({'message': 'Invalid event_date format. Use ISO format (e.g., 2024-01-01T12:00:00)'}), 400
    if 'location' in data:
        event.location = data['location']

    db.session.commit()
    return jsonify({'message': 'Event updated successfully'}), 200


# Endpoint to delete an event. This endpoint is accessible only to members of the club.
@event_bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    
    # Get the JWT identity and query the event by ID.
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # Check if the user is a member of the club with admin or representative role
    user_club = UserClub.query.filter_by(user_id=current_user_id, club_id=event.club_id).first()
    if not user_club or user_club.role not in ['admin', 'representative']:
        return jsonify({'message': 'Unauthorized: Only admins and representatives can update events'}), 403

    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Event deleted successfully'}), 200


# Endpoint to get all events for a specific club. This endpoint is accessible to all authenticated users.
@event_bp.route('/club/<int:club_id>', methods=['GET'])
@jwt_required()
def get_club_events(club_id):
    
    # Query the club by ID and return a list of its events in a JSON format.
    club = db.session.get(Club, club_id)
    if not club:
        return jsonify({'message': 'Club not found'}), 404

    events = Event.query.filter_by(club_id=club_id).all()
    events_data = [{
        'event_id': event.event_id,
        'event_name': event.event_name,
        'description': event.description,
        'event_date': event.event_date.isoformat(),
        'location': event.location
    } for event in events]
    return jsonify(events_data), 200
