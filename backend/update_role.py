from main import app
from extensions import db
from auth.user import User

with app.app_context():
    # Find Jason Deng and update role to Administrator
    user = User.query.filter_by(first_name='Jason', last_name='Deng').first()
    
    if user:
        old_role = user.role_name
        user.role_name = 'Administrator'
        db.session.commit()
        
        print(f"Updated {user.first_name} {user.last_name}")
        print(f"  Email: {user.email}")
        print(f"  Old role: {old_role}")
        print(f"  New role: {user.role_name}")
    else:
        print("Jason Deng not found in database")
