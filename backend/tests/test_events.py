import pytest
from datetime import datetime, timezone
from extensions import db
from club.club import Club
from event.event import Event
from userevent.userevent import UserEvent
from flask_jwt_extended import create_access_token
@pytest.fixture
def auth_headers(app):
    """Generates valid JWT auth headers using flask_jwt_extended."""
    with app.app_context():
        # Create a token for a test user (identity="1")
        access_token = create_access_token(identity="1")
        return {"Authorization": f"Bearer {access_token}"}
@pytest.fixture
def auth_headers_user42(app):
    """Generate valid JWT Authorization headers for user_id=42, used for registration tests."""
    with app.app_context():
        access_token = create_access_token(identity="42")
        return {"Authorization": f"Bearer {access_token}"}
@pytest.fixture
def seed_events(app):
    """Seed in-memory database with a club and events for TC-015."""
    with app.app_context():
        club = Club(club_name="Chess Club", description="Competitive and casual chess play")
        db.session.add(club)
        db.session.commit()
        e1 = Event(
            club_id=club.club_id,
            event_name="Weekly Blitz Night",
            description="Casual 5-minute blitz games, all skill levels welcome",
            event_date=datetime(2026, 8, 5, 18, 0, tzinfo=timezone.utc),
            location="Student Centre Room 204"
        )
        e2 = Event(
            club_id=club.club_id,
            event_name="Intercollegiate Chess Tournament",
            description="Ranked tournament vs. other university chess clubs",
            event_date=datetime(2026, 9, 12, 10, 0, tzinfo=timezone.utc),
            location="Main Gymnasium"
        )
        db.session.add_all([e1, e2])
        db.session.commit()
        return [e1.event_id, e2.event_id]
@pytest.fixture
def seed_event(app):
    """Seed a single club and event for registration test cases (TC-017/018/019)."""
    with app.app_context():
        club = Club(club_name="Chess Club", description="Competitive and casual chess play")
        db.session.add(club)
        db.session.commit()
        event = Event(
            club_id=club.club_id,
            event_name="Weekly Blitz Night",
            description="Casual 5-minute blitz games",
            event_date=datetime(2026, 8, 5, 18, 0, tzinfo=timezone.utc),
            location="Student Centre Room 204"
        )
        db.session.add(event)
        db.session.commit()
        return event.event_id
@pytest.mark.rtm("S-07")
def test_list_all_events_tc015(client, auth_headers, seed_events):
    """
    TC-015 (S-07): List all events via /events endpoint
    Requirement: 200 OK response with array of event objects.
    """
    response = client.get('/events/', headers=auth_headers)
    # 1. Assert status code 200 OK
    assert response.status_code == 200
    data = response.get_json()
    # 2. Assert response is a list matching seeded count
    assert isinstance(data, list)
    assert len(data) == 2
    # 3. Assert schema for returned items (matches serialize_event)
    first_event = data[0]
    assert 'event_id' in first_event
    assert 'club_id' in first_event
    assert 'club_name' in first_event
    assert 'event_name' in first_event
    assert 'description' in first_event
    assert 'event_date' in first_event
    assert 'location' in first_event
