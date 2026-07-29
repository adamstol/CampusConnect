import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_mail import Message
import bcrypt
import secrets
from datetime import datetime, timedelta, timezone
from extensions import db, mail
from auth.user import User

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# This Endpoint allows users to register by providing their first name, last name, email, password, role is defaults to Student, will update via SQL for other roles.
@auth_bp.route('/register', methods=['POST'])
def register():
    # Get the JSON data from the request and extract the user details
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    password = data.get('password')
    role_name = data.get('role_name', 'Student')
    
    if not all([first_name, last_name, email, password]):
        return jsonify({'message': 'Missing required fields'}), 400
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'Email already registered'}), 400
    
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password=hashed_password.decode('utf-8'),
        role_name=role_name
    )
    
    token = secrets.token_urlsafe(32)
    new_user.email_verification_token = token
    new_user.email_verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    db.session.add(new_user)
    db.session.commit()

    base_url = os.getenv('BASE_URL', 'http://localhost:8080')
    verify_url = f"{base_url}/auth/verify-email?token={token}"
    msg = Message(
        subject='CampusConnect — Verify your email',
        recipients=[email],
        body=(
            f"Hi {first_name},\n\n"
            f"Thanks for signing up! Use the token below to verify your email address:\n\n"
            f"{token}\n\n"
            f"This token expires in 24 hours.\n\n"
            f"— The CampusConnect Team"
        )
    )
    try:
        mail.send(msg)
    except Exception as e:
        print(f"[WARN] Failed to send verification email to {email}: {e}")

    return jsonify({'message': 'Successfully Registered. Please verify your email.'}), 201

# This Endpoint allows users to verify their email by providing the token they received in their email.
@auth_bp.route('/verify-email', methods=['GET'])
def verify_email():
    
    # Get the token from the query string (e.g. /verify-email?token=...)
    token = request.args.get('token')

    if not token:
        return jsonify({'message': 'Missing token'}), 400

    user = User.query.filter_by(email_verification_token=token).first()

    if not user:
        return jsonify({'message': 'Invalid token'}), 400

    if user.email_verification_token_expires_at < datetime.utcnow():
        return jsonify({'message': 'Token expired'}), 400

    user.is_email_verified = True
    user.is_account_enabled = True
    user.email_verification_token = None
    user.email_verification_token_expires_at = None
    db.session.commit()

    return jsonify({'message': 'Email verified successfully'}), 200

# This Endpoint allows users to log in by providing their email and password. 
@auth_bp.route('/login', methods=['POST'])
def login():
    
    # Get the JSON data from the request and extract the email and password
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({'message': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'message': 'Invalid Email'}), 401

    if user.is_account_locked:
        return jsonify({'message': 'Account is locked. Try resetting your password.'}), 403

    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 3:
            user.is_account_locked = True
            user.is_account_enabled = False
        db.session.commit()
        return jsonify({'message': 'Invalid Password'}), 401

    # Successful login — reset failed attempts
    user.failed_login_attempts = 0
    db.session.commit()

    access_token = create_access_token(identity=str(user.user_id))
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }), 200

# This endpoint returns the authenticated user's profile info
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'role_name': user.role_name,
        'notify_in_app': user.notify_in_app,
        'notify_email': user.notify_email,
    }), 200

# This Endpoint allows for authenticated users to update their profile information
@auth_bp.route('/profile', methods=['PATCH'])
@jwt_required()
def update_profile():
    
    # Get the user ID from the JWT and fetch the user from the database
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()

    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'email' in data:
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.user_id != user.user_id:
            return jsonify({'message': 'Email already in use'}), 409
        user.email = data['email']
    if 'password' in data:
        user.password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    if 'notify_in_app' in data:
        user.notify_in_app = bool(data['notify_in_app'])
    if 'notify_email' in data:
        user.notify_email = bool(data['notify_email'])

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200


# This endpoint verfies the status of the user's account
@auth_bp.route('/status', methods=['GET'])
@jwt_required()
def account_status():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    status = {
        'is_email_verified': user.is_email_verified,
        'is_account_enabled': user.is_account_enabled,
        'is_account_locked': user.is_account_locked
    }
    return jsonify(status), 200

# This endpoint generates a password reset token
@auth_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    
    # Get the JSON data from the request and extract the email
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Email is not registered'}), 200
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
    db.session.commit()

    msg = Message(
        subject='CampusConnect — Reset your password',
        recipients=[email],
        body=(
            f"Hi {user.first_name},\n\n"
            f"We received a request to reset your password. Copy the token below and paste it into the password reset page:\n\n"
            f"{token}\n\n"
            f"This token expires in 1 hour. If you did not request a password reset, you can ignore this email.\n\n"
            f"— The CampusConnect Team"
        )
    )
    try:
        mail.send(msg)
    except Exception as e:
        print(f"[WARN] Failed to send verification email to {email}: {e}")

    return jsonify({'message': 'Password reset email sent'}), 200

# This endpoint allows users to reset their password using the token they received in their email.
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    
    # Get the JSON data from the request and extract the token and new password
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not all([token, new_password]):
        return jsonify({'message': 'Token and new password are required'}), 400
    
    user = User.query.filter_by(password_reset_token=token).first()
    if not user:
        return jsonify({'message': 'Invalid token'}), 400
    
    if user.password_reset_token_expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        return jsonify({'message': 'Token expired'}), 400
    
    user.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_reset_token = None
    user.password_reset_token_expires_at = None
    user.failed_login_attempts = 0
    user.is_account_locked = False
    user.is_account_enabled = True
    db.session.commit() 
    return jsonify({'message': 'Password reset successfully'}), 200

# This Endpoint allows for authenticated users to delete their account
@auth_bp.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_account():
    
    # Get the user ID from the JWT and fetch the user from the database
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Account deleted successfully'}), 200
