from datetime import datetime, timezone
from extensions import db


class UserEvent(db.Model):
    __tablename__ = 'user_events'

    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True, nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id'), primary_key=True, nullable=False)
    status = db.Column(db.String(), nullable=False, default='registered')
    registered_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user = db.relationship('User', backref=db.backref('user_events', cascade='all, delete-orphan'))
    event = db.relationship('Event', backref=db.backref('user_events', cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<UserEvent user_id={self.user_id} event_id={self.event_id} status={self.status}>'
