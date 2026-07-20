import pytest
from flask_jwt_extended import create_access_token
from club.club import Club
from extensions import db


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
