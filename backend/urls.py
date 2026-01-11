"""Proxy URLConf module.

This allows ROOT_URLCONF to be `backend.urls` while keeping the real URLConf in
`backend.backend.urls`.
"""

from backend.backend.urls import *  # noqa: F403,F401
