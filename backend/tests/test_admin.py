import pytest
import bcrypt
from datetime import datetime, timezone
from flask_jwt_extended import create_access_token
from extensions import db
from club.club import Club
from userclub.userclub import UserClub
from auth.user import User
from event.event import Event
from userevent.userevent import UserEvent
@pytest.mark.rtm("A-01")
def test_admin_create_club_tc039(client, app,seed_admin_user):
    """
    TC-039 (A-01): Admin performs a rep-level action (create club) end-to-end
    Requirement: admin_id=1 creates a new club; Club is created successfully 
    and creator is assigned as admin in UserClub.
    """
    admin_id = 1
    # 1. Generate a valid JWT token for admin_id = 1
    with app.app_context():
        access_token = create_access_token(identity=str(seed_admin_user))
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
    assert data.get("message") == "Club application submitted successfully, pending administrator approval"
    assert "club_id" in data
    assert data.get("status") == "pending"

    created_club_id = data["club_id"]
    # 5. Verify database records (Club and UserClub assignment)
    with app.app_context():
        created_club = db.session.get(Club, created_club_id)
        assert created_club is not None
        assert created_club.club_name == "Admin Created Robotics Club"
        assert created_club.status == "pending"
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
@pytest.fixture
def seed_admin_user(app):
    """Seed a platform Administrator user (admin_id=1) for admin-endpoint test cases."""
    with app.app_context():
        admin = User(
            user_id=1,
            first_name="Ada",
            last_name="Admin",
            email="admin@campusconnect.test",
            password="not-used-in-these-tests",
            role_name="admin"
        )
        db.session.add(admin)
        db.session.commit()
        return admin.user_id
@pytest.fixture
def auth_headers_admin1(app, seed_admin_user):
    """Generate valid JWT Authorization headers for admin_id=1."""
    with app.app_context():
        access_token = create_access_token(identity=str(seed_admin_user))
        return {"Authorization": f"Bearer {access_token}"}
@pytest.fixture
def seed_target_user_42(app):
    """Seed a regular user (user_id=42) with a known password for login-related test cases."""
    with app.app_context():
        hashed = bcrypt.hashpw("CorrectPass123!".encode('utf-8'), bcrypt.gensalt())
        user = User(
            user_id=42,
            first_name="Sam",
            last_name="Student",
            email="sam.student@campusconnect.test",
            password=hashed.decode('utf-8'),
            role_name="Student",
            is_email_verified=True,
            is_account_enabled=True
        )
        db.session.add(user)
        db.session.commit()
        return user.user_id
