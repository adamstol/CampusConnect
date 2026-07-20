import pytest
from flask_jwt_extended import create_access_token
from club.club import Club
from extensions import db
from userclub.userclub import UserClub
from event.event import Event

@pytest.fixture
def auth_headers(app):
    """Generate valid JWT Authorization headers for authenticated endpoints."""
    with app.app_context():
        # Identity set to "1" so int(get_jwt_identity()) succeeds in backend
        access_token = create_access_token(identity="1")
        return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def seed_clubs(app):
    """Seed in-memory database with test clubs for TC-006."""
    with app.app_context():
        c1 = Club(club_name="Chess Club", description="Competitive and casual chess play")
        c2 = Club(club_name="Robotics Society", description="Build autonomous drones and bots")

        db.session.add_all([c1, c2])
        db.session.commit()

        return [c1.club_id, c2.club_id]

@pytest.mark.rtm("S-03")
def test_list_all_active_clubs_tc006(client, auth_headers, seed_clubs):
    """
    TC-006 (S-03): List all active clubs via /clubs endpoint
    Requirement: 200 OK response with array of active club objects.
    """
    response = client.get('/clubs/', headers=auth_headers)

    # 1. Assert status code 200 OK
    assert response.status_code == 200

    data = response.get_json()

    # 2. Assert response is a list matching seeded count
    assert isinstance(data, list)
    assert len(data) == 2

    # 3. Assert schema for returned items
    first_club = data[0]
    assert 'club_id' in first_club
    assert 'club_name' in first_club
    assert 'description' in first_club

@pytest.mark.rtm("S-03")
def test_get_specific_club_by_id_tc007(client, auth_headers, seed_clubs):
    """
    TC-007 (S-03): Get a specific club by ID via /clubs/<int:club_id> endpoint
    Requirement: 200 OK response with the matching club object.
    """
    target_club_id = seed_clubs[0]
    response = client.get(f'/clubs/{target_club_id}', headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()

    assert data['club_id'] == target_club_id
    assert data['club_name'] == "Chess Club"
    assert data['description'] == "Competitive and casual chess play"


@pytest.mark.rtm("S-04")
def test_join_club_creates_membership_tc008(client, auth_headers, seed_clubs, app):
    """
    TC-008 (S-04): Join a club creates a membership record
    Requirement: 200 OK response and database membership row created upon joining.
    """
    target_club_id = seed_clubs[0]

    # Send POST request to join club
    response = client.post(f'/clubs/{target_club_id}/join', headers=auth_headers)

    # 1. Assert status code 200 OK
    assert response.status_code == 200

    # 2. Assert response message
    data = response.get_json()
    assert data.get("message") == "Joined club successfully"

    # 3. Verify membership row actually exists in database (user_id=1 from auth_headers)
    with app.app_context():
        membership = UserClub.query.filter_by(user_id=1, club_id=target_club_id).first()
        assert membership is not None

@pytest.mark.rtm("S-04")
def test_leave_club_removes_membership_tc009(client, auth_headers, seed_clubs, app):
    """
    TC-009 (S-04): Leave a club removes the membership record
    Requirement: 200 OK response and database membership row removed upon leaving.
    """
    target_club_id = seed_clubs[0]

    # 1. First, join the club to establish a active membership record
    join_res = client.post(f'/clubs/{target_club_id}/join', headers=auth_headers)
    assert join_res.status_code == 200

    # Verify membership exists in DB
    with app.app_context():
        membership = UserClub.query.filter_by(user_id=1, club_id=target_club_id).first()
        assert membership is not None

    # 2. Perform POST request to leave the club
    response = client.post(f'/clubs/{target_club_id}/leave', headers=auth_headers)

    # 3. Assert status code 200 OK
    assert response.status_code == 200

    # 4. Verify membership row was actually deleted from database
    with app.app_context():
        membership = UserClub.query.filter_by(user_id=1, club_id=target_club_id).first()
        assert membership is None

@pytest.mark.rtm("S-05")
def test_submit_club_application_tc011(client, auth_headers):
    """
    TC-011 (S-05): Submit new club application with valid details
    Requirement: 201 Created response and club record created upon submission.
    """
    payload = {
        "club_name": "Robotics Club",
        "description": "Building autonomous robots and competing in intercollegiate leagues."
    }

    # POST request to /clubs/
    response = client.post('/clubs/', json=payload, headers=auth_headers)

    # 1. Assert status code 201 Created
    assert response.status_code == 201

    # 2. Assert response message and returned club_id
    data = response.get_json()
    assert data.get("message") == "Club created successfully"
    assert "club_id" in data

@pytest.mark.rtm("S-05")
def test_submit_duplicate_club_application_tc012(client, auth_headers):
    """
    TC-012 (S-05): Submitting a duplicate/conflicting club application
    Requirement: 400 Bad Request when attempting to create a club with an existing name.
    """
    payload = {
        "club_name": "Chess Club",
        "description": "A club for strategy and chess lovers."
    }

    # 1. First submission succeeds (201 Created)
    first_res = client.post('/clubs/', json=payload, headers=auth_headers)
    assert first_res.status_code == 201

    # 2. Second submission with identical club_name should fail (400 Bad Request)
    second_res = client.post('/clubs/', json=payload, headers=auth_headers)
    assert second_res.status_code == 400

    # 3. Assert error message
    data = second_res.get_json()
    assert data.get("message") == "Club name already exists"

@pytest.mark.rtm("S-06")
def test_get_club_details_tc013(client, seed_clubs):
    """
    TC-013 (S-06): Get club details returns description and metadata
    Requirement: 200 OK response including club description and metadata fields.
    """
    target_club_id = seed_clubs[0]

    # Perform GET request to fetch club details by ID
    response = client.get(f'/clubs/{target_club_id}')

    # 1. Assert status code 200 OK
    assert response.status_code == 200

    # 2. Assert response body contains metadata and description fields
    data = response.get_json()
    assert isinstance(data, dict)
    assert "club_id" in data or "id" in data
    assert "club_name" in data or "name" in data
    assert "description" in data

from datetime import datetime, timezone
import pytest
from event.event import Event
from extensions import db


@pytest.mark.rtm("S-06")
def test_get_club_details_tc013(client, auth_headers, seed_clubs, app):
    """
    TC-013 (S-06): Get club details returns description and metadata
    Requirement: 200 OK response containing club description and metadata.
    """
    target_club_id = seed_clubs[0]

    # 1. Seed an event tied to this club using the model schema
    with app.app_context():
        sample_event = Event(
            club_id=target_club_id,
            event_name="Robotics Workshop",
            description="Hands-on intro to microcontrollers and sensor wiring.",
            event_date=datetime(2026, 10, 20, 15, 0, tzinfo=timezone.utc),
            location="Engineering Lab 2"
        )
        db.session.add(sample_event)
        db.session.commit()

    # 2. Perform GET request to fetch club details by ID
    response = client.get(f'/clubs/{target_club_id}', headers=auth_headers)

    # 3. Assert status code 200 OK
    assert response.status_code == 200

    # 4. Assert response payload structure and metadata values
    data = response.get_json()
    assert isinstance(data, dict)

    # Verify key metadata fields
    assert "club_id" in data or "id" in data
    assert "club_name" in data or "name" in data
    assert "description" in data
    assert data["description"] is not None
