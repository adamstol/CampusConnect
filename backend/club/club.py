from datetime import datetime, timezone
from extensions import db

class Club(db.Model):
    __tablename__ = 'clubs'

    club_id = db.Column(db.Integer, primary_key=True)
    club_name = db.Column(db.String(), nullable=False, unique=True)
    description = db.Column(db.String(), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f'<Club {self.club_name}>'