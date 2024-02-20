# ComfyUI Launcher (BETA)
The easiest way to run & use ComfyUI

## Features
- Import & run any workflow with **ZERO setup**
- Automatically installs custom nodes, downloads model files, etc.
- Workflows exported by this tool can be run by anyone using this tool with **ZERO setup**
- Create & manage multiple ComfyUI workflows
- Each workflow runs in its own isolated environment
- Prevents your workflows from suddenly breaking when updating custom nodes, ComfyUI, etc.

## Installation
```
git clone https://github.com/ComfyWorkflows/comfyui-launcher
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd web/ && npm install
```

## Updating

```
git pull
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
