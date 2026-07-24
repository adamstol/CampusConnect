from main import app
from extensions import db
from auth.user import User

with app.app_context():
    # Find user with smithleonard@gmail.com and verify email
    user = User.query.filter_by(email='smithleonard@gmail.com').first()
    
    if user:
        user.is_email_verified = True
        db.session.commit()
        
        print(f"Updated {user.first_name} {user.last_name}")
        print(f"  Email: {user.email}")
        print(f"  is_email_verified: {user.is_email_verified}")
    else:
        print("User with email smithleonard@gmail.com not found in database")
