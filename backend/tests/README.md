# Backend Testing Framework

This directory contains automated unit and integration tests written with **Pytest** for the backend service.

---

## Prerequisites

Ensure your local Docker container environment is running before executing commands:

```bash
docker compose up -d
```

## Run all tests
```bash
docker compose exec backend python -m pytest -v
```

## Run targeted tests
Tests are bound to the Requirements Traceability Matrix (RTM) using the custom @pytest.mark.rtm("REQ_ID") decorator.
```bash
# Run all tests tied to Requirement S-01
docker compose exec backend python -m pytest -m "rtm('S-01')"
```

## Framework integration example
To tag a new test function with an RTM requirement, apply the @pytest.mark.rtm decorator:
```bash
import pytest

@pytest.mark.rtm("S-01")
def test_login_valid_credentials_success(client, app):
    # Test implementation targeting requirement S-01
    pass
```
