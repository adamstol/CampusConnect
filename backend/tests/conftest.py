import os
import pytest

# 1. Intercept the environment BEFORE main is imported
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['JWT_SECRET_KEY'] = 'super-secret-test-key-that-is-at-least-32-bytes-long'
os.environ['TESTING'] = 'True'

# 2. Now import the app safely
from main import app as flask_app
from extensions import db as shared_db

@pytest.fixture(scope='session')
def app():
    flask_app.config.update({"TESTING": True})
    return flask_app

@pytest.fixture(scope='session')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function', autouse=True)
def clean_db(app):
    """Ensures a fresh database state for every single test isolation."""
    with app.app_context():
        shared_db.create_all()  # Re-creates tables if a previous test dropped them
        yield shared_db
        shared_db.session.remove()
        shared_db.drop_all()    # Cleans the slate after the test finishes
