import pytest
from flask_jwt_extended import create_access_token
from club.club import Club
from extensions import db
from userclub.userclub import UserClub

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
