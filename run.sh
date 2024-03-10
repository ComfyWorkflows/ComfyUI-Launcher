#!/bin/bash

if [ ! -d "venv" ]; then
  echo "Creating virtual environment for ComfyUI Launcher..."
  echo
  echo
  python3 -m venv venv
  echo
  echo
fi

echo "Installing required packages..."
echo
echo
. venv/bin/activate
pip install -r requirements.txt

echo
echo
echo "ComfyUI Launcher is starting..."
echo
echo

cd server/

# start Celery worker in the bg
celery -A server.celery_app --workdir=. worker --loglevel=DEBUG &
celery_worker_pid=$!
echo "Celery worker started with PID: $celery_worker_pid"

python server.py

# kill Celery worker when server.py is done
kill $celery_worker_pid