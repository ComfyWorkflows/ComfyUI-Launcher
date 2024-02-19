# ComfyUI Launcher
The easiest way to run & use ComfyUI

## Features
- Import & run any workflow with ZERO setup
	- automatically installs custom nodes, downloads model files, etc.
- Export any workflow w/ ZERO setup
	- All workflows exported by this tool can be imported by anyone running this tool
- Create & manage multiple ComfyUI workflows
	- Each workflow operates in its own isolated environment
	- This prevents your workflows from suddenly not working when updating custom nodes, ComfyUI, etc.

## Installation
```
git clone https://github.com/ComfyWorkflows/comfyui-launcher
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd web/ && npm install
```

## Usage
### Start server
```
cd server/ && python server.py
```

### Start web UI
```
cd web/ && npm run dev
```

Open http://localhost:3000
