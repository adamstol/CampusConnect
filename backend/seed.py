"""Reset and reseed the local database with sample data for manual testing.

Wipes all rows from the tables below and reinserts a fixed baseline, so
rerunning this always restores the same known starting state.

Run from the backend/ directory with the virtualenv active:
    python seed.py
"""
import bcrypt
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
from sqlalchemy import text

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


def _ensure_local_database():
    db_url = app.config.get('SQLALCHEMY_DATABASE_URI') or ''
    host = urlparse(db_url).hostname or ''
    if host not in ('localhost', '127.0.0.1'):
        raise SystemExit(
            f"Refusing to run: DATABASE_URL points at '{host}', not localhost/127.0.0.1.\n"
            "This script wipes all data in the target database — only run it against a local dev database."
        )


def reset_tables():
    # TRUNCATE ... RESTART IDENTITY resets both the rows and the id sequences,
    # so ids are stable across reseeds (e.g. Chess Club is always club_id 1).
    # CASCADE handles the foreign key dependency order automatically.
    db.session.execute(text(
        'TRUNCATE TABLE users, clubs, events, user_clubs, user_events, announcements '
        'RESTART IDENTITY CASCADE'
    ))
    db.session.commit()


def seed():
    with app.app_context():
        _ensure_local_database()
        reset_tables()

        alice = User(
            first_name='Alice', last_name='Smith', email='alice@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Club Representative',
            is_email_verified=True, is_account_enabled=True,
        )
        bob = User(
            first_name='Bob', last_name='Jones', email='bob@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Club Representative',
            is_email_verified=True, is_account_enabled=True,
        )
        charlie = User(
            first_name='Charlie', last_name='Nguyen', email='charlie@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Student',
            is_email_verified=True, is_account_enabled=True,
        )
        dana = User(
            first_name='Dana', last_name='Lopez', email='dana@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Club Representative',
            is_email_verified=True, is_account_enabled=True,
        )
        admin = User(
            first_name='Admin', last_name='User', email='admin@example.com',
            password=hash_password(SEED_PASSWORD), role_name='Administrator',
            is_email_verified=True, is_account_enabled=True,
        )
        # charlie is the fresh student test account - 0 club memberships
        db.session.add_all([alice, bob, charlie, dana, admin])
        db.session.commit()

        chess_club = Club(club_name='Chess Club', description='Weekly casual and competitive chess.', status='approved')
        coding_club = Club(club_name='Coding Club', description='Build side projects and prep for hackathons.', status='approved')
        photography_club = Club(club_name='Photography Club', description='Weekend photo walks and editing workshops.', status='approved')
        hiking_club = Club(club_name='Hiking Club', description='Group hikes around the city and beyond.', status='approved')
        db.session.add_all([chess_club, coding_club, photography_club, hiking_club])
        db.session.commit()

        db.session.add_all([
            UserClub(user_id=alice.user_id, club_id=chess_club.club_id, role='admin'),
            UserClub(user_id=bob.user_id, club_id=chess_club.club_id, role='member'),
            UserClub(user_id=admin.user_id, club_id=chess_club.club_id, role='member'),
            UserClub(user_id=bob.user_id, club_id=coding_club.club_id, role='admin'),
            UserClub(user_id=alice.user_id, club_id=coding_club.club_id, role='member'),
            UserClub(user_id=admin.user_id, club_id=coding_club.club_id, role='admin'),
            UserClub(user_id=bob.user_id, club_id=photography_club.club_id, role='member'),
            UserClub(user_id=dana.user_id, club_id=photography_club.club_id, role='admin'),
            UserClub(user_id=admin.user_id, club_id=photography_club.club_id, role='member'),
            UserClub(user_id=dana.user_id, club_id=hiking_club.club_id, role='admin'),
            UserClub(user_id=admin.user_id, club_id=hiking_club.club_id, role='admin'),
        ])
        db.session.commit()

        chess_event = Event(
            club_id=chess_club.club_id, event_name='Weekly Chess Night',
            description='Bring a board or use one of ours.',
            event_date=datetime.now(timezone.utc) + timedelta(days=3),
            location='Student Centre - Room 204', status='approved',
        )
        chess_event_2 = Event(
            club_id=chess_club.club_id, event_name='Chess Tournament Qualifiers',
            description='Single-elimination bracket, top 4 advance to the term final.',
            event_date=datetime.now(timezone.utc) + timedelta(days=10),
            location='Student Centre - Room 204', status='approved',
        )
        chess_event_3 = Event(
            club_id=chess_club.club_id, event_name='Beginner Chess Workshop',
            description='Learn openings and basic tactics, no experience required.',
            event_date=datetime.now(timezone.utc) + timedelta(days=17),
            location='Student Centre - Room 204', status='approved',
        )
        coding_event = Event(
            club_id=coding_club.club_id, event_name='Hack Night',
            description='Casual co-working session, all skill levels welcome.',
            event_date=datetime.now(timezone.utc) + timedelta(days=5),
            location='Lassonde Building', status='approved',
        )
        coding_event_2 = Event(
            club_id=coding_club.club_id, event_name='Intro to Git Workshop',
            description='Branches, merges, and how to undo almost anything.',
            event_date=datetime.now(timezone.utc) + timedelta(days=9),
            location='Lassonde Building', status='approved',
        )
        coding_event_3 = Event(
            club_id=coding_club.club_id, event_name='Hackathon Prep Session',
            description='Form teams and scope project ideas ahead of the weekend hackathon.',
            event_date=datetime.now(timezone.utc) + timedelta(days=14),
            location='Lassonde Building', status='approved',
        )
        photography_event = Event(
            club_id=photography_club.club_id, event_name='Golden Hour Photo Walk',
            description='Bring a camera or a phone, all levels welcome.',
            event_date=datetime.now(timezone.utc) + timedelta(days=4),
            location='Commons Quad', status='approved',
        )
        photography_event_2 = Event(
            club_id=photography_club.club_id, event_name='Portrait Lighting Workshop',
            description='Hands-on session with studio lights and reflectors.',
            event_date=datetime.now(timezone.utc) + timedelta(days=11),
            location='Gales Gallery', status='approved',
        )
        photography_event_3 = Event(
            club_id=photography_club.club_id, event_name='Editing 101: Lightroom Basics',
            description='Bring a laptop, we will cover culling and basic color correction.',
            event_date=datetime.now(timezone.utc) + timedelta(days=18),
            location='Sherman Health Science Research Centre - Lab 2', status='approved',
        )
        hiking_event = Event(
            club_id=hiking_club.club_id, event_name='Trail Cleanup Hike',
            description='Light trail maintenance followed by a group hike.',
            event_date=datetime.now(timezone.utc) + timedelta(days=6),
            location='Rouge National Urban Park', status='approved',
        )
        hiking_event_2 = Event(
            club_id=hiking_club.club_id, event_name='Sunrise Summit Hike',
            description='Early start, moderate difficulty, coffee after at the trailhead.',
            event_date=datetime.now(timezone.utc) + timedelta(days=13),
            location='Rouge National Urban Park', status='approved',
        )
        hiking_event_3 = Event(
            club_id=hiking_club.club_id, event_name='Winter Gear Prep Night',
            description='What to pack, layering tips, and gear swap for the colder hikes.',
            event_date=datetime.now(timezone.utc) + timedelta(days=20),
            location='Student Centre - Room 204', status='approved',
        )
        db.session.add_all([
            chess_event, chess_event_2, chess_event_3,
            coding_event, coding_event_2, coding_event_3,
            photography_event, photography_event_2, photography_event_3,
            hiking_event, hiking_event_2, hiking_event_3,
        ])
        db.session.commit()

        db.session.add_all([
            # Chess Night: alice + bob attending; admin is a member but not registered (add dropdown)
            UserEvent(user_id=alice.user_id, event_id=chess_event.event_id, status='attending'),
            UserEvent(user_id=bob.user_id, event_id=chess_event.event_id, status='attending'),
            UserEvent(user_id=alice.user_id, event_id=chess_event_2.event_id, status='attending'),
            UserEvent(user_id=bob.user_id, event_id=chess_event_2.event_id, status='maybe'),
            UserEvent(user_id=charlie.user_id, event_id=chess_event_3.event_id, status='attending'),
            # Hack Night: alice attending; bob (admin) is a member but not registered
            UserEvent(user_id=alice.user_id, event_id=coding_event.event_id, status='attending'),
            UserEvent(user_id=bob.user_id, event_id=coding_event_2.event_id, status='attending'),
            UserEvent(user_id=charlie.user_id, event_id=coding_event_3.event_id, status='maybe'),
            # Golden Hour: bob maybe; dana (admin) available to add
            UserEvent(user_id=bob.user_id, event_id=photography_event.event_id, status='maybe'),
            UserEvent(user_id=dana.user_id, event_id=photography_event_2.event_id, status='attending'),
            UserEvent(user_id=charlie.user_id, event_id=photography_event_3.event_id, status='attending'),
            # Trail Cleanup: dana attending; charlie available to add
            UserEvent(user_id=dana.user_id, event_id=hiking_event.event_id, status='attending'),
            UserEvent(user_id=dana.user_id, event_id=hiking_event_2.event_id, status='attending'),
            UserEvent(user_id=charlie.user_id, event_id=hiking_event_2.event_id, status='not_attending'),
        ])

        db.session.add_all([
            Announcement(
                club_id=chess_club.club_id, created_by=alice.user_id,
                title='Welcome to Chess Club!', body='Excited to kick off this term, see everyone Thursday.',
            ),
            Announcement(
                club_id=chess_club.club_id, created_by=alice.user_id,
                title='Tournament sign-ups are open', body='Sign up at the next meeting or reply to this announcement to reserve a spot.',
            ),
            Announcement(
                club_id=chess_club.club_id, created_by=bob.user_id,
                title='New meeting room starting next week', body="We've outgrown Room 204's neighbour — same room, just double-checking everyone saw the update.",
            ),
            Announcement(
                club_id=coding_club.club_id, created_by=bob.user_id,
                title='Hack Night this Friday', body='Bring your laptop, snacks provided.',
            ),
            Announcement(
                club_id=coding_club.club_id, created_by=bob.user_id,
                title='Hackathon squad forming', body='Looking for 2-3 more people for the upcoming hackathon, drop by Hack Night to join a team.',
            ),
            Announcement(
                club_id=coding_club.club_id, created_by=admin.user_id,
                title='Git workshop recap posted', body='Slides and recording from last week are linked in the club Discord.',
            ),
            Announcement(
                club_id=photography_club.club_id, created_by=dana.user_id,
                title='Photo walk this weekend', body="Weather looks good, let's meet at the quad at 6pm.",
            ),
            Announcement(
                club_id=photography_club.club_id, created_by=dana.user_id,
                title='Lighting workshop announced', body='Studio space is booked for next week, no need to bring your own gear.',
            ),
            Announcement(
                club_id=photography_club.club_id, created_by=dana.user_id,
                title='Camera rentals now available', body='A few club bodies and lenses are available to borrow, message an admin to book one.',
            ),
            Announcement(
                club_id=hiking_club.club_id, created_by=dana.user_id,
                title='New hiking season kickoff', body='First hike of the term, wear proper footwear.',
            ),
            Announcement(
                club_id=hiking_club.club_id, created_by=dana.user_id,
                title='Sunrise hike sign-ups', body='Early start, limited spots for carpooling, comment if you need a ride.',
            ),
            Announcement(
                club_id=hiking_club.club_id, created_by=dana.user_id,
                title='Winter gear check reminder', body='Bring anything you want to swap or sell to the gear prep night.',
            ),
        ])
        db.session.commit()

        print('Local database reset and reseeded:')
        print(f'  All passwords: {SEED_PASSWORD}')
        print()
        print('  charlie@example.com  — Student          (fresh account, no club memberships)')
        print('  alice@example.com    — Club Representative (Chess Club admin, Coding Club member)')
        print('  bob@example.com      — Club Representative (Coding Club admin, Chess/Photo member)')
        print('  dana@example.com     — Club Representative (Photography + Hiking Club admin)')
        print('  admin@example.com    — Administrator     (Coding + Hiking admin, Chess + Photo member)')
        print()
        print('  Clubs: Chess Club, Coding Club, Photography Club, Hiking Club')
        print('  Events: 3 per club')
        print('  Announcements: 3 per club')


if __name__ == '__main__':
    seed()
