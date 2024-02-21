import json
import os
import shutil
import socket
import requests
import hashlib
import unicodedata
import re
from tqdm import tqdm
from urllib.parse import urlparse

def slugify(value, allow_unicode=False):
    """
    Taken from https://github.com/django/django/blob/master/django/utils/text.py
    Convert to ASCII if 'allow_unicode' is False. Convert spaces or repeated
    dashes to single dashes. Remove characters that aren't alphanumerics,
    underscores, or hyphens. Convert to lowercase. Also strip leading and
    trailing whitespace, dashes, and underscores.
    """
    value = str(value)
    if allow_unicode:
        value = unicodedata.normalize('NFKC', value)
    else:
        value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value.lower())
    return re.sub(r'[-\s]+', '-', value).strip('-_')


COMFYUI_REPO_URL = "https://github.com/comfyanonymous/ComfyUI.git"

MAX_DOWNLOAD_ATTEMPTS = 3

CUSTOM_NODES_TO_IGNORE_FROM_SNAPSHOTS = ["ComfyUI-ComfyWorkflows", "ComfyUI-Manager"]

CW_ENDPOINT = os.environ.get("CW_ENDPOINT", "https://comfyworkflows.com")

CONFIG_FILEPATH = "./config.json"

DEFAULT_CONFIG = {"credentials": {"civitai": {"apikey": ""}}}

import os
from typing import List, Dict, Optional, Union
import json

class ModelFileWithNodeInfo:
    def __init__(self, filename: str, original_filepath: str, normalized_filepath: str):
        self.filename = filename
        self.original_filepath = original_filepath
        self.normalized_filepath = normalized_filepath

def convert_to_unix_path(path: str) -> str:
    return path.replace("\\\\", "/").replace("\\", "/")

def convert_to_windows_path(path: str) -> str:
    return path.replace("/", "\\")

def extract_model_file_names_with_node_info(json_data: Union[Dict, List], is_windows: bool = False) -> List[ModelFileWithNodeInfo]:
    file_names = []
    model_filename_extensions = {'.safetensors', '.ckpt', '.pt', '.pth', '.bin'}

    def recursive_search(data: Union[Dict, List, str], in_nodes: bool, node_type: Optional[str]):
        if isinstance(data, dict):
            for key, value in data.items():
                type_ = value.get('type') if isinstance(value, dict) else None
                recursive_search(value, key == 'nodes' if not in_nodes else in_nodes, type_ if in_nodes and not node_type else node_type)
        elif isinstance(data, list):
            for item in data:
                type_ = item.get('type') if isinstance(item, dict) else None
                recursive_search(item, in_nodes, type_ if in_nodes and not node_type else node_type)
        elif isinstance(data, str) and '.' in data:
            original_filepath = data
            normalized_filepath = convert_to_windows_path(original_filepath) if is_windows else convert_to_unix_path(original_filepath)
            filename = os.path.basename(data)

            if '.' + original_filepath.split('.')[-1] in model_filename_extensions:
                file_names.append(ModelFileWithNodeInfo(filename, original_filepath, normalized_filepath))

    recursive_search(json_data, False, None)
    return file_names

def get_ckpt_names_with_node_info(workflow_json: Union[Dict, List], is_windows: bool) -> List[ModelFileWithNodeInfo]:
    ckpt_names = []
    if isinstance(workflow_json, dict):
        ckpt_names = extract_model_file_names_with_node_info(workflow_json, is_windows)
    elif isinstance(workflow_json, list):
        for item in workflow_json:
            ckpt_names.extend(get_ckpt_names_with_node_info(item, is_windows))
    return ckpt_names

def normalize_model_filepaths_in_workflow_json(workflow_json: dict) -> dict:
    is_windows = os.name == "nt"
    ckpt_names = get_ckpt_names_with_node_info(workflow_json, is_windows)
    for ckpt_name in ckpt_names:
        workflow_json = json.dumps(workflow_json).replace(ckpt_name.original_filepath.replace("\\", "\\\\"), ckpt_name.normalized_filepath.replace("\\", "\\\\"))
        workflow_json = json.loads(workflow_json)
    return workflow_json

def run_command_in_project_venv(project_folder_path, command):
    assert os.path.exists(
        os.path.join(project_folder_path, "venv")
    ), f"Virtualenv does not exist in project folder: {project_folder_path}"
    assert (
        os.system(
            f". {os.path.join(project_folder_path, 'venv', 'bin', 'activate')} && {command}"
        )
        == 0
    )


def run_command_in_project_comfyui_venv(project_folder_path, command, in_bg=False):
    assert os.path.exists(
        os.path.join(project_folder_path, "venv")
    ), f"Virtualenv does not exist in project folder: {project_folder_path}"

    if not in_bg:
        assert (
            os.system(
                f". {os.path.join(project_folder_path, 'venv', 'bin', 'activate')} && cd {os.path.join(project_folder_path, 'comfyui')} && {command}"
            )
            == 0
        )
    else:
        # start a process in the background and return the process id
        import subprocess
        process = subprocess.Popen(
            f". {os.path.join(project_folder_path, 'venv', 'bin', 'activate')} && cd {os.path.join(project_folder_path, 'comfyui')} && {command}",
            shell=True,
        )
        return process.pid


