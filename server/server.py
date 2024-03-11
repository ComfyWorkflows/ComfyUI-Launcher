import json
import shutil
import signal
import subprocess
import time
import torch
from flask import Flask, jsonify, request, render_template
from showinfm import show_in_file_manager
from settings import ALLOW_OVERRIDABLE_PORTS_PER_PROJECT, CELERY_BROKER_DIR, CELERY_RESULTS_DIR, PROJECT_MAX_PORT, PROJECT_MIN_PORT, PROJECTS_DIR, MODELS_DIR, PROXY_MODE, SERVER_PORT, TEMPLATES_DIR
import requests
import os, psutil, sys
from utils import (
    CONFIG_FILEPATH,
    DEFAULT_CONFIG,
    get_config,
    get_launcher_json_for_workflow_json,
    get_launcher_state,
    get_project_port,
    is_launcher_json_format,
    is_port_in_use,
    run_command,
    run_command_in_project_comfyui_venv,
    set_config,
    set_launcher_state_data,
    slugify,
    update_config,
    check_url_structure
)
from celery import Celery, Task
from tasks import create_comfyui_project

def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app

CW_ENDPOINT = os.environ.get("CW_ENDPOINT", "https://comfyworkflows.com")

app = Flask(
    __name__, static_url_path="", static_folder="../web/dist", template_folder="../web/dist"
)
app.config.from_mapping(
    CELERY=dict(
        result_backend=f"file://{CELERY_RESULTS_DIR}",
        broker_url=f"filesystem://",
        broker_transport_options={
            'data_folder_in': CELERY_BROKER_DIR,
            'data_folder_out': CELERY_BROKER_DIR,
        }
    ),
    task_ignore_result=True,
)
celery_app = celery_init_app(app)

@app.route("/api/open_models_folder")
def open_models_folder():
    # TODO: Switch to using a web ui to render the models folder
    show_in_file_manager(MODELS_DIR)
    return ""

@app.route("/api/settings")
def api_settings():
    return jsonify({
        "PROJECT_MIN_PORT": PROJECT_MIN_PORT,
        "PROJECT_MAX_PORT": PROJECT_MAX_PORT,
        "ALLOW_OVERRIDABLE_PORTS_PER_PROJECT": ALLOW_OVERRIDABLE_PORTS_PER_PROJECT,
        "PROXY_MODE": PROXY_MODE
    })

