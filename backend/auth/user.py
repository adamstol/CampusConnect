from datetime import datetime, timezone
from extensions import db


class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(), nullable=False)
    last_name = db.Column(db.String(), nullable=False)
    email = db.Column(db.String(), unique=True, nullable=False)
    password = db.Column(db.String(), nullable=False)
    role_name = db.Column(db.String(), nullable=False)
    is_email_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    is_account_enabled = db.Column(db.Boolean, default=True, nullable=False)
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    is_account_locked = db.Column(db.Boolean, default=False, nullable=False)
    password_reset_token = db.Column(db.String(), nullable=True)
    password_reset_token_expires_at = db.Column(db.DateTime, nullable=True)
    email_verification_token = db.Column(db.String(), nullable=True)
    email_verification_token_expires_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<User {self.email}>'
