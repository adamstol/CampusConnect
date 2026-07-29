from datetime import datetime, timezone
from extensions import db


class Notification(db.Model):
    __tablename__ = 'notifications'

    notification_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    title = db.Column(db.String(), nullable=False)
    body = db.Column(db.String(), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.club_id'), nullable=True)
    announcement_id = db.Column(db.Integer, db.ForeignKey('announcements.announcement_id'), nullable=True)

    user = db.relationship('User', backref=db.backref('notifications', cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<Notification {self.notification_id} user={self.user_id} read={self.is_read}>'
