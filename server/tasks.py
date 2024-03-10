import json
import os
import shutil
from celery import shared_task
from utils import COMFYUI_REPO_URL, create_symlink, create_virtualenv, install_default_custom_nodes, install_pip_reqs, normalize_model_filepaths_in_workflow_json, run_command, run_command_in_project_venv, set_default_workflow_from_launcher_json, set_launcher_state_data, setup_custom_nodes_from_snapshot, setup_files_from_launcher_json, setup_initial_models_folder

@shared_task(ignore_result=False)
def create_comfyui_project(
    project_folder_path, models_folder_path, id, name, launcher_json=None, port=None, create_project_folder=True
):
    project_folder_path = os.path.abspath(project_folder_path)
    models_folder_path = os.path.abspath(models_folder_path)

    try:
        if create_project_folder:
            assert not os.path.exists(project_folder_path), f"Project folder already exists at {project_folder_path}"
            os.makedirs(project_folder_path)
        else:
            assert os.path.exists(project_folder_path), f"Project folder does not exist at {project_folder_path}"

        set_launcher_state_data(
            project_folder_path,
            {"id":id,"name":name, "status_message": "Downloading ComfyUI...", "state": "download_comfyui"},
        )
        # Modify the subprocess.run calls to capture and log the stdout
        run_command(
            ["git", "clone", COMFYUI_REPO_URL, os.path.join(project_folder_path, 'comfyui')],
        )

        if launcher_json:
            comfyui_commit_hash = launcher_json["snapshot_json"]["comfyui"]
            if comfyui_commit_hash:
                run_command(
                    ["git", "checkout", comfyui_commit_hash],
                    cwd=os.path.join(project_folder_path, 'comfyui'),
                )
            launcher_json['workflow_json'] = normalize_model_filepaths_in_workflow_json(launcher_json['workflow_json'])

        
        # move the comfyui/web/index.html file to comfyui/web/comfyui_index.html
        os.rename(
            os.path.join(project_folder_path, "comfyui", "web", "index.html"),
            os.path.join(project_folder_path, "comfyui", "web", "comfyui_index.html"),
        )

        # copy the web/comfy_frame.html file to comfyui/web/index.html
        shutil.copy(
            os.path.join("web", "comfy_frame.html"),
            os.path.join(project_folder_path, "comfyui", "web", "index.html"),
        )

        # remove the models folder that exists in comfyui and symlink the shared_models folder as models
        if os.path.exists(os.path.join(project_folder_path, "comfyui", "models")):
            shutil.rmtree(
                os.path.join(project_folder_path, "comfyui", "models"), ignore_errors=True
            )

        if not os.path.exists(models_folder_path):
            setup_initial_models_folder(models_folder_path)

        # create a folder in project folder/comfyui/models that is a symlink to the models folder
        create_symlink(models_folder_path, os.path.join(project_folder_path, "comfyui", "models"))

        set_launcher_state_data(
            project_folder_path,
            {"status_message": "Installing ComfyUI...", "state": "install_comfyui"},
        )

        # create a new virtualenv in project folder/venv
        create_virtualenv(os.path.join(project_folder_path, 'venv'))

        # activate the virtualenv + install comfyui requirements
        run_command_in_project_venv(
            project_folder_path,
            f"pip install -r {os.path.join(project_folder_path, 'comfyui', 'requirements.txt')}",
        )

        set_launcher_state_data(
            project_folder_path,
            {
                "status_message": "Installing custom nodes...",
                "state": "install_custom_nodes",
            },
        )

        # install default custom nodes
        install_default_custom_nodes(project_folder_path, launcher_json)

        setup_custom_nodes_from_snapshot(project_folder_path, launcher_json)

        # install pip requirements
        if launcher_json and "pip_requirements" in launcher_json:
            install_pip_reqs(project_folder_path, launcher_json["pip_requirements"])

        # download all necessary files
        set_launcher_state_data(
            project_folder_path,
            {
                "status_message": "Downloading models & other files...",
                "state": "download_files",
            },
        )

        setup_files_from_launcher_json(project_folder_path, launcher_json)
        set_default_workflow_from_launcher_json(project_folder_path, launcher_json)

        if launcher_json:
            with open(os.path.join(project_folder_path, "launcher.json"), "w") as f:
                json.dump(launcher_json, f)

        if port is not None:
            with open(os.path.join(project_folder_path, "port.txt"), "w") as f:
                f.write(str(port))

        set_launcher_state_data(
            project_folder_path, {"status_message": "Ready", "state": "ready"}
        )
    except:
        # remove the project folder if an error occurs
        shutil.rmtree(project_folder_path, ignore_errors=True)
        raise