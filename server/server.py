import json
import shutil
import signal
import subprocess
import time
from flask import Flask, jsonify, request, render_template
from showinfm import show_in_file_manager
from settings import PROJECTS_DIR, MODELS_DIR, TEMPLATES_DIR
import os, psutil, sys
from utils import (
    CONFIG_FILEPATH,
    DEFAULT_CONFIG,
    create_comfyui_project,
    find_free_port,
    get_config,
    get_launcher_json_for_workflow_json,
    get_launcher_state,
    is_launcher_json_format,
    is_port_in_use,
    run_command,
    run_command_in_project_comfyui_venv,
    set_config,
    set_launcher_state_data,
    slugify,
    update_config,
)

app = Flask(
    __name__, static_url_path="", static_folder="../web/dist", template_folder="../web/dist"
)


@app.route("/api/open_models_folder")
def open_models_folder():
    show_in_file_manager(MODELS_DIR)
    return ""


@app.route("/api/projects", methods=["GET"])
def list_projects():
    projects = []
    for proj_folder in os.listdir(PROJECTS_DIR):
        full_proj_path = os.path.join(PROJECTS_DIR, proj_folder)
        launcher_state, _ = get_launcher_state(full_proj_path)
        if not launcher_state:
            continue
        projects.append(
            {
                "id": proj_folder,
                "state": launcher_state,
                "project_folder_name": proj_folder,
                "project_folder_path": full_proj_path,
                "last_modified": os.stat(full_proj_path).st_mtime,
            }
        )

    # order by last_modified (descending)
    projects.sort(key=lambda x: x["last_modified"], reverse=True)
    return jsonify(projects)


@app.route("/api/projects/<id>", methods=["GET"])
def get_project(id):
    project_path = os.path.join(PROJECTS_DIR, id)
    assert os.path.exists(project_path), f"Project with id {id} does not exist"
    launcher_state, _ = get_launcher_state(project_path)
    return jsonify(
        {
            "id": id,
            "state": launcher_state,
            "project_folder_name": id,
            "project_folder_path": project_path,
            "last_modified": os.stat(project_path).st_mtime,
        }
    )


@app.route("/api/get_config", methods=["GET"])
def api_get_config():
    config = get_config()
    return jsonify(config)


@app.route("/api/update_config", methods=["POST"])
def api_update_config():
    request_data = request.get_json()
    update_config(request_data)
    return jsonify({"success": True})


@app.route("/api/set_config", methods=["POST"])
def api_set_config():
    request_data = request.get_json()
    set_config(request_data)
    return jsonify({"success": True})


@app.route("/api/create_project", methods=["POST"])
def create_project():
    request_data = request.get_json()
    name = request_data["name"]
    template_id = request_data.get("template_id", "empty")

    # set id to a folder friendly name of the project name (lowercase, no spaces, etc.)
    id = slugify(name)

    project_path = os.path.join(PROJECTS_DIR, id)
    assert not os.path.exists(project_path), f"Project with id {id} already exists"

    models_path = MODELS_DIR

    launcher_json = None
    template_folder = os.path.join(TEMPLATES_DIR, template_id)
    template_launcher_json_fp = os.path.join(template_folder, "launcher.json")
    if os.path.exists(template_launcher_json_fp):
        with open(template_launcher_json_fp, "r") as f:
            launcher_json = json.load(f)
    else:
        template_workflow_json_fp = os.path.join(template_folder, "workflow.json")
        if os.path.exists(template_workflow_json_fp):
            with open(template_workflow_json_fp, "r") as f:
                template_workflow_json = json.load(f)
            launcher_json = get_launcher_json_for_workflow_json(template_workflow_json)
    create_comfyui_project(
        project_path, models_path, id=id, name=name, launcher_json=launcher_json
    )
    return jsonify({"success": True, "id": id})


