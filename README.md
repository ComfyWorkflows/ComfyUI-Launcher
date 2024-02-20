# ComfyUI Launcher (BETA)
The easiest way to run & use ComfyUI

Need help? Join our Discord!

[![](https://dcbadge.vercel.app/api/server/kXS43yTRNA)](https://discord.gg/kXS43yTRNA)

<p float="middle">
  <img src="./assets/launcher_projects.png" width="100%" />
  <img src="./assets/launcher_new_workflow.png" width="50%" />
  <img src="./assets/launcher_import_workflow.png" width="50%" />
  <img src="./assets/launcher_comfyui.png" width="100%" />
</p>

## Features
- Run any workflow with **ZERO setup**
- Automatically installs custom nodes, downloads model files, etc.
- Workflows exported by this tool can be run by anyone using this tool with **ZERO setup**
- Create & manage multiple ComfyUI workflows
- Each workflow runs in its own isolated environment
- Prevents your workflows from suddenly breaking when updating custom nodes, ComfyUI, etc.

## Coming soon
- Run workflows w/ Cloud GPUs
- Backup your projects to the cloud
- Run ComfyUI Launcher in the cloud

## Requirements
- Docker
- Python 3

## Installation
```
git clone https://github.com/ComfyWorkflows/comfyui-launcher
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Starting ComfyUI Launcher
```
cd server/ && python server.py
```
Open http://localhost:3000

## Updating ComfyUI Launcher
```
git pull
source venv/bin/activate
pip install -r requirements.txt
docker pull thecooltechguy/comfyui_launcher_web
```

## Credits
- ComfyUI Manager (https://github.com/ltdrdata/ComfyUI-Manager/)
