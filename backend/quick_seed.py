from main import app
from extensions import db
from club.club import Club
from event.event import Event
from datetime import datetime, timedelta, timezone

with app.app_context():
    clubs_data = [
        {'name': 'Chess Club', 'desc': 'Weekly casual and competitive chess.'},
        {'name': 'Coding Club', 'desc': 'Build side projects and prep for hackathons.'},
        {'name': 'Photography Club', 'desc': 'Weekend photo walks and editing workshops.'},
    ]
    
    clubs = []
    for club_data in clubs_data:
        club = Club(club_name=club_data['name'], description=club_data['desc'])
        db.session.add(club)
        clubs.append(club)
    
    db.session.commit()
    
    now = datetime.now(timezone.utc)
    for club in clubs:
        for i in range(3):
            event = Event(
                club_id=club.club_id,
                event_name=f'{club.club_name} Event - Day {i+1}',
                description=f'A great {club.club_name} event',
                event_date=now + timedelta(days=i+1),
                location='York University'
            )
            db.session.add(event)
    
    db.session.commit()
    
    future_events = Event.query.filter(Event.event_date >= now).order_by(Event.event_date).all()
    print(f'Created {len(future_events)} future events')
    for event in future_events:
        print(f'  - {event.event_name}')
