"""Seed the local database with sample data for manual testing.

Run from the backend/ directory with the virtualenv active:
    python seed.py
"""
import bcrypt
from datetime import datetime, timedelta, timezone

from main import app
from extensions import db
from auth.user import User
from club.club import Club
from userclub.userclub import UserClub
from event.event import Event
from userevent.userevent import UserEvent
from announcement.announcement import Announcement

SEED_PASSWORD = 'password123'


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def seed():
    with app.app_context():
        if User.query.filter_by(email='alice@example.com').first():
            print('Seed data already present, skipping.')
            return

        alice = User(
            first_name='Alice', last_name='Smith', email='alice@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Student',
            is_email_verified=True, is_account_enabled=True,
        )
        bob = User(
            first_name='Bob', last_name='Jones', email='bob@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Student',
            is_email_verified=True, is_account_enabled=True,
        )
        admin = User(
            first_name='Admin', last_name='User', email='admin@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Administrator',
            is_email_verified=True, is_account_enabled=True,
        )
        db.session.add_all([alice, bob, admin])
        db.session.commit()

        chess_club = Club(club_name='Chess Club', description='Weekly casual and competitive chess.')
        coding_club = Club(club_name='Coding Club', description='Build side projects and prep for hackathons.')
        db.session.add_all([chess_club, coding_club])
        db.session.commit()

        db.session.add_all([
            UserClub(user_id=alice.user_id, club_id=chess_club.club_id, role='admin'),
            UserClub(user_id=bob.user_id, club_id=coding_club.club_id, role='admin'),
            UserClub(user_id=bob.user_id, club_id=chess_club.club_id, role='member'),
            UserClub(user_id=alice.user_id, club_id=coding_club.club_id, role='member'),
        ])
        db.session.commit()

        chess_event = Event(
            club_id=chess_club.club_id, event_name='Weekly Chess Night',
            description='Bring a board or use one of ours.',
            event_date=datetime.now(timezone.utc) + timedelta(days=3),
            location='Student Centre - Room 204',
        )
        coding_event = Event(
            club_id=coding_club.club_id, event_name='Hack Night',
            description='Casual co-working session, all skill levels welcome.',
            event_date=datetime.now(timezone.utc) + timedelta(days=5),
            location='Lassonde Building',
        )
        db.session.add_all([chess_event, coding_event])
        db.session.commit()

        db.session.add_all([
            UserEvent(user_id=bob.user_id, event_id=chess_event.event_id, status='attending'),
            UserEvent(user_id=alice.user_id, event_id=coding_event.event_id, status='attending'),
        ])

        db.session.add_all([
            Announcement(
                club_id=chess_club.club_id, created_by=alice.user_id,
                title='Welcome to Chess Club!', body='Excited to kick off this term, see everyone Thursday.',
            ),
            Announcement(
                club_id=coding_club.club_id, created_by=bob.user_id,
                title='Hack Night this Friday', body='Bring your laptop, snacks provided.',
            ),
        ])
        db.session.commit()

        print('Seed data created:')
        print(f'  Users: alice@example.com / bob@example.com / admin@example.com (password: {SEED_PASSWORD})')
        print('  Clubs: Chess Club, Coding Club')
        print('  Events: Weekly Chess Night, Hack Night')
        print('  Announcements: 1 per club')


if __name__ == '__main__':
    seed()
