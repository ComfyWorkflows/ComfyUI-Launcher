### PSEUDOCODE

# takes in an argument: the endpoint of the launcher server

# num_total_tests = len(files)
# passed_tests = []
# failed_tests = []

# for each input json file in both /templates directory and /test_workflows directory (recursive search, json files might be in sub-folders)
# load the contents of the json file into memory

# for each json object in memory, replace image filepaths with our testing image filepath
# do the same for videeo filepaths in the json file

# fetch to /import_project name=<uuid> import_json=<json>
# returns an id

# fetch to /projects/<id>/start
# returns a port

# use selenium navigate to http://localhost:<port>
# wait 15s for the page to load
# click on Queue prompt button
# wait 5s
# stop selenium

# get request to http://localhost:<port>/queue
# find the client_id and the prompt_id for the prompt we just created in the resopnse above (via selenium)

"""
ws = websocket.WebSocket()
ws.connect("ws://{}/ws?clientId={}".format("localhost:<port>", client_id))

is_success = False
while True:
    out = ws.recv()
    if isinstance(out, str):
        message = json.loads(out)
        if message['type'] == 'executing':
            data = message['data']
            if data['node'] is None and data['prompt_id'] == prompt_id:
                is_success = True
                break #Execution is done
        elif message['type'] == 'execution_error':
            is_success = False
            break
    else:
        continue #previews are binary data
        
if is_success
    passed_tests.append(json_file)
else:
    failed_tests.append(json_file)
ws.close()
make POST request to /projects/<id>/delete
"""

# at the end, print out the number of tests that passed and the number of tests that failed

### SCRIPT
import os
import json
import requests
import sys
import websocket
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import uuid

def load_json_files(directory):
    print(f"load_json_files 1. loading json files for dir: {directory}")
    json_files = []
    for root, _, files in os.walk(directory):
        print(f"load_json_files 2. FILEs in dir: {files}")
        for file in files:
            print(f"load_json_files 3. FILE in dir: {files}")
            if file.endswith('.json'):
                print(f"load_json_files 3. FILE ends w/ json, opening.")
                with open(os.path.join(root, file), 'r') as f:
                    json_data = json.load(f)
                    json_files.append((os.path.join(root, file), json_data))
    return json_files

# def replace_filepaths(json_obj):
#     for node in json_obj["nodes"]:
#         for input_obj in node.get("inputs", []):
#             if input_obj["type"] == "IMAGE" or input_obj["type"] == "VIDEO":
#                 for widget_value in node.get("widgets_values", []):
#                     if isinstance(widget_value, dict) and "params" in widget_value:
#                         if widget_value["params"].get("type") == "output":
#                             if widget_value["params"]["format"] == "image/gif":
#                                 widget_value["params"]["filename"] = "./example.gif"
#                             elif widget_value["params"]["format"] == "image/png":
#                                 widget_value["params"]["filename"] = "./example.png"
#                             elif widget_value["params"]["format"] == "image/jpeg":
#                                 widget_value["params"]["filename"] = "./example.jpeg"
#                             elif widget_value["params"]["format"] == "video/mp4":
#                                 widget_value["params"]["filename"] = "./example.mp4"
#     return json_obj

def replace_filepaths(json_obj):
    print(f"replace_filepaths 1. replacing for json_obj.")
    for node in json_obj["nodes"]:
        print(f"replace_filepaths 2. replacing for node: {node}")
        if node["type"] == "VHS_LoadVideo":
            print(f"replace_filepaths 3a. node is of type VHS_LoadVideo")
            if "widgets_values" in node and "video" in node["widgets_values"]:
                print(f"replace_filepaths 4. widgets_values is in node and video is in widgets_values")
                node["widgets_values"]["video"] = "./server/example.mp4"
        elif node["type"] == "LoadImage":
            print(f"replace_filepaths 3b. node is of type LoadImage")
            if "widgets_values" in node and len(node["widgets_values"]) > 0:
                print(f"replace_filepaths 4. widgets_values is in node and the len of widgets_values is > 0")
                node["widgets_values"][0] = "./server/example.png"
    return json_obj


