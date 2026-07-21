from flask import Blueprint, request, jsonify
from extensions import db
from event.event import Event
from club.club import Club
from userclub.userclub import UserClub
from userevent.userevent import UserEvent
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, time, timedelta, timezone
from auth.user import User

event_bp = Blueprint('event', __name__, url_prefix='/events')


def serialize_event(event):
    return {
        'event_id': event.event_id,
        'club_id': event.club_id,
        'club_name': event.club.club_name,
        'event_name': event.event_name,
        'description': event.description,
        'event_date': event.event_date.isoformat(),
        'location': event.location
    }

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
    events_data = [serialize_event(event) for event in events]
    return jsonify(events_data), 200


# Public endpoint for homepage event discovery.
@event_bp.route('/public', methods=['GET'])
def get_public_events():
    events = Event.query.order_by(Event.event_date.asc()).all()
    return jsonify([serialize_event(event) for event in events]), 200


# Public endpoint for events happening during the current Monday-Sunday week.
@event_bp.route('/this-week', methods=['GET'])
def get_events_this_week():
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=7)

    start_datetime = datetime.combine(week_start, time.min)
    end_datetime = datetime.combine(week_end, time.min)

    events = (
        Event.query
        .filter(Event.event_date >= start_datetime, Event.event_date < end_datetime)
        .order_by(Event.event_date.asc())
        .all()
    )
    return jsonify([serialize_event(event) for event in events]), 200


# Endpoint to get events for clubs the current user belongs to.
@event_bp.route('/my-club-events', methods=['GET'])
@jwt_required()
def get_my_club_events():
    current_user_id = int(get_jwt_identity())
    memberships = UserClub.query.filter_by(user_id=current_user_id).all()
    club_ids = [membership.club_id for membership in memberships]

    if not club_ids:
        return jsonify([]), 200

    events = (
        Event.query
        .filter(Event.club_id.in_(club_ids))
        .order_by(Event.event_date.asc())
        .all()
    )
    return jsonify([serialize_event(event) for event in events]), 200


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
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    user_club = UserClub.query.filter_by(user_id=current_user_id, club_id=event.club_id).first()
    is_owner = user_club is not None and user_club.role in ['admin', 'representative']

    requesting_user = db.session.get(User, current_user_id)
    is_platform_admin = requesting_user is not None and requesting_user.role_name == 'Administrator'

    if not (is_owner or is_platform_admin):
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
# An optional ?status= query parameter filters the results by RSVP status (e.g. ?status=attending).
@event_bp.route('/my-events', methods=['GET'])
@jwt_required()
def get_my_events():

    # Get the JWT identity and query the UserEvent table for all events the user is registered for.
    current_user_id = int(get_jwt_identity())
    query = UserEvent.query.filter_by(user_id=current_user_id)

    # Optionally filter by RSVP status if provided.
    status_filter = request.args.get('status')
    if status_filter:
        query = query.filter_by(status=status_filter)

    registrations = query.all()
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


# Valid RSVP statuses a user can set for an event.
VALID_RSVP_STATUSES = ['attending', 'not_attending', 'maybe']


# Endpoint to RSVP to an event (or update an existing RSVP). This endpoint is accessible to all authenticated users.
@event_bp.route('/<int:event_id>/rsvp', methods=['POST'])
@jwt_required()
def rsvp_to_event(event_id):

    # Get the JWT identity and query the event by ID.
    current_user_id = int(get_jwt_identity())
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # Validate the requested RSVP status.
    data = request.get_json()
    status = data.get('status')
    if status not in VALID_RSVP_STATUSES:
        return jsonify({'message': "status is required and must be one of: 'attending', 'not_attending', 'maybe'"}), 400

    # Update the existing RSVP if there is one, otherwise create a new one.
    registration = UserEvent.query.filter_by(user_id=current_user_id, event_id=event_id).first()
    if registration:
        registration.status = status
    else:
        registration = UserEvent(user_id=current_user_id, event_id=event_id, status=status)
        db.session.add(registration)
    db.session.commit()

    return jsonify({'message': f'RSVP updated to {status}'}), 200


# Endpoint to get the number of users registered for an event, broken down by RSVP status. This endpoint is accessible to all authenticated users.
@event_bp.route('/<int:event_id>/registration-count', methods=['GET'])
@jwt_required()
def get_event_registration_count(event_id):

    # Query the event by ID.
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # Count registrations grouped by RSVP status.
    counts = {
        'event_id': event_id,
        'attending': UserEvent.query.filter_by(event_id=event_id, status='attending').count(),
        'not_attending': UserEvent.query.filter_by(event_id=event_id, status='not_attending').count(),
        'maybe': UserEvent.query.filter_by(event_id=event_id, status='maybe').count(),
        'total': UserEvent.query.filter_by(event_id=event_id).count()
    }
    return jsonify(counts), 200


# Endpoint to get the number of events the current user is registered for, broken down by RSVP status. This endpoint is accessible to all authenticated users.
@event_bp.route('/my-events/count', methods=['GET'])
@jwt_required()
def get_my_events_count():

    # Get the JWT identity and count the current user's registrations grouped by RSVP status.
    current_user_id = int(get_jwt_identity())
    counts = {
        'attending': UserEvent.query.filter_by(user_id=current_user_id, status='attending').count(),
        'not_attending': UserEvent.query.filter_by(user_id=current_user_id, status='not_attending').count(),
        'maybe': UserEvent.query.filter_by(user_id=current_user_id, status='maybe').count(),
        'total': UserEvent.query.filter_by(user_id=current_user_id).count()
    }
    return jsonify(counts), 200