def install_default_custom_nodes(project_folder_path, launcher_json=None):
    # install default custom nodes
    # comfyui-manager
    os.system(
        f"git clone https://github.com/ltdrdata/ComfyUI-Manager {os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-Manager')}"
    )
    # pip install comfyui-manager
    run_command_in_project_venv(
        project_folder_path,
        f"pip install -r {os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-Manager', 'requirements.txt')}",
    )
    os.system(f"git clone https://github.com/thecooltechguy/ComfyUI-ComfyWorkflows {os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-ComfyWorkflows')}")
    # for development
    # os.system(
    #     f"cp -r ./default_custom_nodes/ComfyUI-ComfyWorkflows {os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-ComfyWorkflows')}"
    # )
    # pip install comfyui-comfyworkflows
    run_command_in_project_venv(
        project_folder_path,
        f"pip install -r {os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-ComfyWorkflows', 'requirements.txt')}",
    )


def setup_initial_models_folder(models_folder_path):
    assert not os.path.exists(
        models_folder_path
    ), f"Models folder already exists: {models_folder_path}"
    # os.makedirs(models_folder_path)

    # clone just the models/ folder from the comfyui repo
    tmp_dir = os.path.join(os.path.dirname(models_folder_path), "tmp_comfyui")
    os.system(f"git clone {COMFYUI_REPO_URL} {tmp_dir}")
    shutil.move(os.path.join(tmp_dir, "models"), models_folder_path)
    shutil.rmtree(tmp_dir)


def is_launcher_json_format(import_json):
    if "format" in import_json and import_json["format"] == "comfyui_launcher":
        return True
    return False

def setup_custom_nodes_from_snapshot(project_folder_path, launcher_json):
    if not launcher_json:
        return
    for custom_node_repo_url, custom_node_repo_info in launcher_json["snapshot_json"][
        "git_custom_nodes"
    ].items():
        if any(
            [
                custom_node_to_ignore in custom_node_repo_url
                for custom_node_to_ignore in CUSTOM_NODES_TO_IGNORE_FROM_SNAPSHOTS
            ]
        ):
            continue

        custom_node_hash = custom_node_repo_info["hash"]
        custom_node_disabled = custom_node_repo_info["disabled"]
        if custom_node_disabled:
            continue
        custom_node_name = custom_node_repo_url.split("/")[-1].replace(".git", "")
        custom_node_path = os.path.join(
            project_folder_path, "comfyui", "custom_nodes", custom_node_name
        )
        os.system(f"git clone {custom_node_repo_url} {custom_node_path}")
        if custom_node_hash:
            os.system(f"cd {custom_node_path} && git checkout {custom_node_hash}")
        pip_requirements_path = os.path.join(custom_node_path, "requirements.txt")
        if os.path.exists(pip_requirements_path):
            run_command_in_project_venv(
                project_folder_path,
                f"pip install -r {os.path.join(custom_node_path, 'requirements.txt')}",
            )


def compute_sha256_checksum(file_path):
    buf_size = 1024
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while True:
            data = f.read(buf_size)
            if not data:
                break
            sha256.update(data)
    return sha256.hexdigest()

def get_config():
    with open(CONFIG_FILEPATH, "r") as f:
        return json.load(f)
    
def update_config(config_update):
    config = get_config()
    config.update(config_update)
    with open(CONFIG_FILEPATH, "w") as f:
        json.dump(config, f)
    return config

def set_config(config):
    with open(CONFIG_FILEPATH, "w") as f:
        json.dump(config, f)

