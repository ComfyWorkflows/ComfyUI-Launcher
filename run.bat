@echo off

:: Check if the "venv" directory exists
if not exist "venv" (
    echo Creating virtual environment for ComfyUI Launcher...
    python -m venv venv
)

echo Installing required packages...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo ComfyUI Launcher is starting...

cd server

:: Start Celery worker in the background
start "Celery Worker" cmd /c "call ..\venv\Scripts\activate.bat && celery -A server.celery_app --workdir=. worker --loglevel=DEBUG"
set celery_worker_pid=%!%

:: Start the server
python server.py

:: Kill Celery worker after the server finishes
taskkill /PID %celery_worker_pid% /F
