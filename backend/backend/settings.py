import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key")

DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = ["dailyforge-bbhx.onrender.com", "localhost", "127.0.0.1"]

INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "accounts.apps.AccountsConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR.parent / "dist",  # Look for templates in dist folder
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"

# Database configuration
# Connected to Render PostgreSQL instance
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "dailyforge_lc0r",
        "USER": "dailyforge_lc0r_user",
        "PASSWORD": "NLV1T9bZNEFEl5f87Z5a6a1hWEro6LWV",
        "HOST": "dpg-d5h3pbvpm1nc73brb9n0-a.oregon-postgres.render.com",
        "PORT": "5432",
        "OPTIONS": {
            "sslmode": "require",  # 🔴 REQUIRED on Render
        },
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

STATIC_URL = "/static/"

# Static files configuration for production
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR.parent / "dist",  # Serve built React app
]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS (allow frontend dev server during development)
# Allow the Vite dev server on port 5173 and 5174 (fallback)
CORS_ALLOWED_ORIGINS = [
    "https://dailyforge-bbhx.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
]
CORS_ALLOW_CREDENTIALS = True

# Trust the frontend origin for CSRF checks (include scheme)
CSRF_TRUSTED_ORIGINS = [
   "https://dailyforge-bbhx.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
]

# Session cookie settings for cross-origin requests
SESSION_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SAMESITE = "None"
# For local dev, cookies work on localhost; in prod you'd set SECURE=True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SESSION_EXPIRE_AT_BROWSER_CLOSE = True


# Allow the CSRF header commonly used by fetch
from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    "X-CSRFToken",
]
