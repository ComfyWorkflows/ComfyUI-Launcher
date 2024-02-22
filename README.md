# ComfyUI Launcher (BETA)
Run any ComfyUI workflow w/ **ZERO setup**.

Need help? Join our Discord!

[![](https://dcbadge.vercel.app/api/server/kXS43yTRNA)](https://discord.gg/kXS43yTRNA)

## Features
- Run any workflow with **ZERO setup**
- Automatically installs custom nodes, downloads model files, etc.
- Workflows exported by this tool can be run by anyone using this tool with **ZERO setup**
- Work on multiple ComfyUI workflows at the same time
- Each workflow runs in its own isolated environment
- Prevents your workflows from suddenly breaking when updating custom nodes, ComfyUI, etc.

<p float="middle">
  <img src="./assets/launcher_projects.png" width="45%" />
  <img src="./assets/launcher_new_workflow.png" width="45%" />
  <img src="./assets/launcher_import_workflow.png" width="45%" />
  <img src="./assets/launcher_comfyui.png" width="45%" />
</p>

## Demo

Running a workflow json file w/ no setup

https://github.com/ComfyWorkflows/ComfyUI-Launcher/assets/33400216/aa17680d-eee5-4e6d-abc4-9f7551f9a4ad

## Requirements
- Python 3
- Docker or Node/npm (19 or later)

## Installation
```
git clone https://github.com/ComfyWorkflows/comfyui-launcher
cd comfyui-launcher/
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Starting ComfyUI Launcher

### Option 1: Using Docker
```
source venv/bin/activate
cd server/ && python server.py
```
Open http://localhost:3000

### Option 2: Using Node/npm
```
cd web/ && npm install # Only need to run this once
npm run dev # must be in the web/ folder
```
In a separate terminal, run:
```
source venv/bin/activate
cd server/ && python server.py --only-server
```

Open http://localhost:3000

## Updating ComfyUI Launcher
```
git pull
source venv/bin/activate
pip install -r requirements.txt
docker pull thecooltechguy/comfyui_launcher_web # if using Docker
```

## Coming soon
- Better way to manage your workflows locally
- Run workflows w/ Cloud GPUs
- Backup your projects to the cloud
- Run ComfyUI Launcher in the cloud

## Credits
- ComfyUI Manager (https://github.com/ltdrdata/ComfyUI-Manager/)
  - Used to auto-detect & install custom nodes
