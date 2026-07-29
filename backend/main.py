import os
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from extensions import db, mail
from auth.routes import auth_bp
from club.routes import club_bp
from event.routes import event_bp
from announcement.routes import announcement_bp
from auth.user import User
from club.club import Club
from userclub.userclub import UserClub
from event.event import Event
from userevent.userevent import UserEvent
from announcement.announcement import Announcement
from admin.routes import admin_bp
from upload.routes import upload_bp
from flask_migrate import Migrate

load_dotenv()

app = Flask(__name__)
frontend_origins = [
    origin.strip()
    for origin in os.getenv('FRONTEND_ORIGINS', os.getenv('FRONTEND_ORIGIN', '')).split(',')
    if origin.strip()
]
frontend_origins.append('http://localhost:3000')
CORS(app, origins=frontend_origins)

# Configure the SQLAlchemy database URI using the environment variable from the .env file.
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure JWT settings using environment variables from the .env file.
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# Configure Flask-Mail using environment variables from the .env file.
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

# Initialize the database, JWT manager, mail, and migration engine with the Flask app
db.init_app(app)
jwt = JWTManager(app)
mail.init_app(app)
migrate = Migrate(app,db)

# Register the authentication blueprint with the Flask app
app.register_blueprint(auth_bp)
app.register_blueprint(club_bp)
app.register_blueprint(event_bp)
app.register_blueprint(announcement_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(upload_bp)

# NOTE: Schema changes are now handled by Flask-Migrate (`flask db upgrade`),
# run as a pre-deploy step on Render. db.create_all() is left here only as a
# safety net for a completely fresh/empty database (e.g. a new local dev
# environment) — it will NOT alter existing tables or add new columns, so it
# is not a substitute for generating and applying migrations.
with app.app_context():
    db.create_all()

# This function is the entry point for the Flask application. It defines a route for the root URL and returns a simple Hello, World!
@app.route('/')
def index():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)

