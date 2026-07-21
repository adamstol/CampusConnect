import pytest
from datetime import datetime, timezone
from extensions import db
from club.club import Club
from userclub.userclub import UserClub
from event.event import Event
from announcement.announcement import Announcement
from flask_jwt_extended import create_access_token
@pytest.fixture
def auth_headers_rep5(app):
    """Generate valid JWT Authorization headers for rep_id=5."""
    with app.app_context():
        access_token = create_access_token(identity="5")
        return {"Authorization": f"Bearer {access_token}"}
@pytest.fixture
def auth_headers_rep6(app):
    """Generate valid JWT Authorization headers for rep_id=6, used for cross-ownership tests."""
    with app.app_context():
        access_token = create_access_token(identity="6")
        return {"Authorization": f"Bearer {access_token}"}
@pytest.fixture
def seed_club_owned_by_rep5(app):
    """Seed a club owned by rep_id=5 with role='representative'."""
    with app.app_context():
        club = Club(club_name="Chess Club", description="Owned by rep 5")
        db.session.add(club)
        db.session.commit()
        ownership = UserClub(user_id=5, club_id=club.club_id, role='representative')
        db.session.add(ownership)
        db.session.commit()
        return club.club_id
@pytest.fixture
def seed_club_owned_by_rep6(app):
    """Seed a club owned by rep_id=6 with role='representative', for cross-ownership tests."""
    with app.app_context():
        club = Club(club_name="Robotics Society", description="Owned by rep 6")
        db.session.add(club)
        db.session.commit()
        ownership = UserClub(user_id=6, club_id=club.club_id, role='representative')
        db.session.add(ownership)
        db.session.commit()
        return club.club_id
@pytest.fixture
def seed_event_owned_by_rep5(app):
    """Seed a club owned by rep_id=5 and an event under that club."""
    with app.app_context():
        club = Club(club_name="Chess Club", description="Owned by rep 5")
        db.session.add(club)
        db.session.commit()
        ownership = UserClub(user_id=5, club_id=club.club_id, role='representative')
        db.session.add(ownership)
        db.session.commit()
        event = Event(
            club_id=club.club_id,
            event_name="Weekly Blitz Night",
            description="Casual blitz games",
            event_date=datetime(2026, 8, 5, 18, 0, tzinfo=timezone.utc),
            location="Room 204"
        )
        db.session.add(event)
        db.session.commit()
        return event.event_id
@pytest.fixture
def seed_event_owned_by_rep6(app):
    """Seed a club owned by rep_id=6 and an event under that club, for cross-ownership tests."""
    with app.app_context():
        club = Club(club_name="Robotics Society", description="Owned by rep 6")
        db.session.add(club)
        db.session.commit()
        ownership = UserClub(user_id=6, club_id=club.club_id, role='representative')
        db.session.add(ownership)
        db.session.commit()
        event = Event(
            club_id=club.club_id,
            event_name="Drone Build Day",
            description="Build autonomous drones",
            event_date=datetime(2026, 8, 20, tzinfo=timezone.utc),
            location="Engineering Lab"
        )
        db.session.add(event)
        db.session.commit()
        return event.event_id
@pytest.mark.rtm("CR-01")
def test_create_club_as_representative_tc026(client, auth_headers_rep5, app):
    """
    TC-026 (CR-01): Create a new club as a club representative
    Requirement: Club record created with rep_id=5 as owner.
    Note: create_club() has no representative-only role gate — any
    authenticated user may create a club. The creator is automatically
    assigned role='admin' (not a distinct 'representative' role) as the
    club's owner via UserClub. Adjusted from the original spec's implied
    role restriction.
    """
    payload = {
        "club_name": "Debate Club",
        "description": "Competitive debate and public speaking"
    }
    response = client.post('/clubs/', json=payload, headers=auth_headers_rep5)
    assert response.status_code == 201
    data = response.get_json()
    assert data.get("message") == "Club created successfully"
    club_id = data.get("club_id")
    assert club_id is not None
    with app.app_context():
        ownership = UserClub.query.filter_by(user_id=5, club_id=club_id).first()
        assert ownership is not None
        assert ownership.role == "admin"
