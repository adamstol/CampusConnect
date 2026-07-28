from main import app
from extensions import db
from auth.user import User

with app.app_context():
    # Update all users to have email verified
    users = User.query.all()
    for user in users:
        user.is_email_verified = True
    
    db.session.commit()
    
    print(f"Updated {len(users)} users to is_email_verified=True")
    for user in users:
        print(f"  - {user.first_name} {user.last_name} ({user.email})")
