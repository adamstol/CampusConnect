from datetime import datetime, timezone
from extensions import db


class UserClub(db.Model):
    __tablename__ = 'user_clubs'

    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True, nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id'), primary_key=True, nullable=False)
    
    user = db.relationship('User', backref='user_clubs')
    club = db.relationship('Club', backref='user_clubs')

    def __repr__(self):
        return f'<UserClub user_id={self.user_id} club_id={self.club_id}>'
