#!/bin/bash

echo "ComfyUI Launcher is starting..."
echo
echo

# start Celery worker in the bg
celery -A server.celery_app --workdir=. worker --loglevel=INFO &
celery_worker_pid=$!

python server.py

# kill Celery worker when server.py is done
kill $celery_worker_pid