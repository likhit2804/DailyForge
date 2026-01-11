import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Ensure backend apps (e.g. `accounts`) are importable.
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(1, str(PROJECT_ROOT))

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "backend.settings"
)

application = get_wsgi_application()
