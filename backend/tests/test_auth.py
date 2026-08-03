import pytest
import bcrypt
from flask_jwt_extended import create_access_token
from auth.user import User
from extensions import mail

@pytest.mark.skip(reason="Requires mail configuration not available in CI")
@pytest.mark.rtm("S-01")
def test_register_new_user_valid_details(client, app):
    """
    TC-001: Register new user with valid, unique details.
    """
    # 1. Arrange: Map spreadsheet data safely to match code parameters
    payload = {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane@school.edu",
        "password": "Valid123!"
    }
    
    # We catch outgoing emails using Flask-Mail's recording context
    with mail.record_messages() as outbox:
        
        # 2. Act: Call the endpoint
        response = client.post('/auth/register', json=payload)
        
        # 3. Assert Response: Match your explicit code's response signature
        assert response.status_code == 201
        assert response.get_json() == {
            'message': 'Successfully Registered. Please verify your email.'
        }
        
        # Verify the background operations (Email Generation)
        assert len(outbox) == 1
        assert outbox[0].subject == 'CampusConnect — Verify your email'
        assert 'jane@school.edu' in outbox[0].recipients

    # 4. Assert Database State: Check everything written to SQLite
    with app.app_context():
        user = User.query.filter_by(email="jane@school.edu").first()
        
        assert user is not None
        assert user.first_name == "Jane"
        assert user.last_name == "Doe"
        assert user.role_name == "Student"        # Confirms code's default role value
        assert user.is_email_verified is False    # Confirms it defaults to unverified
        assert user.email_verification_token is not None

@pytest.mark.rtm("S-01")
def test_reject_registration_duplicate_email(client, app):
    """
    TC-002: Reject registration with duplicate email.
    """
    # 1. Arrange: Manually insert an existing user into the temporary database
    existing_email = "existing_jane@school.edu"

    with app.app_context():
        from extensions import db
        prior_user = User(
            first_name="Jane",
            last_name="Doe",
            email=existing_email,
            password="SomeHashedPasswordXYZ",
            role_name="Student"
        )
        db.session.add(prior_user)
        db.session.commit()

    # 2. Act: Attempt to register a new user using that exact same email
    duplicate_payload = {
        "first_name": "Ghost",
        "last_name": "User",
        "email": existing_email,
        "password": "ValidPassword123!"
    }
    response = client.post('/auth/register', json=duplicate_payload)

    # 3. Assert: Verify the backend rejects it with a 400 and the correct message
    assert response.status_code == 400
    assert response.get_json() == {'message': 'Email already registered'}

    # 4. Assert DB State: Ensure no new user record was accidentally created
    with app.app_context():
        total_users = User.query.filter_by(email=existing_email).count()
        # It should still be exactly 1 (the one we manually seeded)
        assert total_users == 1


@pytest.mark.rtm("S-01")
def test_login_valid_credentials_success(client, app):
    """
    TC-003: Log in with valid credentials and receive session/auth token (Integration).
    """
    test_email = "jane@school.edu"
    test_password = "Valid123!"

    # 1. Arrange: Hash password using bcrypt and seed the user into the DB
    hashed_password = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    with app.app_context():
        from extensions import db
        user = User(
            first_name="Jane",
            last_name="Doe",
            email=test_email,
            password=hashed_password,
            role_name="Student",
            is_account_enabled=True,
            is_account_locked=False
        )
        db.session.add(user)
        db.session.commit()

    # 2. Act: Attempt to log in with the correct credentials
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    login_response = client.post('/auth/login', json=login_payload)

    # 3. Assert (Login Response): Verify status code 200 and explicit JSON data structure
    assert login_response.status_code == 200
    
    login_data = login_response.get_json()
    assert login_data['message'] == 'Login successful'
    assert login_data['first_name'] == 'Jane'
    assert login_data['last_name'] == 'Doe'
    assert 'access_token' in login_data

    # 4. Act & Assert (End-to-End Integration): Extract JWT token and access the protected /me endpoint
    access_token = login_data['access_token']
    auth_headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    me_response = client.get('/auth/me', headers=auth_headers)
    
    # Verify the application decodes the token perfectly and pulls up the right profile details
    assert me_response.status_code == 200
    me_data = me_response.get_json()
    assert me_data['email'] == test_email
    assert me_data['first_name'] == 'Jane'
    assert me_data['role_name'] == 'Student'

@pytest.mark.rtm("S-02")
def test_update_profile_valid_fields_success(client, app):
    """
    TC-004: Update own profile with valid field values.
    """
    # 1. Arrange: Seed a user into our isolated test DB to simulate an active user
    with app.app_context():
        from extensions import db
        test_user = User(
            first_name="Jane",
            last_name="Doe",
            email="jane@school.edu",
            password="SomeHashedPasswordXYZ",
            role_name="Student"
        )
        db.session.add(test_user)
        db.session.commit()
        
        # Capture the database-generated ID to create a valid authorization token
        user_id_str = str(test_user.user_id)
        token = create_access_token(identity=user_id_str)

    # 2. Act: Prepare the patch payload matching your front-end form submission
    patch_payload = {
        "first_name": "Jane",
        "last_name": "D.",
        "email": "jane@school.edu"
    }
    
    auth_headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = client.patch('/auth/profile', json=patch_payload, headers=auth_headers)

    # 3. Assert Response: Confirm 200 status code and matching success string
    assert response.status_code == 200
    assert response.get_json() == {'message': 'Profile updated successfully'}

    # 4. Assert DB State: Confirm the record permanently reflects the changes
    with app.app_context():
        updated_user = db.session.get(User, int(user_id_str))
        assert updated_user.last_name == "D."          # Confirms the update worked
        assert updated_user.first_name == "Jane"        # Confirms unaffected fields remain intact

@pytest.mark.rtm("S-02")
def test_fetch_and_persist_profile_changes_across_stack(client, app):
    """
    TC-005: Fetch and persist profile changes across the stack (Integration).
    """
    # 1. Arrange: Seed a temporary user to update
    with app.app_context():
        from extensions import db
        test_user = User(
            first_name="OriginalName",
            last_name="OriginalLast",
            email="jane.milo@school.edu",
            password="SomeHashedPasswordXYZ",
            role_name="Student"
        )
        db.session.add(test_user)
        db.session.commit()
        
        user_id_str = str(test_user.user_id)
        token = create_access_token(identity=user_id_str)

    auth_headers = {
        "Authorization": f"Bearer {token}"
    }

    # 2. Act (Step 1): Send the PATCH request to update the profile values
    update_payload = {
        "first_name": "Jane",
        "last_name": "Milo"
    }
    patch_response = client.patch('/auth/profile', json=update_payload, headers=auth_headers)
    assert patch_response.status_code == 200

    # 3. Act (Step 2): Fetch the profile via GET to ensure the changes persisted end-to-end
    get_response = client.get('/auth/me', headers=auth_headers)
    
    # 4. Assert: Verify the GET endpoint returns the newly mutated values
    assert get_response.status_code == 200
    profile_data = get_response.get_json()
    
    assert profile_data['first_name'] == "Jane"
    assert profile_data['last_name'] == "Milo"
    assert profile_data['email'] == "jane.milo@school.edu"  # Verifies unedited field remains stable
