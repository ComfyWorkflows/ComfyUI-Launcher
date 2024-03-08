# ComfyUI Launcher (BETA)
Run any ComfyUI workflow w/ **ZERO setup**.

Need help? Join our Discord!

[![](https://dcbadge.vercel.app/api/server/kXS43yTRNA)](https://discord.gg/kXS43yTRNA)

## Features
- Automatically installs custom nodes, missing model files, etc.
- Workflows exported by this tool can be run by anyone with **ZERO setup**
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

#### Windows (Windows Subsystem for Linux - WSL) & Linux:
- Docker (w/ GPU support) or Python 3

#### macOS:
- Python 3

## Quick start

Note: these instructions will involve mounting files from your local clone of this repo branch (new-docker-setup) ONLY until we test this branch and push the new docker image definition for `thecooltechguy/comfyui_launcher`. After we do this, you won't have to clone anything for the docker option.

### Option 1: Docker (recommended)

Only works for **Linux** & **Windows (WSL)**. For **macOS**, use Option 2.

```
#clone the new branch so that the image uses the new code
git clone https://github.com/ComfyWorkflows/comfyui-launcher launcher-new-docker-setup #or change this second arg to whatever name you want
cd comfyui-launcher/
git checkout new-docker-setup
cd ../ #go back out to run docker command below

#run the container (mounting files from the repo branch you cloned above)
docker run \
--gpus all \
--rm \
--name comfyui_launcher \
-p 4000-4100:4000-4100 \
-v $(pwd)/comfyui_launcher_models:/app/server/models \
-v $(pwd)/comfyui_launcher_projects:/app/server/projects \
-v $(pwd)/launcher/server/utils.py:/app/server/utils.py \
-v $(pwd)/launcher/server/server.py:/app/server/server.py \
-it thecooltechguy/comfyui_launcher 
```

Open http://localhost:4000 in your browser

### Option 2: Manual setup
Works for **Windows (WSL)**, **Linux**, & **macOS**

#### Installation (one-time setup)
```
git clone https://github.com/ComfyWorkflows/comfyui-launcher
cd comfyui-launcher/
git checkout new-docker-setup
chmod +x run.sh
```

#### Start ComfyUI Launcher
```
./run.sh
```
Open http://localhost:4000 in your browser


## Updating
### Option 1: Docker
```
docker pull thecooltechguy/comfyui_launcher
```

### Option 2: Manual setup
```
git pull
```

## Coming soon
- Better handling of missing model files
- Native Windows support (w/o requiring WSL)
- Better way to manage your workflows locally
- Run workflows w/ Cloud GPUs
- Backup your projects to the cloud
- Run ComfyUI Launcher in the cloud

## Credits
- ComfyUI Manager (https://github.com/ltdrdata/ComfyUI-Manager/)
  - Used to auto-detect & install custom nodes
