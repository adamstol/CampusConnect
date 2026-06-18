import os
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask
from flask_jwt_extended import JWTManager
from extensions import db
from auth.routes import auth_bp

load_dotenv()

app = Flask(__name__)

# Configure the SQLAlchemy database URI using the environment variable from the .env file.
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure JWT settings using environment variables from the .env file.
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)


# Initialize the database and JWT manager with the Flask app
db.init_app(app)
jwt = JWTManager(app)

# Register the authentication blueprint with the Flask app
app.register_blueprint(auth_bp)

# Create the database tables if they don't exist
with app.app_context():
    db.create_all()

# This function is the entry point for the Flask application. It defines a route for the root URL and returns a simple Hello, World!
@app.route('/')
def index():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)