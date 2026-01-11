"""Proxy WSGI module for deployment platforms.

Some platforms (including Render) commonly reference `backend.wsgi:application`.
Our actual Django project package lives in `backend.backend`.
"""

from backend.backend.wsgi import application  # noqa: F401