@pytest.mark.rtm("S-07")
def test_browse_events_by_club_tc016(client, auth_headers, app):
    """
    TC-016 (S-07): Browse events filtered by club via /events/club/<club_id>
    Requirement: Returned events match the club_id filter.
    Note: The API has no date-range query param — only club-based filtering
    exists (see get_club_events in event/routes.py). Adjusted from the
    original spec, which described an unsupported ?club_id=&from= filter.
    """
    with app.app_context():
        club_a = Club(club_name="Chess Club", description="Strategy games")
        club_b = Club(club_name="Robotics Society", description="Bots and drones")
        db.session.add_all([club_a, club_b])
        db.session.commit()
        e1 = Event(club_id=club_a.club_id, event_name="Blitz Night",
                    description="Casual blitz", event_date=datetime(2026, 8, 5, tzinfo=timezone.utc),
                    location="Room 204")
        e2 = Event(club_id=club_a.club_id, event_name="Chess Tournament",
                    description="Ranked play", event_date=datetime(2026, 9, 12, tzinfo=timezone.utc),
                    location="Gymnasium")
        e3 = Event(club_id=club_b.club_id, event_name="Drone Build Day",
                    description="Build autonomous drones", event_date=datetime(2026, 8, 20, tzinfo=timezone.utc),
                    location="Engineering Lab")
        db.session.add_all([e1, e2, e3])
        db.session.commit()
        target_club_id = club_a.club_id
    response = client.get(f'/events/club/{target_club_id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    # Only club_a's 2 events should be returned, not club_b's
    assert isinstance(data, list)
    assert len(data) == 2
    returned_names = {event['event_name'] for event in data}
    assert returned_names == {"Blitz Night", "Chess Tournament"}
@pytest.mark.rtm("S-08")
def test_register_for_event_creates_registration_tc017(client, auth_headers_user42, seed_event, app):
    """
    TC-017 (S-08): Register for an event creates a registration record
    Requirement: Registration row created; 200 response (register_for_event
    returns 200, not 201 — adjusted from original spec).
    """
    target_event_id = seed_event
    response = client.post(f'/events/{target_event_id}/register', headers=auth_headers_user42)
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("message") == "Registered for event successfully"
    with app.app_context():
        registration = UserEvent.query.filter_by(user_id=42, event_id=target_event_id).first()
        assert registration is not None
        assert registration.status == "attending"
@pytest.mark.rtm("S-08")
def test_cancel_event_registration_removes_record_tc018(client, auth_headers_user42, seed_event, app):
    """
    TC-018 (S-08): Cancel an event registration removes the record
    Requirement: Registration row deleted; 200 response.
    """
    target_event_id = seed_event
    # 1. Register first to establish an active registration record
    register_res = client.post(f'/events/{target_event_id}/register', headers=auth_headers_user42)
    assert register_res.status_code == 200
    with app.app_context():
        registration = UserEvent.query.filter_by(user_id=42, event_id=target_event_id).first()
        assert registration is not None
    # 2. Cancel the registration
    response = client.post(f'/events/{target_event_id}/cancel', headers=auth_headers_user42)
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("message") == "Registration cancelled successfully"
    with app.app_context():
        registration = UserEvent.query.filter_by(user_id=42, event_id=target_event_id).first()
        assert registration is None
@pytest.mark.rtm("S-08")
def test_register_then_cancel_reflected_in_attendee_count_tc019(client, auth_headers_user42, seed_event):
    """
    TC-019 (S-08): Register then cancel reflected in event attendee count
    Requirement: Attendee count increments then decrements correctly.
    Note: get_event_registration_count buckets by status; UserEvent.status
    defaults to 'attending' on registration, so 'attending' and 'total'
    are the counters that change.
    """
    target_event_id = seed_event
    # 1. Baseline count before registration
    baseline_res = client.get(f'/events/{target_event_id}/registration-count', headers=auth_headers_user42)
    assert baseline_res.status_code == 200
    baseline = baseline_res.get_json()
    assert baseline["attending"] == 0
    assert baseline["total"] == 0
    # 2. Register and confirm count increments
    register_res = client.post(f'/events/{target_event_id}/register', headers=auth_headers_user42)
    assert register_res.status_code == 200
    after_register = client.get(f'/events/{target_event_id}/registration-count', headers=auth_headers_user42).get_json()
    assert after_register["attending"] == 1
    assert after_register["total"] == 1
    # 3. Cancel and confirm count decrements
    cancel_res = client.post(f'/events/{target_event_id}/cancel', headers=auth_headers_user42)
    assert cancel_res.status_code == 200
    after_cancel = client.get(f'/events/{target_event_id}/registration-count', headers=auth_headers_user42).get_json()
    assert after_cancel["attending"] == 0
    assert after_cancel["total"] == 0
