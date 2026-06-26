from flask import Blueprint, request, jsonify
from extensions import db
from event.event import Event
from club.club import Club
from userclub.userclub import UserClub
from userevent.userevent import UserEvent
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


# Endpoint to register for an event. This endpoint is accessible to all authenticated users.
@event_bp.route('/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_for_event(event_id):

    # Get the JWT identity and query the event by ID.
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    existing_registration = UserEvent.query.filter_by(user_id=current_user_id, event_id=event_id).first()
    if existing_registration:
        return jsonify({'message': 'Already registered for this event'}), 400

    user_event = UserEvent(user_id=current_user_id, event_id=event_id)
    db.session.add(user_event)
    db.session.commit()

    return jsonify({'message': 'Registered for event successfully'}), 200


# Endpoint to cancel an event registration. This endpoint is accessible to all authenticated users.
@event_bp.route('/<int:event_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_registration(event_id):

    # Get the JWT identity and query the event by ID.
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    registration = UserEvent.query.filter_by(user_id=current_user_id, event_id=event_id).first()
    if not registration:
        return jsonify({'message': 'Not registered for this event'}), 400

    db.session.delete(registration)
    db.session.commit()

    return jsonify({'message': 'Registration cancelled successfully'}), 200


# Endpoint to get all attendees of an event. This endpoint is accessible only to the club's Admin or Club Representative.
@event_bp.route('/<int:event_id>/attendees', methods=['GET'])
@jwt_required()
def get_event_attendees(event_id):

    # Get the JWT identity and query the event by ID.
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # Check if the user is a member of the club with admin or representative role
    user_club = UserClub.query.filter_by(user_id=current_user_id, club_id=event.club_id).first()
    if not user_club or user_club.role not in ['admin', 'representative']:
        return jsonify({'message': 'Unauthorized: Only admins and representatives can view attendees'}), 403

    attendees = [{
        'user_id': registration.user_id,
        'first_name': registration.user.first_name,
        'last_name': registration.user.last_name,
        'email': registration.user.email,
        'status': registration.status,
        'registered_at': registration.registered_at.isoformat()
    } for registration in event.user_events]
    return jsonify(attendees), 200


# Endpoint to get all events the current user is registered for. This endpoint is accessible to all authenticated users.
@event_bp.route('/my-events', methods=['GET'])
@jwt_required()
def get_my_events():

    # Get the JWT identity and query the UserEvent table for all events the user is registered for.
    current_user_id = int(get_jwt_identity())
    registrations = UserEvent.query.filter_by(user_id=current_user_id).all()
    events = [{
        'event_id': registration.event_id,
        'event_name': registration.event.event_name,
        'club_id': registration.event.club_id,
        'club_name': registration.event.club.club_name,
        'event_date': registration.event.event_date.isoformat(),
        'location': registration.event.location,
        'status': registration.status,
        'registered_at': registration.registered_at.isoformat()
    } for registration in registrations]
    return jsonify(events), 200
