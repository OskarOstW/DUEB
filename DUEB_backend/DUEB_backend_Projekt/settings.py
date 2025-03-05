# settings.py - Hauptkonfigurationsdatei für das DÜB-Backend-Projekt
#
# Diese Datei enthält alle Konfigurationseinstellungen für das Django-Projekt zur Digitale Übungsbeobachtung (DÜB).
# Sie definiert unter anderem Datenbank-Verbindungen, installierte Apps, Middleware, Sicherheitseinstellungen,
# REST-Framework-Konfiguration und E-Mail-Versand-Einstellungen.

import os
from pathlib import Path
from decouple import config

# ------------------------------------------------
# 1) BASIS-EINSTELLUNGEN
# ------------------------------------------------
# Projektverzeichnis: Absoluter Pfad zum Basisverzeichnis des Projekts
BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------
# 2) SICHERHEITSEINSTELLUNGEN
# ------------------------------------------------
# Geheimer Schlüssel für kryptografische Signaturen aus .env-Datei geladen
SECRET_KEY = config('SECRET_KEY')

# Debug-Modus aus .env-Datei geladen (standardmäßig False für Produktionsumgebungen)
DEBUG = config('DEBUG', default=False, cast=bool)

# Liste erlaubter Hostnames aus .env-Datei geladen
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

# CORS (Cross-Origin Resource Sharing) Einstellungen für API-Anfragen
CORS_ALLOW_ALL_ORIGINS = True

# Vertrauenswürdige Ursprünge für Cross-Site-Request-Forgery-Schutz
# Notwendig für Dienste wie ngrok, die HTTPS-Tunneling bereitstellen
CSRF_TRUSTED_ORIGINS = [
    'https://*.ngrok-free.app',
]

# ------------------------------------------------
# 3) INSTALLIERTE ANWENDUNGEN
# ------------------------------------------------
# Liste aller Django-Apps, die im Projekt verwendet werden
INSTALLED_APPS = [
    # Django-Standardapps
    'django.contrib.admin',           # Django-Admin-Interface
    'django.contrib.auth',            # Authentifizierungssystem
    'django.contrib.contenttypes',    # Inhaltstypen-Framework
    'django.contrib.sessions',        # Sitzungsverwaltung
    'django.contrib.messages',        # Messaging-Framework
    'django.contrib.staticfiles',     # Verwaltung statischer Dateien
    
    # Projekt-spezifische Apps
    'DUEBapp',                         # Hauptanwendung der Digitale Übungsbeobachtung
    
    # Externe Bibliotheken und Erweiterungen
    'import_export',                  # Für Import/Export von Daten (z.B. Excel)
    'rest_framework',                 # REST-API-Framework
    'rest_framework.authtoken',       # Token-basierte Authentifizierung für REST-API
    'corsheaders',                    # CORS-Unterstützung für API-Anfragen
]

# ------------------------------------------------
# 4) MIDDLEWARE-KONFIGURATION
# ------------------------------------------------
# Liste der Middleware-Klassen, die Anfragen vor/nach der View-Verarbeitung bearbeiten
# Die Reihenfolge ist wichtig, besonders für die CORS-Middleware!
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',       # Sicherheitsverbesserungen
    'django.contrib.sessions.middleware.SessionMiddleware', # Sitzungsverwaltung
    'corsheaders.middleware.CorsMiddleware',               # CORS-Handling vor CommonMiddleware
    'django.middleware.common.CommonMiddleware',           # Gemeinsame Anfragenverarbeitung
    'django.middleware.csrf.CsrfViewMiddleware',           # CSRF-Schutz
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Auth-Handling
    'django.contrib.messages.middleware.MessageMiddleware',    # Flash-Messages
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # Clickjacking-Schutz
]

# ------------------------------------------------
# 5) URL- UND TEMPLATE-KONFIGURATION
# ------------------------------------------------
# Konfiguration der Basis-URL für das Projekt
ROOT_URLCONF = 'DUEB_backend_Projekt.urls'

# Template-Engine-Konfiguration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'DUEBapp', 'templates')],  # Füge diesen Pfad explizit hinzu
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI-Anwendungspfad für Server-Deployment
WSGI_APPLICATION = 'DUEB_backend_Projekt.wsgi.application'

# ------------------------------------------------
# 6) DATENBANK-KONFIGURATION
# ------------------------------------------------
# SQLite-Datenbank für Entwicklung. Für Produktion könnte hier z.B. PostgreSQL stehen
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ------------------------------------------------
# 7) AUTHENTIFIZIERUNG UND VALIDIERUNG
# ------------------------------------------------
# Passwort-Validatoren zur Durchsetzung von Passwort-Komplexität
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# ------------------------------------------------
# 8) INTERNATIONALISIERUNG UND ZEITZONEN
# ------------------------------------------------
# Sprach- und Zeitzoneneinstellungen
LANGUAGE_CODE = 'en-us'      # Sprachcode (Alternative: 'de')
TIME_ZONE = 'UTC'            # Zeitzone (Alternative: 'Europe/Berlin')
USE_I18N = True              # Internationalisierung aktivieren
USE_TZ = True                # Zeitzonen-Support aktivieren

# ------------------------------------------------
# 9) DATEISYSTEM-KONFIGURATION
# ------------------------------------------------
# Konfiguration für statische Dateien (CSS, JavaScript, Bilder)
STATIC_URL = 'static/'

# Standard-Feldtyp für Primärschlüssel in Modellen
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Konfiguration für vom Benutzer hochgeladene Mediendateien
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Maximale Anzahl von Formularfeldern (wichtig für große Formulare)
DATA_UPLOAD_MAX_NUMBER_FIELDS = 4000

# ------------------------------------------------
# 10) REST FRAMEWORK-KONFIGURATION
# ------------------------------------------------
# Einstellungen für das Django REST Framework
REST_FRAMEWORK = {
    # Standardmäßig Token-Authentifizierung für API-Anfragen
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    # Standardmäßig nur authentifizierte Nutzer haben Zugriff
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ------------------------------------------------
# 11) E-MAIL-KONFIGURATION
# ------------------------------------------------
# Konfiguration des E-Mail-Versands über Gmail SMTP
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')
EMAIL_SUBJECT_PREFIX = '[DÜB Projekt] '