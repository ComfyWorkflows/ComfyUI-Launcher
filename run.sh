# check if a venv/ directory exists
# if it doesn't, run: python3 -m venv venv
# then run: source venv/bin/activate && pip install -r requirements.txt
if [ ! -d "venv" ]; then
  echo "Creating virtual environment for ComfyUI Launcher...\n\n"
  python3 -m venv venv
  echo "\n\n"
fi

echo "Installing required packages...\n\n"
source venv/bin/activate
pip install -r requirements.txt

echo "\n\n"
echo "ComfyUI Launcher is starting...\n\n"

cd server/ && python server.py