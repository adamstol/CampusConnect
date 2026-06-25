from datetime import datetime, timezone
from extensions import db

class Event(db.Model):
    __tablename__ = 'events'

    event_id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id'), nullable=False)
    event_name = db.Column(db.String(), nullable=False)
    description = db.Column(db.String(), nullable=True)
    event_date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    club = db.relationship('Club', backref=db.backref('events', cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<Event {self.event_name}>'