def setup_files_from_launcher_json(project_folder_path, launcher_json):
    if not launcher_json:
        return

    missing_download_files = set()
    config = get_config()

    # download all necessary files
    for file_infos in launcher_json["files"]:
        downloaded_file = False
        for file_info in file_infos:
            if downloaded_file:
                break
            download_url = file_info["download_url"]
            dest_relative_path = file_info["dest_relative_path"]
            sha256_checksum = file_info["sha256_checksum"]

            if not download_url:
                print(f"WARNING: Could not find download URL for: {dest_relative_path}")
                missing_download_files.add(dest_relative_path)
                continue

            dest_path = os.path.join(project_folder_path, "comfyui", dest_relative_path)
            if os.path.exists(dest_path):
                assert (
                    compute_sha256_checksum(dest_path) == sha256_checksum
                ), f"File already exists at {dest_path} but has different checksum"
                downloaded_file = True
                break

            os.makedirs(os.path.dirname(dest_path), exist_ok=True)

            num_attempts = 0
            download_successful = False

            print(f"Downloading {download_url} to {dest_path}")

            while num_attempts < MAX_DOWNLOAD_ATTEMPTS:
                try:
                    response = requests.head(download_url, allow_redirects=False)
                    response.raise_for_status()

                    headers = {}

                    if 300 < response.status_code < 400:
                        url = response.headers.get('Location', url)
                        assert url, f"Failed to get redirect location for {download_url}"
                        # parse the url to get the host using 
                        hostname = urlparse(url).hostname
                        if hostname == "civitai.com":
                            headers["Authorization"] = f"Bearer {config['civitai_api_key']}"
                        download_url = url
                    
                    with requests.get(
                        download_url, headers=headers, allow_redirects=True, stream=True
                    ) as response:
                        total_size = int(response.headers.get("content-length", 0))
                        pb = tqdm(total=total_size, unit="B", unit_scale=True)
                        with open(dest_path, "wb") as f:
                            for chunk in response.iter_content(chunk_size=10 * 1024):
                                pb.update(len(chunk))
                                if chunk:
                                    f.write(chunk)

                    if compute_sha256_checksum(dest_path) == sha256_checksum:
                        download_successful = True
                        if dest_relative_path in missing_download_files:
                            missing_download_files.remove(dest_relative_path)
                        break
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                except Exception as e:
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                num_attempts += 1

            if not download_successful:
                # print(f"WARNING: Failed to download file: {download_url}")
                missing_download_files.add(dest_relative_path)
                continue

            downloaded_file = True
            break

        if not downloaded_file:
            print(f"WARNING: Failed to download file: {dest_relative_path}")
            missing_download_files.add(dest_relative_path)
        else:
            print(f"Downloaded {dest_relative_path}")
        # assert downloaded_file, f"Failed to download file: {dest_relative_path}"
    return missing_download_files


def get_launcher_json_for_workflow_json(workflow_json):
    response = requests.post(
        f"{CW_ENDPOINT}/api/comfyui-launcher/setup_workflow_json",
        json={"workflow": workflow_json, "isWindows": os.name == "nt"},
    )
    assert (
        response.status_code == 200
    ), f"Failed to get launcher json for workflow json: {workflow_json}"
    return response.json()


def set_default_workflow_from_launcher_json(project_folder_path, launcher_json):
    if not launcher_json:
        return
    workflow_json = launcher_json["workflow_json"]
    with open(
        os.path.join(
            project_folder_path, "comfyui", "web", "scripts", "defaultGraph.js"
        ),
        "w",
    ) as f:
        f.write(f"export const defaultGraph = {json.dumps(workflow_json, indent=2)};")

    with open(
        os.path.join(
            project_folder_path, "comfyui", "custom_nodes", "ComfyUI-ComfyWorkflows", "current_graph.json"
        ),
        "w",
    ) as f:
        json.dump(workflow_json, f)


def get_launcher_state(project_folder_path):
    state = {}
    launcher_folder_path = os.path.join(project_folder_path, ".launcher")
    os.makedirs(launcher_folder_path, exist_ok=True)

    state_path = os.path.join(launcher_folder_path, "state.json")

    if os.path.exists(state_path):
        with open(state_path, "r") as f:
            state = json.load(f)

    return state, state_path


def set_launcher_state_data(project_folder_path, data: dict):
    launcher_folder_path = os.path.join(project_folder_path, ".launcher")
    os.makedirs(launcher_folder_path, exist_ok=True)

    existing_state, existing_state_path = get_launcher_state(project_folder_path)
    existing_state.update(data)

    with open(existing_state_path, "w") as f:
        json.dump(existing_state, f)


def create_comfyui_project(
    project_folder_path, models_folder_path, id, name, launcher_json=None
):
    project_folder_path = os.path.abspath(project_folder_path)
    models_folder_path = os.path.abspath(models_folder_path)

    assert not os.path.exists(
        project_folder_path
    ), f"Project folder already exists: {project_folder_path}"
    os.makedirs(project_folder_path)

    set_launcher_state_data(
        project_folder_path,
        {"id":id,"name":name, "status_message": "Downloading ComfyUI...", "state": "download_comfyui"},
    )

    # git clone comfyui into project folder/comfyui
    os.system(
        f"git clone {COMFYUI_REPO_URL} {os.path.join(project_folder_path, 'comfyui')}"
    )
    if launcher_json:
        comfyui_commit_hash = launcher_json["snapshot_json"]["comfyui"]
        if comfyui_commit_hash:
            os.system(
                f"cd {os.path.join(project_folder_path, 'comfyui')} && git checkout {comfyui_commit_hash}"
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
    os.symlink(
        models_folder_path,
        os.path.join(project_folder_path, "comfyui", "models"),
        target_is_directory=True,
    )

    set_launcher_state_data(
        project_folder_path,
        {"status_message": "Installing ComfyUI...", "state": "install_comfyui"},
    )

    # create a new virtualenv in project folder/venv
    os.system(f"python -m venv {os.path.join(project_folder_path, 'venv')}")

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

    set_launcher_state_data(
        project_folder_path, {"status_message": "Ready", "state": "ready"}
    )

def is_port_in_use(port: int) -> bool:
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def find_free_port():
    with socket.socket() as s:
        s.bind(('', 0))            # Bind to a free port provided by the host.
        return s.getsockname()[1]  # Return the port number assigned.