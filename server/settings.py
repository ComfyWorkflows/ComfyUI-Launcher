import os

os.makedirs(os.environ.get("PROJECTS_DIR", "./projects"), exist_ok=True)
PROJECTS_DIR = os.environ.get("PROJECTS_DIR", "./projects")

os.makedirs(os.environ.get("MODELS_DIR", "./models"), exist_ok=True)
MODELS_DIR = os.environ.get("MODELS_DIR", "./models")

os.makedirs(os.environ.get("TEMPLATES_DIR", "./templates"), exist_ok=True)
TEMPLATES_DIR = os.environ.get("TEMPLATES_DIR", "./templates")

os.makedirs(os.environ.get("CELERY_DIR", ".celery"), exist_ok=True)
os.makedirs(os.path.join(os.environ.get("CELERY_DIR", ".celery"), "results"), exist_ok=True)
os.makedirs(os.path.join(os.environ.get("CELERY_DIR", ".celery"), "broker"), exist_ok=True)

CELERY_RESULTS_DIR = os.path.join(os.environ.get("CELERY_DIR", ".celery"), "results")
CELERY_BROKER_DIR = os.path.join(os.environ.get("CELERY_DIR", ".celery"), "broker")

PROXY_MODE = os.environ.get("PROXY_MODE", "false").lower() == "true"
ALLOW_OVERRIDABLE_PORTS_PER_PROJECT = os.environ.get("ALLOW_OVERRIDABLE_PORTS_PER_PROJECT", "true").lower() == "true"
PROJECT_MIN_PORT = int(os.environ.get("PROJECT_MIN_PORT", "4001"))
PROJECT_MAX_PORT = int(os.environ.get("PROJECT_MAX_PORT", "4100"))
SERVER_PORT = int(os.environ.get("SERVER_PORT", "4000"))