@app.route("/api/import_project", methods=["POST"])
def import_project():
    MISSING_MODELS = [
        {
            "id": "1",
            "file_name": "ip_adapter_image_encoder_pytorch_model.bin",
            "backup_models": [
                {
                "id": "1",
                "file_name": "ip_adapter_v4.safetensors",
                "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                "type": "hf"
                },
                {
                    "id": "2",
                    "file_name": "ip_adapter_still.safetensors",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                },
                {
                    "id": "3",
                    "file_name": "ip_adapter_goofy.safetensors",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                },
                {
                    "id": "4",
                    "file_name": "image_encoder_adapter.safetensors",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                }
            ],
            "resolved": False,
            "new_file_name": ""
        },
        {
            "id": "2",
            "file_name": "nooshpere_4.7.safetensors",
            "backup_models": [
                {
                    "id": "1",
                    "file_name": "nooshpere_animations.safetensors",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                },
                {
                    "id": "2",
                    "file_name": "noosphere_direct.safetensors",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                },
                {
                    "id": "3",
                    "file_name": "noosphere_v_1_5.ckpt",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                }
            ],
            "resolved": False,
            "new_file_name": ""
        },
        {
            "id": "3",
            "file_name": "3Dmeinamix_meinaV11.safetensors'",
            "backup_models": [
                {
                    "id": "1",
                    "file_name": "meinamix.safetensors",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                },
                {
                    "id": "2",
                    "file_name": "meinav11.safetensors",
                    "link": "https://huggingface.co/h94/IP-Adapter-FaceID",
                    "type": "hf"
                }
            ],
            "resolved": False,
            "new_file_name": ""
        }
    ]
    time.sleep(5)
    # request_data = request.get_json()
    # name = request_data["name"]
    # import_json = request_data["import_json"]

    # # set id to a folder friendly name of the project name (lowercase, no spaces, etc.)
    # id = slugify(name)

    # project_path = os.path.join(PROJECTS_DIR, id)
    # assert not os.path.exists(project_path), f"Project with id {id} already exists"

    # models_path = MODELS_DIR

    # if is_launcher_json_format(import_json):
    #     print("Detected launcher json format")
    #     launcher_json = import_json
    # else:
    #     print("Detected workflow json format, converting to launcher json format")
    #     launcher_json = get_launcher_json_for_workflow_json(import_json)
    # create_comfyui_project(
    #     project_path, models_path, id=id, name=name, launcher_json=launcher_json
    # )
    # if there were some models that could not be found, 
    # return success = false and an array of FailedModel objects (defined in web types)
    # return jsonify({"success": True, "id": id}) 
    return jsonify({"success": False, "missing_models": MISSING_MODELS })


@app.route("/api/projects/<id>/start", methods=["POST"])
def start_project(id):
    project_path = os.path.join(PROJECTS_DIR, id)
    assert os.path.exists(project_path), f"Project with id {id} does not exist"

    launcher_state, _ = get_launcher_state(project_path)
    assert launcher_state

    assert launcher_state["state"] == "ready", f"Project with id {id} is not ready yet"

    # find a free port
    port = find_free_port()
    assert port, "No free port found"
    assert not is_port_in_use(port), f"Port {port} is already in use"

    # # start the project
    # pid = run_command_in_project_comfyui_venv(
    #     project_path, f"python main.py --port {port}", in_bg=True
    # )
    # assert pid, "Failed to start the project"

    # start the project
    command = f"python main.py --port {port}"
    if os.name == "nt":
        command = f"start \"\" cmd /c \"{command}\""

    pid = run_command_in_project_comfyui_venv(
        project_path, command, in_bg=True
    )
    assert pid, "Failed to start the project"

    # wait until the port is bound
    max_wait_secs = 60
    while max_wait_secs > 0:
        max_wait_secs -= 1
        if is_port_in_use(port):
            break
        time.sleep(1)

    set_launcher_state_data(
        project_path, {"state": "running", "port": port, "pid": pid}
    )
    return jsonify({"success": True, "port": port})


@app.route("/api/projects/<id>/stop", methods=["POST"])
def stop_project(id):
    project_path = os.path.join(PROJECTS_DIR, id)
    assert os.path.exists(project_path), f"Project with id {id} does not exist"

    launcher_state, _ = get_launcher_state(project_path)
    assert launcher_state

    assert launcher_state["state"] == "running", f"Project with id {id} is not running"

    # kill the process with the pid
    try:
        pid = launcher_state["pid"]
        parent_pid = pid
        parent = psutil.Process(parent_pid)
        for child in parent.children(recursive=True):
            child.terminate()
        parent.terminate()
    except:
        pass

    set_launcher_state_data(project_path, {"state": "ready", "port": None, "pid": None})
    return jsonify({"success": True})


@app.route("/api/projects/<id>/delete", methods=["POST"])
def delete_project(id):
    project_path = os.path.join(PROJECTS_DIR, id)
    assert os.path.exists(project_path), f"Project with id {id} does not exist"

    # stop the project if it's running
    launcher_state, _ = get_launcher_state(project_path)
    if launcher_state and launcher_state["state"] == "running":
        stop_project(id)

    # delete the project folder and its contents
    shutil.rmtree(project_path, ignore_errors=True)
    return jsonify({"success": True})


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
@app.errorhandler(404)
def index(path):
    return render_template("index.html")

if __name__ == "__main__":
    print("Starting ComfyUI Launcher...")
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    os.makedirs(MODELS_DIR, exist_ok=True)
    if not os.path.exists(CONFIG_FILEPATH):
        set_config(DEFAULT_CONFIG)
    print("Open http://localhost:4000 in your browser.")
    app.run(host="0.0.0.0", debug=False, port=4000)