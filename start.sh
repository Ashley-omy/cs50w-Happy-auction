#!/usr/bin/env bash
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

gunicorn project3.wsgi:application --bind 0.0.0.0:$PORT
STATIC_ROOT = BASE_DIR / "staticfiles"
