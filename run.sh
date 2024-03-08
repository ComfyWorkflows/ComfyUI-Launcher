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

cd server/ && python server.py
