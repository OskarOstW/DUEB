# Digitale Übungsbeobachtung (DÜB)

## Projektbeschreibung

Die DÜB-Anwendung (Digitale Übungsbeobachtung) ist ein umfassendes Tool zur digitalen Dokumentation und Auswertung von Übungsszenarien im medizinischen Bereich. Die Anwendung ermöglicht eine strukturierte Erfassung von Patientendaten, Behandlungsverläufen und Beobachtungen während Übungen oder Simulationen im Gesundheitswesen.

## Hauptfunktionen

- **Rollenbasierte Benutzeroberfläche**: Separate Funktionen für Administratoren und Beobachter
- **Dynamische Formularverwaltung**: Erstellung, Bearbeitung und Nutzung anpassbarer Beobachtungsformulare
- **Patientenprofile**: Detaillierte Verwaltung von Patientenprofilen mit medizinischen Daten
- **Szenario-Management**: Organisation von Übungsszenarien mit Zuweisung von Patientenprofilen
- **Offline-Funktionalität**: Fortgesetzte Arbeit auch ohne Internetverbindung
- **Automatisierte Berichterstattung**: Generierung und E-Mail-Versand von Excel-Berichten
- **Beobachtungsdokumentation**: Erfassung von Zeitstempeln, Notizen und Bildmaterial

## Technologiestack

### Frontend (DUEB_frontend)
- **Framework**: React Native mit Expo
- **Navigation**: React Navigation 7.x
- **Datenspeicherung**: AsyncStorage für Offline-Funktionalität
- **UI-Komponenten**: React Native Paper, Vector Icons, Linear Gradient
- **Formulare**: Formik mit Yup-Validierung

### Backend (DUEB_backend)
- **Framework**: Django 4.x mit Django REST Framework
- **Datenbank**: SQLite (Entwicklung)
- **Authentifizierung**: Token-basierte API-Authentifizierung
- **Dateiverarbeitung**: Excel-Import/Export mit openpyxl und xlsxwriter
- **E-Mail-Versand**: SMTP-Integration für Berichtzustellung

## Installation und Einrichtung

### Voraussetzungen
- Python 3.8 oder höher
- Node.js 16.x oder höher
- Expo CLI (`npm install -g expo-cli`)
- Git

### Backend-Installation
1. Klonen Sie das Repository: `git clone https://github.com/OskarOstW/DUEB.git`
2. Wechseln Sie in das Backend-Verzeichnis: `cd DUEB/DUEB_backend`
3. Erstellen Sie eine virtuelle Umgebung: `python -m venv venv`
4. Aktivieren Sie die virtuelle Umgebung:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
5. Installieren Sie die Abhängigkeiten:
6. Erstellen Sie eine `.env` Datei mit folgenden Variablen:
   ```
   SECRET_KEY=ihre_geheime_schlüssel
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   EMAIL_HOST_USER=ihre_email@example.com
   EMAIL_HOST_PASSWORD=ihr_email_passwort
   DEFAULT_FROM_EMAIL=dueb@example.com
   ```
7. Führen Sie die Migrationen aus: `python manage.py migrate`
8. Erstellen Sie einen Superuser: `python manage.py createsuperuser`
9. Starten Sie den Entwicklungsserver: `python manage.py runserver`

### Frontend-Installation
1. Wechseln Sie in das Frontend-Verzeichnis: `cd DUEB/DUEB_frontend`
2. Installieren Sie die Abhängigkeiten: `npm install`
3. Erstellen Sie eine `.env` Datei mit:
   ```
   API_URL=http://localhost:8000
   ```
4. Starten Sie die Expo-Entwicklungsumgebung: `npx expo start`

## Projektstruktur (Auszug)

```
DUEB/
│
├── DUEB_backend/               # Django Backend
│   ├── DUEB_backend_Projekt/   # Django Projekteinstellungen
│   ├── DUEBapp/                # Hauptanwendung
│   │   ├── migrations/         # Datenbankmigrationen
│   │   ├── models.py           # Datenmodelle
│   │   ├── serializers.py      # API Serialisierer
│   │   ├── views.py            # API Endpunkte
│   │   ├── admin.py            # Admin-Interface
│   │   ├── admin_excelupload.py # Excel-Import Funktionalität
│   │   └── email_and_excel*.py # Berichtgenerierung und E-Mail-Versand
│   ├── media/                  # Hochgeladene Dateien
│   ├── manage.py               # Django Management-Skript
│   └── ...
│
├── DUEB_frontend/              # React Native Frontend
│   ├── assets/                 # Statische Ressourcen
│   ├── components/             # Wiederverwendbare UI-Komponenten
│   ├── screens/                # App-Bildschirme
│   │   ├── LoginScreen/        # Anmeldung und Authentifizierung
│   │   ├── HomeScreen/         # Hauptmenü und Dashboard
│   │   ├── FormEditorScreen/   # Formularerstellung und -bearbeitung
│   │   ├── DynamicFormScreen/  # Dynamische Formularansicht
│   │   └── VictimProfileDetailScreen/ # Patientenprofildetails
│   ├── App.js                  # Hauptanwendungsdatei
│   └── ...
│
└── README.md                   # Projektdokumentation
```

## Hauptkomponenten und Funktionalität

### Benutzerrollen
- **Admin**: Vollzugriff auf alle Funktionen, inklusive Formularerstellung und Gerätevorbereitung
- **Observer**: Eingeschränkter Zugriff auf zugewiesene Formulare und Patientenprofile

### Offline-Modus
Die Anwendung unterstützt vollständiges Offline-Arbeiten:
- Automatisches Caching aller Formulare und Patientenprofile
- Lokale Speicherung aller Eingaben
- Synchronisierung mit dem Server bei Wiederherstellung der Verbindung

### Excel-Import/Export
- **Import**: Massenimport von Patientenprofilen über Excel-Dateien im Admin-Bereich
- **Export**: Automatische Generierung und E-Mail-Versand von Beobachtungsberichten

### Gerätevorbereitung
Administratoren können Geräte für Übungen vorbereiten, indem sie:
- Alle notwendigen Daten für den Offline-Betrieb herunterladen
- Profile und Formulare für Beobachter konfigurieren
- Übungsszenarien definieren

## Nutzung

1. **Admin-Bereich**: Zugriff auf `http://localhost:8000/admin` für Backend-Verwaltung
2. **Mobil-App**: Nutzung über Expo auf Emulator oder physischem Gerät
3. **Formularerstellung**: Anlegen angepasster Beobachtungsformulare im Admin-Modus
4. **Profilsuche**: Schneller Zugriff auf Patientenprofile über Button-Nummern oder Suchbegriffe
5. **Berichterstellung**: Automatische Generierung und Versand von Excel-Berichten über Patientenbegleitbögen

## Entwicklungshinweise

- Die Anwendung unterstützt sowohl Android als auch iOS
- Bei Netzwerkproblemen schaltet die App automatisch in den Offline-Modus
- Für Produktionsumgebungen empfiehlt sich eine robustere Datenbank (PostgreSQL)
- Der E-Mail-Versand erfordert gültige SMTP-Anmeldedaten

## Mitwirkende
- Oskar Wiesatzki - Hauptentwickler

## Lizenz
siehe LICENSE
