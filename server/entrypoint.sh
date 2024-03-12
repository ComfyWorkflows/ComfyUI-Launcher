#!/bin/bash

echo "ComfyUI Launcher is starting..."
echo
echo

# start Celery worker in the bg
celery -A server.celery_app --workdir=. worker --loglevel=INFO &
celery_worker_pid=$!

# if the environment variable PROXY_MODE is set to "true", start nginx
if [ "$PROXY_MODE" = "true" ]; then
    echo "Starting Nginx reverse proxy (PROXY_MODE=true)..."
    cat /etc/nginx/nginx.conf.template | envcat -f j2 '*' > /etc/nginx/nginx.conf
    nginx -g "daemon off;" &
fi

python server.py

# kill Celery worker when server.py is done
kill $celery_worker_pid