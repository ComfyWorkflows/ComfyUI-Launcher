import json
import os
import shutil
import socket
import requests
import hashlib
import unicodedata
import re
import subprocess
import threading
from tqdm import tqdm
from urllib.parse import urlparse
from settings import PROJECT_MAX_PORT, PROJECT_MIN_PORT, PROJECTS_DIR

def check_url_structure(url):
    # Check for huggingface.co URL structure
    huggingface_pattern = r'^https://huggingface\.co/[\w-]+/[\w-]+/blob/[\w-]+\.(safetensors|bin|ckpt)$'
    if re.match(huggingface_pattern, url):
        return True
    
    # Check for civitai.com URL structure
    civitai_pattern = r'^https://civitai\.com/models/\d+$'
    if re.match(civitai_pattern, url):
        return True
    
    return False

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


def print_process_output(process):
    for line in iter(process.stdout.readline, b''):
        print(line.decode(), end='')
    process.stdout.close()

def run_command(cmd: List[str], cwd: Optional[str] = None, bg: bool = False) -> None:
    process = subprocess.Popen(" ".join(cmd), cwd=cwd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    
    if bg:
        # Create a separate thread to handle the printing of the process's output
        threading.Thread(target=print_process_output, args=(process,), daemon=True).start()
        return process.pid
    else:
        print_process_output(process)
        assert process.wait() == 0

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
    if os.name == "nt":  # Check if running on Windows
        venv_activate = os.path.join(project_folder_path, "venv", "Scripts", "activate.bat")
    else:
        venv_activate = os.path.join(project_folder_path, "venv", "bin", "activate")
    
    assert os.path.exists(venv_activate), f"Virtualenv does not exist in project folder: {project_folder_path}"
    
    if os.name == "nt":
        command = ["call", venv_activate, "&&", command]
    else:
        command = [".", venv_activate, "&&", command]
    
    # Run the command using subprocess and capture stdout
    run_command(command)

def run_command_in_project_comfyui_venv(project_folder_path, command, in_bg=False):
    venv_activate = os.path.join(project_folder_path, "venv", "Scripts", "activate.bat") if os.name == "nt" else os.path.join(project_folder_path, "venv", "bin", "activate")
    comfyui_dir = os.path.join(project_folder_path, "comfyui")
    
    assert os.path.exists(venv_activate), f"Virtualenv does not exist in project folder: {project_folder_path}"

    if os.name == "nt":
        return run_command([venv_activate, "&&", "cd", comfyui_dir, "&&", command], bg=in_bg)
    else:
        return run_command([".", venv_activate, "&&", "cd", comfyui_dir, "&&", command], bg=in_bg)


def install_default_custom_nodes(project_folder_path, launcher_json=None):
    # install default custom nodes
    # comfyui-manager
    run_command(["git", "clone", f"https://github.com/ltdrdata/ComfyUI-Manager", os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-Manager')])

    # pip install comfyui-manager
    run_command_in_project_venv(
        project_folder_path,
        f"pip install -r {os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-Manager', 'requirements.txt')}",
    )

    run_command(["git", "clone", f"https://github.com/thecooltechguy/ComfyUI-ComfyWorkflows", os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-ComfyWorkflows')])

    # pip install comfyui-comfyworkflows
    run_command_in_project_venv(
        project_folder_path,
        f"pip install -r {os.path.join(project_folder_path, 'comfyui', 'custom_nodes', 'ComfyUI-ComfyWorkflows', 'requirements.txt')}",
    )

def setup_initial_models_folder(models_folder_path):
    assert not os.path.exists(
        models_folder_path
    ), f"Models folder already exists: {models_folder_path}"
    
    tmp_dir = os.path.join(os.path.dirname(models_folder_path), "tmp_comfyui")
    run_command(["git", "clone", COMFYUI_REPO_URL, tmp_dir])

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
        
        # Clone the custom node repository
        run_command(["git", "clone", custom_node_repo_url, custom_node_path, "--recursive"])

        if custom_node_hash:
            # Checkout the specific hash
            run_command(["git", "checkout", custom_node_hash], cwd=custom_node_path)

        pip_requirements_path = os.path.join(custom_node_path, "requirements.txt")
        if os.path.exists(pip_requirements_path):
            run_command_in_project_venv(
                project_folder_path,
                f"pip install -r {os.path.join(custom_node_path, 'requirements.txt')}",
            )

        pip_requirements_post_path = os.path.join(custom_node_path, "requirements_post.txt")
        if os.path.exists(pip_requirements_post_path):
            run_command_in_project_venv(
                project_folder_path,
                f"pip install -r {os.path.join(custom_node_path, 'requirements_post.txt')}",
            )

        install_script_path = os.path.join(custom_node_path, "install.py")
        if os.path.exists(install_script_path):
            run_command_in_project_venv(project_folder_path, f"python {install_script_path}")

        # for ComfyUI-CLIPSeg, we need to separately copy the clipseg.py file from ComfyUI-CLIPSeg/custom_nodes into `project_folder_path/comfyui/custom_nodes
        if custom_node_name == "ComfyUI-CLIPSeg":
            clipseg_custom_node_file_path = os.path.join(custom_node_path, "custom_nodes", "clipseg.py")
            shutil.copy(clipseg_custom_node_file_path, os.path.join(project_folder_path, "comfyui", "custom_nodes", "clipseg.py"))

def compute_sha256_checksum(file_path):
    buf_size = 1024
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while True:
            data = f.read(buf_size)
            if not data:
                break
            sha256.update(data)
    return sha256.hexdigest().lower()

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
        # try each source for the file until one works
        for file_info in file_infos:
            if downloaded_file:
                break
            cw_file_download_url = file_info["download_url"]
            dest_relative_path = file_info["dest_relative_path"]
            sha256_checksum = file_info["sha256_checksum"].lower()

            if not cw_file_download_url:
                print(f"WARNING: Could not find download URL for: {dest_relative_path}")
                missing_download_files.add(dest_relative_path)
                continue

            dest_path = os.path.join(project_folder_path, "comfyui", dest_relative_path)
            if os.path.exists(dest_path):
                if compute_sha256_checksum(dest_path) != sha256_checksum:
                    old_dest_filename = os.path.basename(dest_path)
                    new_dest_path = generate_incrementing_filename(dest_path)
                    print(f"WARNING: File '{dest_relative_path}' already exists and has a different checksum, so renaming new file to: {new_dest_path}")
                    dest_path = new_dest_path
                    new_dest_filename = os.path.basename(new_dest_path)
                    # we auto-rename the file in the launcher json to match the new filename, so that the user doesn't have to manually update the launcher/workflow json
                    # TODO: Later, we need to update this to only replace the filename within its specific node type (since multiple nodes can refer to a common filename, but they would be different files)
                    rename_file_in_launcher_json(launcher_json, old_dest_filename, new_dest_filename)
                else:
                    print(f"File already exists: {dest_path}, so skipping download.")
                    downloaded_file = True
                    break

            os.makedirs(os.path.dirname(dest_path), exist_ok=True)

            num_attempts = 0
            download_successful = False

            print(f"Downloading file for: {dest_path}")

            if "/comfyui-launcher/" in cw_file_download_url:
                response = requests.get(cw_file_download_url)
                response.raise_for_status()
                response_json = response.json()
                download_urls = response_json["urls"]
            else:
                download_urls = [cw_file_download_url,]

            for download_url in download_urls:
                if download_successful:
                    break
                num_attempts = 0
                while num_attempts < MAX_DOWNLOAD_ATTEMPTS:
                    try:
                        headers = {}

                        # parse the url to get the host using 
                        hostname = urlparse(download_url).hostname
                        if hostname == "civitai.com":
                            headers["Authorization"] = f"Bearer {config['credentials']['civitai']['apikey']}"
                        
                        with requests.get(
                            download_url, headers=headers, allow_redirects=True, stream=True
                        ) as response:
                            total_size = int(response.headers.get("content-length", 0))
                            with tqdm(total=total_size, unit="B", unit_scale=True) as pb:
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
                        import traceback
                        traceback.print_exc()
                        if os.path.exists(dest_path):
                            os.remove(dest_path)
                    num_attempts += 1

            if not download_successful:
                print(f"WARNING: Failed to download file for: {dest_relative_path}")
                missing_download_files.add(dest_relative_path)
                continue

            downloaded_file = True
            break

        if not downloaded_file:
            print(f"WARNING: Failed to download file: {dest_relative_path}")
            missing_download_files.add(dest_relative_path)
        else:
            print(f"SUCCESS: Downloaded: {dest_relative_path}")
    return missing_download_files


def get_launcher_json_for_workflow_json(workflow_json, resolved_missing_models, skip_model_validation):
    response = requests.post(
        f"{CW_ENDPOINT}/api/comfyui-launcher/setup_workflow_json?skipModelValidation={skip_model_validation}",
        json={"workflow": workflow_json, "isWindows": os.name == "nt", "resolved_missing_models": resolved_missing_models},
    )
    assert (
        response.status_code == 200 or response.status_code == 400
    ), f"Failed to get launcher json for workflow json: {workflow_json}"
    return response.json()

def generate_incrementing_filename(filepath):
    filename, file_extension = os.path.splitext(filepath)
    counter = 1
    while os.path.exists(filepath):
        filepath = f"{filename} ({counter}){file_extension}"
        counter += 1
    return filepath

def rename_file_in_workflow_json(workflow_json, old_filename, new_filename):
    workflow_json_str = json.dumps(workflow_json)
    workflow_json_str = workflow_json_str.replace(old_filename, new_filename)
    return json.loads(workflow_json_str)

def rename_file_in_launcher_json(launcher_json, old_filename, new_filename):
    workflow_json = launcher_json["workflow_json"]
    workflow_json_str = json.dumps(workflow_json)
    workflow_json_str = workflow_json_str.replace(old_filename, new_filename)
    workflow_json = json.loads(workflow_json_str)
    launcher_json["workflow_json"] = workflow_json


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

def install_pip_reqs(project_folder_path, pip_reqs):
    if not pip_reqs:
        return
    print("Installing pip requirements...")
    with open(os.path.join(project_folder_path, "requirements.txt"), "w") as f:
        for req in pip_reqs:
            if isinstance(req, str):
                f.write(req + "\n")
            elif isinstance(req, dict):
                f.write(f"{req['_key']}=={req['_version']}\n")
    run_command_in_project_venv(
        project_folder_path,
        f"pip install -r {os.path.join(project_folder_path, 'requirements.txt')}",
    )

def get_project_port(id):
    project_path = os.path.join(PROJECTS_DIR, id)
    if os.path.exists(os.path.join(project_path, "port.txt")):
        with open(os.path.join(project_path, "port.txt"), "r") as f:
            return int(f.read().strip())
    return find_free_port(PROJECT_MIN_PORT, PROJECT_MAX_PORT)

def is_port_in_use(port: int) -> bool:
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0
    
def find_free_port(start_port, end_port):
    for port in range(start_port, end_port + 1):
        with socket.socket() as s:
            try:
                s.bind(('', port))
                return port
            except OSError:
                pass  # Port is already in use, try the next one
    return None  # No free port found in the range

def create_symlink(source, target):
    if os.name == 'nt':  # Check if running on Windows
        run_command(['mklink', '/D', target, source])
    else:
        os.symlink(source, target, target_is_directory=True)

def create_virtualenv(venv_path):
    run_command(['python', '-m', 'venv', venv_path])