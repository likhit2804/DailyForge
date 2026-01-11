"""Proxy settings module.

This allows using `DJANGO_SETTINGS_MODULE=backend.settings` while keeping the
real settings in `backend.backend.settings`.
"""

from backend.backend.settings import *  # noqa: F403,F401