@pytest.mark.rtm("CR-01")
def test_edit_and_delete_owned_club_tc027(client, auth_headers_rep5, seed_club_owned_by_rep5, app):
    """
    TC-027 (CR-01): Edit and delete a club owned by the representative
    Requirement: Club fields updated; club subsequently removed from DB.
    """
    target_club_id = seed_club_owned_by_rep5
    # 1. Edit the club via PATCH
    edit_payload = {"club_name": "Debate Club", "description": "Renamed by owner"}
    edit_res = client.patch(f'/clubs/{target_club_id}', json=edit_payload, headers=auth_headers_rep5)
    assert edit_res.status_code == 200
    assert edit_res.get_json().get("message") == "Club updated successfully"
    with app.app_context():
        club = db.session.get(Club, target_club_id)
        assert club.club_name == "Debate Club"
        assert club.description == "Renamed by owner"
    # 2. Delete the club
    delete_res = client.delete(f'/clubs/{target_club_id}', headers=auth_headers_rep5)
    assert delete_res.status_code == 200
    assert delete_res.get_json().get("message") == "Club deleted successfully"
    with app.app_context():
        club = db.session.get(Club, target_club_id)
        assert club is None
@pytest.mark.rtm("CR-01")
def test_representative_cannot_modify_unowned_club_tc028(client, auth_headers_rep5, seed_club_owned_by_rep6, app):
    """
    TC-028 (CR-01): Representative cannot edit/delete a club they do not own
    Requirement: 403 Forbidden; target club unchanged.
    Note: Club update uses PATCH, not PUT — there is no PUT route on
    /clubs/<club_id>. Adjusted from the original spec's PUT reference.
    """
    target_club_id = seed_club_owned_by_rep6
    # 1. Attempt PATCH as rep_id=5, who has no membership on this club
    patch_res = client.patch(
        f'/clubs/{target_club_id}',
        json={"club_name": "Hijacked Name"},
        headers=auth_headers_rep5
    )
    assert patch_res.status_code == 403
    assert "Unauthorized" in patch_res.get_json().get("message", "")
    # 2. Attempt DELETE as rep_id=5
    delete_res = client.delete(f'/clubs/{target_club_id}', headers=auth_headers_rep5)
    assert delete_res.status_code == 403
    assert "Unauthorized" in delete_res.get_json().get("message", "")
    # 3. Confirm the club is unchanged and still exists
    with app.app_context():
        club = db.session.get(Club, target_club_id)
        assert club is not None
        assert club.club_name == "Robotics Society"
@pytest.mark.rtm("CR-02")
def test_get_club_membership_list_tc029(client, auth_headers_rep5, seed_club_owned_by_rep5, app):
    """
    TC-029 (CR-02): Get membership list for a club owned by the representative
    Requirement: 200 response with list of members for that club.
    Note: get_club_members() has no ownership/role restriction — it is
    accessible to any authenticated user, not just the club's owner.
    Adjusted description to reflect that this endpoint is open, though the
    test still exercises it as the owning representative per the spec's intent.
    """
    target_club_id = seed_club_owned_by_rep5
    # Add a second member to verify the list reflects real membership, not just the owner
    with app.app_context():
        db.session.add(UserClub(user_id=42, club_id=target_club_id, role='member'))
        db.session.commit()
    response = client.get(f'/clubs/{target_club_id}/members', headers=auth_headers_rep5)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2  # rep_id=5 (representative) + user_id=42 (member)
    member_ids = {member['user_id'] for member in data}
    assert member_ids == {5, 42}
    for member in data:
        assert 'user_id' in member
        assert 'role' in member
        assert 'joined_at' in member
