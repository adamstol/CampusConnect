#!/bin/sh
set -e
flask db upgrade
exec gunicorn main:app --bind 0.0.0.0:10000 --access-logfile -
