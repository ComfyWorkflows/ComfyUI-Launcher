# Running ComfyUI-Launcher on Runpod

Here's how you can easily run ComfyUI-Launcher on Runpod.

1. Create a new pod with this template: https://runpod.io/console/gpu-cloud?template=lr4wb7ypuy&ref=pc9tg9pr
2. If you want to save your data across pods, mount a Network volume at `/workspace`.
3. Pick a GPU & region, and Deploy the pod.

Once the pod is running, click the **Connect** button and click the first **Connect to HTTP Service [Port 4000]** button.

![](/assets/runpod_connect_button.png)
![](/assets/runpod_connect_dialog.png)

This will open a new tab with **ComfyUI-Launcher** running.

When creating/importing workflow projects, ensure that you set **static ports**, and ensure that the port range is between `4001-4009` (inclusive). This is required for ComfyUI-Launcher to work properly with Runpod.

![](/assets/create_project_dialog_static_ports.png)
![](/assets/import_project_dialog_static_ports.png)

# Managing model files & project files
Your models + project files will be saved under `/workspace/comfyui_launcher_models` and `/workspace/comfyui_launcher_projects`, respectively.
SSH into the Runpod instance to view & manage these folders.