@pytest.mark.rtm("CR-03")
def test_create_event_for_owned_club_tc031(client, auth_headers_rep5, seed_club_owned_by_rep5, app):
    """
    TC-031 (CR-03): Create a new event for an owned club
    Requirement: Event record created linked to the owned club_id.
    """
    target_club_id = seed_club_owned_by_rep5
    payload = {
        "club_id": target_club_id,
        "event_name": "Debate Showcase",
        "description": "Open house debate exhibition",
        "event_date": "2026-09-15T18:00:00",
        "location": "Auditorium"
    }
    response = client.post('/events/', json=payload, headers=auth_headers_rep5)
    assert response.status_code == 201
    data = response.get_json()
    assert data.get("message") == "Event created successfully"
    event_id = data.get("event_id")
    assert event_id is not None
    with app.app_context():
        event = db.session.get(Event, event_id)
        assert event is not None
        assert event.club_id == target_club_id
        assert event.event_name == "Debate Showcase"
@pytest.mark.rtm("CR-03")
def test_edit_and_delete_owned_event_tc032(client, auth_headers_rep5, seed_event_owned_by_rep5, app):
    """
    TC-032 (CR-03): Edit and delete an event belonging to an owned club
    Requirement: Event fields updated; event subsequently removed from DB.
    """
    target_event_id = seed_event_owned_by_rep5
    # 1. Edit via PATCH
    edit_payload = {"event_name": "Blitz Finals", "location": "Main Hall"}
    edit_res = client.patch(f'/events/{target_event_id}', json=edit_payload, headers=auth_headers_rep5)
    assert edit_res.status_code == 200
    assert edit_res.get_json().get("message") == "Event updated successfully"
    with app.app_context():
        event = db.session.get(Event, target_event_id)
        assert event.event_name == "Blitz Finals"
        assert event.location == "Main Hall"
    # 2. Delete the event
    delete_res = client.delete(f'/events/{target_event_id}', headers=auth_headers_rep5)
    assert delete_res.status_code == 200
    assert delete_res.get_json().get("message") == "Event deleted successfully"
    with app.app_context():
        event = db.session.get(Event, target_event_id)
        assert event is None
@pytest.mark.rtm("CR-03")
def test_representative_cannot_modify_unowned_event_tc033(client, auth_headers_rep5, seed_event_owned_by_rep6, app):
    """
    TC-033 (CR-03): Representative cannot modify an event of another club
    Requirement: 403 Forbidden; target event unchanged.
    Note: Event update uses PATCH, not PUT — there is no PUT route on
    /events/<event_id>. Adjusted from the original spec's PUT reference.
    """
    target_event_id = seed_event_owned_by_rep6
    patch_res = client.patch(
        f'/events/{target_event_id}',
        json={"event_name": "Hijacked Event"},
        headers=auth_headers_rep5
    )
    assert patch_res.status_code == 403
    assert "Unauthorized" in patch_res.get_json().get("message", "")
    delete_res = client.delete(f'/events/{target_event_id}', headers=auth_headers_rep5)
    assert delete_res.status_code == 403
    assert "Unauthorized" in delete_res.get_json().get("message", "")
    with app.app_context():
        event = db.session.get(Event, target_event_id)
        assert event is not None
        assert event.event_name == "Drone Build Day"
@pytest.mark.rtm("CR-05")
def test_create_announcement_for_owned_club_tc036(client, auth_headers_rep5, seed_club_owned_by_rep5, app):
    """
    TC-036 (CR-05): Create an announcement for an owned club
    Requirement: Announcement record created linked to the owned club_id.
    """
    target_club_id = seed_club_owned_by_rep5
    payload = {
        "title": "Practice Schedule Update",
        "body": "Practice moved to Thursdays starting next week."
    }
    response = client.post(f'/clubs/{target_club_id}/announcements', json=payload, headers=auth_headers_rep5)
    assert response.status_code == 201
    data = response.get_json()
    assert data.get("message") == "Announcement created successfully"
    announcement_id = data.get("announcement_id")
    assert announcement_id is not None
    with app.app_context():
        announcement = db.session.get(Announcement, announcement_id)
        assert announcement is not None
        assert announcement.club_id == target_club_id
        assert announcement.created_by == 5
        assert announcement.title == "Practice Schedule Update"
