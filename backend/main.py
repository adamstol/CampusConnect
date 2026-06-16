import os
from dotenv import load_dotenv
from flask import Flask

load_dotenv()

app = Flask(__name__)

# Configure the SQLAlchemy database URI using the environment variable from the .env file.
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# This function is the entry point for the Flask application. It defines a route for the root URL and returns a simple Hello, World!
@app.route('/')
def index():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)