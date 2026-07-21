import pytest
from flask_jwt_extended import create_access_token
from extensions import db
from club.club import Club
from userclub.userclub import UserClub


@pytest.mark.rtm("A-01")
def test_admin_create_club_tc039(client, app):
    """
    TC-039 (A-01): Admin performs a rep-level action (create club) end-to-end
    Requirement: admin_id=1 creates a new club; Club is created successfully 
    and creator is assigned as admin in UserClub.
    """
    admin_id = 1

    # 1. Generate a valid JWT token for admin_id = 1
    with app.app_context():
        access_token = create_access_token(identity=str(admin_id))

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # 2. Match exact keys expected by request.get_json() in create_club()
    payload = {
        "club_name": "Admin Created Robotics Club",
        "description": "Club directly provisioned by platform administrator."
    }

    # 3. Post to '/clubs/' with trailing slash to prevent 308 redirects
    response = client.post('/clubs/', json=payload, headers=headers)

    # 4. Verify endpoint response
    assert response.status_code == 201
    data = response.get_json()
    assert data.get("message") == "Club created successfully"
    assert "club_id" in data

    created_club_id = data["club_id"]

    # 5. Verify database records (Club and UserClub assignment)
    with app.app_context():
        created_club = db.session.get(Club, created_club_id)
        assert created_club is not None
        assert created_club.club_name == "Admin Created Robotics Club"

        # Confirm user_id=1 was added as admin in UserClub
        membership = UserClub.query.filter_by(
            user_id=admin_id, 
            club_id=created_club_id
        ).first()
        
        assert membership is not None
        assert membership.role == "admin"

@pytest.mark.rtm("A-01")
def test_admin_join_club_tc038(client, app):
    """
    TC-038 (A-01): Admin role passes permission checks for student-level actions
    Requirement: admin_id=1 executes join_club(club_id=7);
    Action succeeds without being blocked by any permission checks.
    """
    admin_id = 1
    target_club_id = 7

    # 1. Seed target club if missing & clear pre-existing membership for clean state
    with app.app_context():
        club = db.session.get(Club, target_club_id)
        if not club:
            club = Club(
                club_id=target_club_id, 
                club_name="Target Student Club", 
                description="Club for TC-038 testing"
            )
            db.session.add(club)
            db.session.commit()

        # Wipe pre-existing membership to avoid 400 "Already a member" error
        existing_membership = UserClub.query.filter_by(
            user_id=admin_id, 
            club_id=target_club_id
        ).first()
        if existing_membership:
            db.session.delete(existing_membership)
            db.session.commit()

    # 2. Generate JWT token for admin_id = 1
    with app.app_context():
        access_token = create_access_token(identity=str(admin_id))

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # 3. Post to '/clubs/7/join'
    response = client.post(f'/clubs/{target_club_id}/join', headers=headers)

    # 4. Verify response
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("message") == "Joined club successfully"

    # 5. Verify database record insertion
    with app.app_context():
        membership = UserClub.query.filter_by(
            user_id=admin_id, 
            club_id=target_club_id
        ).first()

        assert membership is not None
        assert membership.user_id == admin_id
        assert membership.club_id == target_club_id
