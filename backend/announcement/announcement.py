from datetime import datetime, timezone
from extensions import db


class Announcement(db.Model):
    __tablename__ = 'announcements'

    announcement_id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    title = db.Column(db.String(), nullable=False)
    body = db.Column(db.String(), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    club = db.relationship('Club', backref=db.backref('announcements', cascade='all, delete-orphan'))
    creator = db.relationship('User', backref=db.backref('announcements', cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<Announcement {self.announcement_id} club={self.club_id}>'