@pytest.mark.rtm("A-04")
def test_admin_disables_user_account_tc044(client, auth_headers_admin1, seed_target_user_42, app):
    """
    TC-044 (A-04): Disable a user account sets inactive flag
    Requirement: User record's active flag set to false.
    Note: is_account_enabled is never checked in login() and is effectively
    dead — the only flag that actually blocks login is is_account_locked.
    Per team decision, "disable" (A-04) and "lock" (A-05) share the same
    admin action: PATCH /admin/users/<id>/lock-status setting
    is_account_locked. Adjusted from the original spec's separate
    is_account_enabled flag.
    """
    target_user_id = seed_target_user_42
    response = client.patch(
        f'/admin/users/{target_user_id}/lock-status',
        json={"is_account_locked": True},
        headers=auth_headers_admin1
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("message") == "User account status updated successfully"
    assert data.get("is_account_locked") is True
    with app.app_context():
        user = db.session.get(User, target_user_id)
        assert user.is_account_locked is True
@pytest.mark.rtm("A-04")
def test_disabled_user_cannot_log_in_tc045(client, auth_headers_admin1, seed_target_user_42, app):
    """
    TC-045 (A-04): Disabled user cannot log in
    Requirement: Login rejected with account-disabled error.
    Note: "Disabled" is implemented via is_account_locked (see TC-044 note);
    login() already rejects locked accounts with a 403 before checking
    the password.
    """
    target_user_id = seed_target_user_42
    disable_res = client.patch(
        f'/admin/users/{target_user_id}/lock-status',
        json={"is_account_locked": True},
        headers=auth_headers_admin1
    )
    assert disable_res.status_code == 200
    login_res = client.post('/auth/login', json={
        "email": "sam.student@campusconnect.test",
        "password": "CorrectPass123!"
    })
    assert login_res.status_code == 403
    data = login_res.get_json()
    assert data.get("message") == "Account is locked. Try resetting your password."
@pytest.mark.rtm("A-05")
def test_admin_locks_user_account_tc046(client, auth_headers_admin1, seed_target_user_42, app):
    """
    TC-046 (A-05): Lock a user account sets locked flag
    Requirement: User record's locked flag set to true.
    """
    target_user_id = seed_target_user_42
    response = client.patch(
        f'/admin/users/{target_user_id}/lock-status',
        json={"is_account_locked": True},
        headers=auth_headers_admin1
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("is_account_locked") is True
    with app.app_context():
        user = db.session.get(User, target_user_id)
        assert user.is_account_locked is True
@pytest.mark.rtm("A-05")
def test_locked_user_login_attempt_blocked_tc047(client, auth_headers_admin1, seed_target_user_42, app):
    """
    TC-047 (A-05): Locked user's login attempt is blocked
    Requirement: Login rejected with account-locked error.
    """
    target_user_id = seed_target_user_42
    lock_res = client.patch(
        f'/admin/users/{target_user_id}/lock-status',
        json={"is_account_locked": True},
        headers=auth_headers_admin1
    )
    assert lock_res.status_code == 200
    login_res = client.post('/auth/login', json={
        "email": "sam.student@campusconnect.test",
        "password": "CorrectPass123!"
    })
    assert login_res.status_code == 403
    data = login_res.get_json()
    assert data.get("message") == "Account is locked. Try resetting your password."
@pytest.mark.rtm("A-06")
def test_failed_login_increments_counter_tc048(client, seed_target_user_42, app):
    """
    TC-048 (A-06): Failed login attempt increments the account's failure counter
    Requirement: Failed-attempt counter incremented (no timestamp tracked —
    per team decision, only the counter itself is in scope).
    """
    target_user_id = seed_target_user_42
    # 1. First failed attempt
    first_res = client.post('/auth/login', json={
        "email": "sam.student@campusconnect.test",
        "password": "WrongPassword!"
    })
    assert first_res.status_code == 401
    with app.app_context():
        user = db.session.get(User, target_user_id)
        assert user.failed_login_attempts == 1
    # 2. Second failed attempt confirms the counter continues to increment
    second_res = client.post('/auth/login', json={
        "email": "sam.student@campusconnect.test",
        "password": "AnotherWrongPassword!"
    })
    assert second_res.status_code == 401
    with app.app_context():
        user = db.session.get(User, target_user_id)
        assert user.failed_login_attempts == 2
@pytest.mark.rtm("A-08")
def test_admin_deletes_club_tc052(client, auth_headers_admin1, app):
    """
    TC-052 (A-08): Admin deletes an inappropriate club or event
    Requirement: Club record removed from DB.
    Note: Exercises the platform-Administrator bypass added to delete_club(),
    against a club the admin does NOT own via UserClub, to confirm the
    bypass is role-based rather than ownership-based.
    """
    with app.app_context():
        club = Club(club_name="Inappropriate Club", description="Flagged content")
        db.session.add(club)
        db.session.commit()
        target_club_id = club.club_id
    response = client.delete(f'/clubs/{target_club_id}', headers=auth_headers_admin1)
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("message") == "Club deleted successfully"
    with app.app_context():
        club = db.session.get(Club, target_club_id)
        assert club is None
@pytest.mark.rtm("A-09")
def test_admin_dashboard_returns_summary_stats_tc054(client, auth_headers_admin1, app):
    """
    TC-054 (A-09): Admin dashboard data-aggregation endpoint returns summary stats
    Requirement: 200 response with counts of clubs, events, and users.
    """
    with app.app_context():
        club = Club(club_name="Chess Club", description="Strategy games")
        db.session.add(club)
        db.session.commit()
        event = Event(
            club_id=club.club_id,
            event_name="Blitz Night",
            description="Casual blitz",
            event_date=datetime(2026, 8, 5, tzinfo=timezone.utc),
            location="Room 204"
        )
        db.session.add(event)
        db.session.commit()
    response = client.get('/admin/dashboard', headers=auth_headers_admin1)
    assert response.status_code == 200
    data = response.get_json()
    # 1 admin (seeded via auth_headers_admin1) + 1 club + 1 event
    assert data.get("total_clubs") == 0
    assert data.get("total_events") == 1
    assert data.get("total_users") == 1
@pytest.mark.rtm("A-10")
def test_admin_deletes_user_account_tc056(client, auth_headers_admin1, seed_target_user_42, app):
    """
    TC-056 (A-10): Admin deletes a user account
    Requirement: User record removed from DB.
    """
    target_user_id = seed_target_user_42
    response = client.delete(f'/admin/users/{target_user_id}', headers=auth_headers_admin1)
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("message") == "User account deleted successfully"
    with app.app_context():
        user = db.session.get(User, target_user_id)
        assert user is None
@pytest.mark.rtm("A-10")
def test_admin_delete_user_cascades_memberships_and_registrations_tc057(client, auth_headers_admin1, seed_target_user_42, app):
    """
    TC-057 (A-10): Removed account's memberships/registrations cascade correctly
    Requirement: User's memberships and registrations are also removed/cleaned
    up; no orphaned records.
    """
    target_user_id = seed_target_user_42
    with app.app_context():
        club = Club(club_name="Chess Club", description="Strategy games")
        db.session.add(club)
        db.session.commit()
        event = Event(
            club_id=club.club_id,
            event_name="Blitz Night",
            description="Casual blitz",
            event_date=datetime(2026, 8, 5, tzinfo=timezone.utc),
            location="Room 204"
        )
        db.session.add(event)
        db.session.commit()
        db.session.add(UserClub(user_id=target_user_id, club_id=club.club_id, role='member'))
        db.session.add(UserEvent(user_id=target_user_id, event_id=event.event_id))
        db.session.commit()
        target_club_id = club.club_id
        target_event_id = event.event_id
    # Sanity check: membership and registration exist before deletion
    with app.app_context():
        assert UserClub.query.filter_by(user_id=target_user_id, club_id=target_club_id).first() is not None
        assert UserEvent.query.filter_by(user_id=target_user_id, event_id=target_event_id).first() is not None
    # Admin deletes the user
    response = client.delete(f'/admin/users/{target_user_id}', headers=auth_headers_admin1)
    assert response.status_code == 200
    # Cascade check: membership and registration are gone, no orphans
    with app.app_context():
        assert db.session.get(User, target_user_id) is None
        assert UserClub.query.filter_by(user_id=target_user_id, club_id=target_club_id).first() is None
        assert UserEvent.query.filter_by(user_id=target_user_id, event_id=target_event_id).first() is None
        # club and event themselves remain untouched
        assert db.session.get(Club, target_club_id) is not None
        assert db.session.get(Event, target_event_id) is not None


@pytest.fixture
def seed_pending_club(app):
    """Seed a club with status='pending' for approval/rejection test cases."""
    with app.app_context():
        club = Club(club_name="Anime Club", description="Weekly screenings and discussion", status="pending")
        db.session.add(club)
        db.session.commit()
        return club.club_id
@pytest.mark.rtm("A-02")
def test_approve_pending_club_application_tc040(client, auth_headers_admin1, seed_pending_club, app):
    """
    TC-040 (A-02): Approve a pending club application updates its status
    Requirement: Club.status set to 'approved'; club becomes visible in browse list.
    Note: There is no separate Application entity — the Club row itself
    carries the pending/approved/rejected status, identified by club_id.
    """
    target_club_id = seed_pending_club

    response = client.patch(f'/admin/clubs/{target_club_id}/approve', headers=auth_headers_admin1)

    assert response.status_code == 200
    data = response.get_json()
    assert data.get("message") == "Club application approved"
    assert data.get("status") == "approved"

    with app.app_context():
        club = db.session.get(Club, target_club_id)
        assert club.status == "approved"

    # Confirm the approved club now appears in the public browse list
    browse_res = client.get('/clubs/', headers=auth_headers_admin1)
    assert browse_res.status_code == 200
    browse_ids = {club['club_id'] for club in browse_res.get_json()}
    assert target_club_id in browse_ids
@pytest.mark.rtm("A-02")
def test_rejected_club_not_visible_to_students_tc041(client, auth_headers_admin1, seed_pending_club, app):
    """
    TC-041 (A-02): Rejected application's club is not visible to students
    Requirement: Club.status set to 'rejected'; club does not appear in
    GET /clubs/ browse list.
    """
    target_club_id = seed_pending_club

    reject_res = client.patch(f'/admin/clubs/{target_club_id}/reject', headers=auth_headers_admin1)
    assert reject_res.status_code == 200
    data = reject_res.get_json()
    assert data.get("status") == "rejected"

    with app.app_context():
        club = db.session.get(Club, target_club_id)
        assert club.status == "rejected"

    # Confirm the rejected club does NOT appear in the browse list
    browse_res = client.get('/clubs/', headers=auth_headers_admin1)
    assert browse_res.status_code == 200
    browse_ids = {club['club_id'] for club in browse_res.get_json()}
    assert target_club_id not in browse_ids

@pytest.mark.rtm("A-03")
def test_get_all_registered_users_tc042(client, auth_headers_admin1, seed_target_user_42, app):
    """
    TC-042 (A-03): Get all registered users via admin endpoint
    Requirement: 200 response with full list of registered users.
    Note: get_all_users() returns a derived 'role' (Club Representative/Student
    via UserClub lookup) and 'status' (Active/Inactive from is_account_locked),
    not the raw role_name/is_account_locked fields.
    """
    response = client.get('/admin/users', headers=auth_headers_admin1)

    assert response.status_code == 200
    data = response.get_json()

    # 1 admin (seeded via auth_headers_admin1) + user 42
    assert isinstance(data, list)
    assert len(data) == 2
    user_ids = {user['user_id'] for user in data}
    assert user_ids == {1, 42}

    first = data[0]
    assert 'user_id' in first
    assert 'first_name' in first
    assert 'email' in first
    assert 'role' in first
    assert 'status' in first

    # user 42 seeded as an unlocked student with no club admin membership
    user_42_entry = next(user for user in data if user['user_id'] == 42)
    assert user_42_entry['role'] == 'Student'
    assert user_42_entry['status'] == 'Active'
