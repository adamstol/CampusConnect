from datetime import datetime, timezone
from extensions import db


class UserClub(db.Model):
    __tablename__ = 'user_clubs'

    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True, nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id'), primary_key=True, nullable=False)
    role = db.Column(db.String(), nullable=False, default='member')
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user = db.relationship('User', backref=db.backref('user_clubs', cascade='all, delete-orphan'))
    club = db.relationship('Club', backref=db.backref('user_clubs', cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<UserClub user_id={self.user_id} club_id={self.club_id} role={self.role}>'
