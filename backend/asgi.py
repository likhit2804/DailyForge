"""Proxy ASGI module for deployment platforms.

Some platforms reference `backend.asgi:application`.
Our actual Django project package lives in `backend.backend`.
"""

from backend.backend.asgi import application  # noqa: F401
