import os

os.makedirs(os.environ.get("PROJECTS_DIR", "./projects"), exist_ok=True)
PROJECTS_DIR = os.environ.get("PROJECTS_DIR", "./projects")

os.makedirs(os.environ.get("MODELS_DIR", "./models"), exist_ok=True)
MODELS_DIR = os.environ.get("MODELS_DIR", "./models")

os.makedirs(os.environ.get("TEMPLATES_DIR", "./templates"), exist_ok=True)
TEMPLATES_DIR = os.environ.get("TEMPLATES_DIR", "./templates")