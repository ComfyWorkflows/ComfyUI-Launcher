import os
import json
import requests
import sys
import websocket
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
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

def replace_filepaths(json_obj):
    script_dir = os.path.dirname(__file__)
    print(f"replace_filepaths 1. script_dir: {script_dir}")
    print(f"replace_filepaths 3. replacing for json_obj.")
    for node in json_obj["nodes"]:
        print(f"replace_filepaths 4. replacing for node: {node}")
        if node["type"] == "VHS_LoadVideo":
            print(f"replace_filepaths 5a. node is of type VHS_LoadVideo")
            if "widgets_values" in node and "video" in node["widgets_values"]:
                print(f"replace_filepaths 6. widgets_values is in node and video is in widgets_values. SETTING video to {os.path.join(script_dir, 'example.mp4')}")
                node["widgets_values"]["video"] = os.path.join(script_dir, "example.mp4")
        elif node["type"] == "LoadImage":
            print(f"replace_filepaths 5b. node is of type LoadImage")
            if "widgets_values" in node and len(node["widgets_values"]) > 0:
                print(f"replace_filepaths 6. widgets_values is in node and the len of widgets_values is > 0. SETTING image to {os.path.join(script_dir, 'example.png')}")
                node["widgets_values"][0] = os.path.join(script_dir, "example.png")
    return json_obj


def run_tests(server_url):
    print(f"run_tests 1. entered fn w/ server_url: {server_url}")
    passed_tests = []
    failed_tests = []

    templates_dir = './server/templates'
    test_workflows_dir = './server/test-workflows'
    test_default_dir = './server/test-default'

    # test_workflows_json = load_json_files(test_workflows_dir)
    # templates_json = load_json_files(templates_dir)
    test_default_json = load_json_files(test_default_dir)
    # print(f"run_tests 2b. test_workflows_json length: {len(test_workflows_json)}.")
    # print(f"run_tests 2a. templates_json length: {len(templates_json)}.")
    print(f"run_tests 2a. test_default_json length: {len(test_default_json)}.")

    # all_json = test_workflows_json + templates_json

    for file_path, json_obj in test_default_json: #all_json
        NAME = str(uuid.uuid4())
        print(f"🚀🚀🚀 run_tests 3. ENTERED for loop for file_path: {file_path} and generated name: {NAME}")
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
        # URL of the Selenium Grid hub
        # hub_url = "http://localhost:4444/wd/hub"

        # Set Chrome options

        # driver = webdriver.Chrome(options=chrome_options)
        # Initialize the WebDriver with remote connection to the Selenium Grid hub
        # driver = webdriver.Remote(command_executor=hub_url, options=chrome_options)
        

        chrome_options = Options()
        # chrome_options.add_argument('--headless')  # Run Chrome in headless mode
        chrome_options.add_argument("--no-sandbox") # linux only
        chrome_options.add_argument("--headless=new") # for Chrome >= 109
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--no-options.addArguments')
        driver = webdriver.Chrome(options=chrome_options)
        print(f"run_tests SELENIUM 1. driver instantiated!")

        driver.get(f"http://localhost:{port}")
        print(f"run_tests SELENIUM 2. driver got to http://localhost:{port}")

        # Wait for the document to be in a ready state
        WebDriverWait(driver, 15).until(lambda driver: driver.execute_script('return document.readyState') == 'complete')
        print(f"run_tests SELENIUM 3. driver got to http://localhost:{port} and is in ready state.")

        time.sleep(20)

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

        MAX_ATTEMPTS = 120
        attempts = 0
        client_id = None
        prompt_id = None
        while attempts <= MAX_ATTEMPTS and client_id is None and prompt_id is None:
            attempts += 1
            # Get request to http://localhost:<port>/queue
            response = requests.get(f"http://localhost:{port}/queue")
            print(f"run_tests 6. made request to comfyui queue got response from http://localhost:{port}/queue: {response}.")
            queue_data = response.json()
            print(f"run_tests 7. queue_data from http://localhost:{port}/queue: {queue_data}.")
            queue_running = queue_data.get("queue_running", [])
            print(f"run_tests 8. queue_running from http://localhost:{port}/queue: {queue_running}.")
            if queue_running:
                print(f"run_tests 9. queue_running is not empty!")
                prompt_id = queue_running[0][1]
                client_id = queue_running[0][3].get("client_id")
                break
            print(f"run_tests 10. got client_id from http://localhost:{port}/queue:: {client_id}")
            print(f"run_tests 11. got prompt_id from http://localhost:{port}/queue:: {prompt_id}")
            time.sleep(1)
        
        driver.quit()
        print(f"run_tests SELENIUM 7 (quit selenium driver).")

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
