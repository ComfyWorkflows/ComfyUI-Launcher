#!/bin/bash

echo "ComfyUI Launcher is starting...\n\n"

# start Celery worker in the bg
celery -A server worker --loglevel=info &
celery_worker_pid=$!

python server.py

# kill Celery worker when server.py is done
kill $celery_worker_pid