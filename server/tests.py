# takes in an argument: the endpoint of the launcher server

# num_total_tests = len(files)
# passed_tests = []
# failed_tests = []

# for each input json file:
# load the contents of the json file into memory

# for each json object in memory, replace image filepaths with our testing image filepath
# do the same for videeo filepaths in the json file

# /import_project name=<uuid> import_json=<json>
# returns an id

# /projects/<id>/start
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