from utils import create_comfyui_project, get_launcher_json_for_workflow_json, run_command_in_project_comfyui_venv
import os, json

if __name__ == "__main__":
    models_path = "./models"
    # project_path = "./test_projects/proj1"
    # if not os.path.exists(project_path):
    #     create_comfyui_project(project_path, models_path, id="proj1", name="proj1")
    # run_command_in_project_comfyui_venv(project_path, f"python main.py --port 4000")

    # project_path = "./test_projects/proj2"
    # if not os.path.exists(project_path):
    #     with open("./comfyui-launcher (7).json", "r") as f:
    #         launcher_json = json.load(f)
    #     create_comfyui_project(project_path, models_path, id="proj2", name="proj2", launcher_json=launcher_json)
    # run_command_in_project_comfyui_venv(project_path, f"python main.py --port 4000")

    workflow_json_path = "./subby_ramesh_ultra_upscale_comfyworkflows.json"
    with open(workflow_json_path, "r") as f:
        workflow_json = json.load(f)
    launcher_json = get_launcher_json_for_workflow_json(workflow_json)
    with open("./subby_ramesh_ultra_upscale_comfyui-launcher.json", "w") as f:
        json.dump(launcher_json, f, indent=4)