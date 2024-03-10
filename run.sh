#!/bin/bash

if [ ! -d "venv" ]; then
  echo "Creating virtual environment for ComfyUI Launcher...\n\n"
  python3 -m venv venv
  echo "\n\n"
fi

echo "Installing required packages...\n\n"
. venv/bin/activate
pip install -r requirements.txt

echo "\n\n"
echo "ComfyUI Launcher is starting...\n\n"


cd server/

# start Celery worker in the bg
celery -A server worker --loglevel=info &
celery_worker_pid=$!

cd server/ && python server.py

# kill Celery worker when server.py is done
kill $celery_worker_pid