@app.route("/api/projects", methods=["GET"])
def list_projects():
    projects = []
    for proj_folder in os.listdir(PROJECTS_DIR):
        full_proj_path = os.path.join(PROJECTS_DIR, proj_folder)
        if not os.path.isdir(full_proj_path):
            continue
        launcher_state, _ = get_launcher_state(full_proj_path)
        if not launcher_state:
            continue
        project_port = get_project_port(proj_folder)
        projects.append(
            {
                "id": proj_folder,
                "state": launcher_state,
                "project_folder_name": proj_folder,
                "project_folder_path": full_proj_path,
                "last_modified": os.stat(full_proj_path).st_mtime,
                "port" : project_port
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
    project_port = get_project_port(id)
    return jsonify(
        {
            "id": id,
            "state": launcher_state,
            "project_folder_name": id,
            "project_folder_path": project_path,
            "last_modified": os.stat(project_path).st_mtime,
            "port" : project_port
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
    port = request_data.get("port")

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
            res = get_launcher_json_for_workflow_json(template_workflow_json, resolved_missing_models=[], skip_model_validation=True)
            if (res["success"] and res["launcher_json"]):
                launcher_json = res["launcher_json"]
            else:
                return jsonify({ "success": False, "missing_models": [], "error": res["error"] })
    
    print(f"Creating project with id {id} and name {name} from template {template_id}")

    # set the project's first status message
    assert not os.path.exists(
        project_path
    ), f"Project folder already exists: {project_path}"
    os.makedirs(project_path)
    set_launcher_state_data(
        project_path,
        {"id":id,"name":name, "status_message": "Downloading ComfyUI...", "state": "download_comfyui"},
    )

    result = create_comfyui_project.delay(
        project_path, models_path, id=id, name=name, launcher_json=launcher_json, port=port, create_project_folder=False
    )

    with open(os.path.join(project_path, "setup_task_id.txt"), "w") as f:
        f.write(result.id)
    
    return jsonify({"success": True, "id": id})


@app.route("/api/import_project", methods=["POST"])
def import_project():
    request_data = request.get_json()
    name = request_data["name"]
    import_json = request_data["import_json"]
    resolved_missing_models = request_data["resolved_missing_models"]
    skipping_model_validation = request_data["skipping_model_validation"]
    port = request_data.get("port")
    # skipping_model_validation = request_data.get("skipping_model_validation")

    # set id to a folder friendly name of the project name (lowercase, no spaces, etc.)
    id = slugify(name)

    project_path = os.path.join(PROJECTS_DIR, id)
    assert not os.path.exists(project_path), f"Project with id {id} already exists"

    models_path = MODELS_DIR

    if is_launcher_json_format(import_json):
        print("Detected launcher json format")
        launcher_json = import_json
    else:
        print("Detected workflow json format, converting to launcher json format")
        #only resolve missing models for workflows w/ workflow json format
        skip_model_validation = True if skipping_model_validation else False
        if len(resolved_missing_models) > 0:
            for model in resolved_missing_models:
                if (model["filename"] is None or model["node_type"] is None or model["dest_relative_path"] is None):
                    return jsonify({ "success": False, "error": f"one of the resolved models has an empty filename, node type, or destination path. please try again." })
                elif (model["source"]["url"] is not None and model["source"]["file_id"] is None):
                    is_valid = check_url_structure(model["source"]["url"])
                    if (is_valid is False):
                        return jsonify({ "success": False, "error": f"the url f{model['source']['url']} is invalid. please make sure it is a link to a model file on huggingface or a civitai model." })
                elif (model["source"]["file_id"] is None and model["source"]["url"] is None):
                    return jsonify({ "success": False, "error": f"you didn't select one of the suggestions (or import a url) for the following missing file: {model['filename']}" })
            skip_model_validation = True

        res = get_launcher_json_for_workflow_json(import_json, resolved_missing_models, skip_model_validation)
        if (res["success"] and res["launcher_json"]):
            launcher_json = res["launcher_json"]
        elif (res["success"] is False and res["error"] == "MISSING_MODELS" and len(res["missing_models"]) > 0):
            return jsonify({ "success": False, "missing_models": res["missing_models"], "error": res["error"] })
        else:
            print(f"something went wrong when fetching res from get_launcher_json_for_workflow_json: {res}")
            return jsonify({ "success": False, "error": res["error"] })
        
    print(f"Creating project with id {id} and name {name} from imported json")
    
    # set the project's first status message
    assert not os.path.exists(
        project_path
    ), f"Project folder already exists: {project_path}"
    os.makedirs(project_path)
    set_launcher_state_data(
        project_path,
        {"id":id,"name":name, "status_message": "Downloading ComfyUI...", "state": "download_comfyui"},
    )

    result = create_comfyui_project.delay(
        project_path, models_path, id=id, name=name, launcher_json=launcher_json, port=port, create_project_folder=False
    )

    with open(os.path.join(project_path, "setup_task_id.txt"), "w") as f:
        f.write(result.id)
    
    return jsonify({"success": True, "id": id}) 


@app.route("/api/projects/<id>/start", methods=["POST"])
def start_project(id):
    project_path = os.path.join(PROJECTS_DIR, id)
    assert os.path.exists(project_path), f"Project with id {id} does not exist"

    launcher_state, _ = get_launcher_state(project_path)
    assert launcher_state

    assert launcher_state["state"] == "ready", f"Project with id {id} is not ready yet"

    # find a free port
    port = get_project_port(id)
    assert port, "No free port found"
    assert not is_port_in_use(port), f"Port {port} is already in use"

    # # start the project
    # pid = run_command_in_project_comfyui_venv(
    #     project_path, f"python main.py --port {port}", in_bg=True
    # )
    # assert pid, "Failed to start the project"

    # start the project
    command = f"python main.py --port {port} --listen 0.0.0.0"

    # check if gpus are available, if they aren't, use the cpu
    mps_available = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
    if not torch.cuda.is_available() and not mps_available:
        print("WARNING: No GPU/MPS detected, so launching ComfyUI with CPU...")
        command += " --cpu"

    if os.name == "nt":
        command = f"start \"\" cmd /c \"{command}\""
    
    print(f"USING COMMAND: {command}. PORT: {port}")

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
        project_path, {"state": "running", "status_message" : "Running...", "port": port, "pid": pid}
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

    set_launcher_state_data(project_path, {"state": "ready", "status_message" : "Ready", "port": None, "pid": None})
    return jsonify({"success": True})


@app.route("/api/projects/<id>/delete", methods=["POST"])
def delete_project(id):
    project_path = os.path.join(PROJECTS_DIR, id)
    assert os.path.exists(project_path), f"Project with id {id} does not exist"

    # stop the celery task if it's running
    setup_task_id_fp = os.path.join(project_path, "setup_task_id.txt")
    if os.path.exists(setup_task_id_fp):
        with open(setup_task_id_fp, "r") as f:
            setup_task_id = f.read()
            if setup_task_id:
                try:
                    celery_app.control.revoke(setup_task_id, terminate=True)
                except:
                    pass

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
    print(f"Open http://localhost:{SERVER_PORT} in your browser.")
    app.run(host="0.0.0.0", debug=False, port=SERVER_PORT)