def run_tests(server_url):
    print(f"run_tests 1. entered fn w/ server_url: {server_url}")
    passed_tests = []
    failed_tests = []

    templates_dir = './server/templates'
    test_workflows_dir = './server/test-workflows'

    # templates_json = load_json_files(templates_dir)
    test_workflows_json = load_json_files(test_workflows_dir)
    # print(f"run_tests 2. templates_json length: {len(templates_json)}.")
    print(f"run_tests 2. test_workflows_json length: {len(test_workflows_json)}.")

    # all_json = templates_json + testworkflows_json

    for file_path, json_obj in test_workflows_json: #all_json
        NAME = str(uuid.uuid4())
        print(f"run_tests 3. entered for loop for file_path: {file_path} and generated name: {NAME}")
        replaced_json_obj = replace_filepaths(json_obj)
        print(f"run_tests 3WW. successfylly replaced filepaths fr.")
        
        ## Fetch to /import_project
        # response = requests.post(f"{server_url}/import_project", json=json_obj)
        import_project_payload = {
            "name": NAME,
            "import_json": replaced_json_obj #json_obj
        }
        import_project_headers = {
            "Content-Type": "application/json"
        }

        response = requests.request("POST", f"{server_url}/api/import_project", json=import_project_payload, headers=import_project_headers)
        project_id = response.json()['id']
        print(f"run_tests 4. got response from /import_project: {response}. and got project_id: {project_id}")
        
        # Fetch to /projects/<id>/start
        response = requests.post(f"{server_url}/api/projects/{project_id}/start")
        port = response.json()['port']
        print(f"run_tests 5. got response from /projects/{project_id}/start: {response}. and got port: {port}")
        
        # Use selenium
        # driver = webdriver.Chrome()
        # driver.get(f"http://localhost:{port}")
        # WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, 'queue-button')))
        # driver.find_element_by_id('queue-button').click()
        # time.sleep(5)
        # driver.quit()

        # Use selenium
        driver = webdriver.Chrome()
        print(f"run_tests SELENIUM 1. driver instantiated!")

        driver.get(f"http://localhost:{port}")
        print(f"run_tests SELENIUM 2. driver got to http://localhost:{port}")

        # Wait for the document to be in a ready state
        WebDriverWait(driver, 15).until(lambda driver: driver.execute_script('return document.readyState') == 'complete')
        print(f"run_tests SELENIUM 3. driver got to http://localhost:{port} and is in ready state.")

        # Switch to the iframe
        iframe = driver.find_element(By.TAG_NAME, 'iframe')
        driver.switch_to.frame(iframe)
        print("run_tests SELENIUM 4. Switched to iframe.")

        # Wait for the presence of the 'queue-button' element inside the iframe
        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.ID, 'queue-button')))
        print(f"run_tests SELENIUM 5. driver found queue-button element inside the iframe.")

        # Click on the 'queue-button' element inside the iframe
        driver.find_element(By.ID, 'queue-button').click()
        print(f"run_tests SELENIUM 6. driver clicked queue-button element inside the iframe.")

        time.sleep(5)
        driver.quit()
        print(f"run_tests SELENIUM 7 (quit selenium driver).")
        
        # Get request to http://localhost:<port>/queue
        response = requests.get(f"http://localhost:{port}/queue")
        print(f"run_tests 6. made request to comfyui queue got response from http://localhost:{port}/queue: {response}.")
        queue_data = response.json()
        print(f"run_tests 7. queue_data from http://localhost:{port}/queue: {queue_data}.")
        client_id = queue_data.get("queue_running", {})[3].get("client_id")
        print(f"run_tests 8. client_id from http://localhost:{port}/queue: {client_id}.")
        prompt_id = queue_data.get("queue_running", {})[1]
        print(f"run_tests 9. prompt_id from http://localhost:{port}/queue: {prompt_id}.")
        
        if not client_id or not prompt_id:
            print(f"run_tests F. either prompt_id ({prompt_id}) or client_id({client_id}) is null!")
            failed_tests.append(file_path)
            continue
        
        # WebSocket connection
        ws = websocket.WebSocket()
        ws.connect(f"ws://localhost:{port}/ws?clientId={client_id}")
        print(f"run_tests 11. connected websocket: {ws}")

        is_success = False
        while True:
            print(f"run_tests 12. ws while loop, entered websocket while loop!")
            out = ws.recv()
            print(f"run_tests 13. ws while loop, got out value: {out}")
            if isinstance(out, str):
                message = json.loads(out)
                print(f"run_tests 14. ws while loop, got message value: {message}")
                if message['type'] == 'executing':
                    print(f"run_tests 15. ws while loop, in the if block for when msg is executing fr.")
                    data = message['data']
                    print(f"run_tests 16. ws while loop, in the if block for when msg is executing fr. got data: {data}")
                    if data['node'] is None and data['prompt_id'] == prompt_id:
                        print(f"run_tests 16. ws while loop, in the if block for when msg is executing fr. setting is_success to true since node is null and prompt id is equal to prompt id!")
                        is_success = True
                        break
                elif message['type'] == 'execution_error':
                    print(f"run_tests 17. ws while loop, in the if block for when msg got EXEC ERROR fr.")
                    is_success = False
                    break
            else:
                continue

        if is_success:
            print(f"run_tests 18. pushing to is_success: {is_success}")
            passed_tests.append(file_path)
        else:
            print(f"run_tests 19. pushing to failed_tests: {failed_tests}")
            failed_tests.append(file_path)
        ws.close()
        
        # Make POST request to /projects/<id>/delete
        requests.post(f"{server_url}/api/projects/{project_id}/delete")
        print(f"run_tests 20. deleted proj!")

    return passed_tests, failed_tests

def main():
    if len(sys.argv) != 2:
        print("Usage: python tests.py <server_url>")
        sys.exit(1)

    server_url = sys.argv[1]

    passed, failed = run_tests(server_url)

    print(f"Number of tests passed: {len(passed)}")
    print(f"Number of tests failed: {len(failed)}")
    print("Failed tests:")
    for fail in failed:
        print(fail)

if __name__ == "__main__":
    main()
