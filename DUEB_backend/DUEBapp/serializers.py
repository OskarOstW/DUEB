# serializers.py - Serialisierungsschnittstelle für die DÜB-Anwendung
# 
# Diese Datei definiert Serializer für die Modelle der DÜB-Anwendung (Digitale Übungsbeobachtung).
# Serializer konvertieren komplexe Django-Modellobjekte in Python-Datentypen, die leicht
# in JSON umgewandelt werden können, und umgekehrt. Sie ermöglichen auch Validierung
# der eingehenden Daten für die API-Endpunkte.

from rest_framework import serializers
from .models import (
    Form, Question, Option, FormResponse,
    Contact, HomeScreenImage,
    VictimProfile, ExcelUpload,
    Organization, TestScenario, TestScenarioVictim,
    ObserverAccount, VictimProfileResponse
)

# ---------------------------------------------------
# 1) FRAGEN / OPTIONEN
# ---------------------------------------------------
class OptionSerializer(serializers.ModelSerializer):
    """
    Serializer für das Option-Modell.
    Stellt Antwortoptionen für Fragen dar (z.B. Checkbox-Optionen oder Dropdown-Einträge).
    """
    class Meta:
        model = Option
        fields = ['id', 'label']


class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer für das Question-Modell.
    Enthält alle Frageattribute und die zugehörigen Optionen in verschachtelter Form.
    """
    # Eingebettete Optionen als verschachtelte Serialisierung
    options = OptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id',
            'question_text',
            'option_type',          # Art der Frage (checkbox, dropdown, scale, etc.)
            'input_field_added',    # Ob ein zusätzliches Textfeld angezeigt wird
            'image_upload_desired', # Ob Bildupload möglich sein soll
            'options',              # Verschachtelte Optionen
            'description_question', # Zusätzliche Beschreibung
            'hint',                 # Hinweis aus dem KAP (Katastrophenschutzplan)
        ]

    def create(self, validated_data):
        """
        Überschriebene create-Methode für das Erstellen einer Frage mit Optionen.
        Extrahiert die Options-Daten, erstellt die Frage und dann die zugehörigen Optionen.
        """
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            Option.objects.create(question=question, **option_data)
        return question

# ---------------------------------------------------
# 2) FORM + FORMRESPONSE
# ---------------------------------------------------
class FormSerializer(serializers.ModelSerializer):
    """
    Serializer für das Form-Modell.
    Enthält alle Formularattribute und die zugehörigen Fragen in verschachtelter Form.
    """
    # Eingebettete Fragen als verschachtelte Serialisierung
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Form
        fields = ['id', 'name', 'note', 'description_form', 'show_patient_profile_search', 'questions']

    def create(self, validated_data):
        """
        Überschriebene create-Methode für das Erstellen eines Formulars mit Fragen und Optionen.
        Implementiert die verschachtelte Erstellung aller Objekte in der Hierarchie.
        """
        questions_data = validated_data.pop('questions')
        form = Form.objects.create(**validated_data)
        for question_data in questions_data:
            options_data = question_data.pop('options', [])
            question = Question.objects.create(form=form, **question_data)
            for option_data in options_data:
                Option.objects.create(question=question, **option_data)
        return form


class FormResponseSerializer(serializers.ModelSerializer):
    """
    Serializer für das FormResponse-Modell.
    Repräsentiert die vom Benutzer ausgefüllten Formulardaten.
    """
    class Meta:
        model = FormResponse
        fields = [
            'id',
            'form',
            'observer_name',      # Name des Beobachters
            'observer_email',     # E-Mail des Beobachters
            'responses',          # JSON-Feld mit allen Antworten
            'picker_selections',  # JSON-Feld mit Dropdown-Auswahlen
            'scale_values',       # JSON-Feld mit Skala-Werten
            'timestamps',         # JSON-Feld mit Zeitstempeln
            'note',               # Allgemeine Notiz
            'note_timestamps',    # Zeitstempel zur Notiz
            'submitted_at'        # Zeitpunkt der Einreichung
        ]


class FormResponseImageSerializer(serializers.ModelSerializer):
    """
    Spezieller Serializer für die Bildfelder des FormResponse-Modells.
    Wird für das separate Hochladen von Bildern zu einer bestehenden Formularantwort verwendet.
    """
    class Meta:
        model = FormResponse
        fields = [
            'image_1',
            'image_2',
            'image_3',
            'image_4',
            'image_5',
            'image_6',
            'image_7',
            'image_8',
            'image_9',
            'image_10',
            'image_11',
            'image_12',
            'image_13',
            'image_14',
            'image_15',
        ]

    def update(self, instance, validated_data):
        """
        Überschriebene update-Methode, die nur die Bildfelder aktualisiert.
        Verarbeitet bis zu 15 Bilder für eine Formularantwort.
        """
        for i in range(1, 16):
            field_name = f'image_{i}'
            if field_name in validated_data:
                setattr(instance, field_name, validated_data[field_name])
        instance.save()
        return instance

# ---------------------------------------------------
# 3) CONTACT + HOMESCREEN
# ---------------------------------------------------
class ContactSerializer(serializers.ModelSerializer):
    """
    Serializer für das Contact-Modell.
    Repräsentiert Kontaktinformationen für die Übung.
    """
    class Meta:
        model = Contact
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'email', 'general_info']


class HomeScreenImageSerializer(serializers.ModelSerializer):
    """
    Serializer für das HomeScreenImage-Modell.
    Stellt Bilder für den Startbildschirm der Anwendung bereit.
    """
    # Berechnetes Feld für die vollständige Bild-URL
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HomeScreenImage
        fields = ['id', 'image_url', 'description']

    def get_image_url(self, obj):
        """
        Methodenfunktion zur Generierung der vollständigen Bild-URL.
        Berücksichtigt die aktuelle Request-Basis-URL.
        """
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

# ---------------------------------------------------
# 4) VICTIMPROFILE + EXCELUPLOAD
# ---------------------------------------------------
class VictimProfileSerializer(serializers.ModelSerializer):
    """
    Serializer für das VictimProfile-Modell.
    Repräsentiert ein vollständiges Opferprofil mit allen Daten.
    """
    class Meta:
        model = VictimProfile
        fields = '__all__'  # Alle Felder des Modells einbeziehen


class ExcelUploadSerializer(serializers.ModelSerializer):
    """
    Serializer für das ExcelUpload-Modell.
    Verwaltet den Upload von Excel-Dateien zur Massenverarbeitung von Opferprofilen.
    """
    class Meta:
        model = ExcelUpload
        fields = '__all__'  # Alle Felder des Modells einbeziehen

# ---------------------------------------------------
# 5) KURZ-FORM DES VICTIMPROFILE (optional)
# ---------------------------------------------------
class VictimProfileShortSerializer(serializers.ModelSerializer):
    """
    Vereinfachter Serializer für das VictimProfile-Modell.
    Enthält nur die wichtigsten Felder für Übersichtslisten und Referenzen.
    """
    class Meta:
        model = VictimProfile
        fields = [
            'id',
            'profile_number',    # Profil-Nummer
            'category',          # Sichtungskategorie
            'diagnosis',         # Diagnose
            'gcs',              # Glasgow Coma Scale
            'spo2',             # Sauerstoffsättigung
            'lastname',         # Nachname
            'firstname',        # Vorname
        ]

# ---------------------------------------------------
# 6) ORGANIZATION + TESTSCENARIO
# ---------------------------------------------------
class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer für das Organization-Modell.
    Repräsentiert eine Organisation, die an der Übung teilnimmt.
    """
    class Meta:
        model = Organization
        fields = ['id', 'name', 'short_code']


class TestScenarioSerializer(serializers.ModelSerializer):
    """
    Serializer für das TestScenario-Modell.
    Repräsentiert ein Testszenario mit Datum und Namen.
    """
    class Meta:
        model = TestScenario
        fields = ['id', 'name', 'date']

# ---------------------------------------------------
# 7) TESTSCENARIOVICTIM (Ehemals ScenarioAssignment)
# ---------------------------------------------------
class TestScenarioVictimSerializer(serializers.ModelSerializer):
    """
    Serializer für das TestScenarioVictim-Modell.
    Repräsentiert die Zuweisung eines Opferprofils zu einem Testszenario.
    Enthält auch Kurzinformationen zum Opferprofil für schnellen Zugriff.
    """
    # Eingebettete Kurzinformationen zum Opferprofil
    victim_profile_data = VictimProfileShortSerializer(source='victim_profile', read_only=True)

    class Meta:
        model = TestScenarioVictim
        fields = [
            'id',
            'scenario',            # Zugehöriges Testszenario
            'victim_profile',      # ID des Opferprofils
            'victim_profile_data', # Kurzinformationen zum Opferprofil
            'organization',        # Zugehörige Organisation
            'sequential_number',   # Fortlaufende Nummer innerhalb der Organisation
            'button_number'        # Button-Code für den schnellen Zugriff
        ]

# ---------------------------------------------------
# 8) OBSERVERACCOUNT (Neuer Serializer für Beobachterkonten)
# ---------------------------------------------------
class ObserverAccountSerializer(serializers.ModelSerializer):
    """
    Serializer für das ObserverAccount-Modell.
    Repräsentiert ein Beobachterkonto mit Zugriffsrechten auf bestimmte Formulare.
    """
    # Verknüpfung zu mehreren Formularen über Primary Keys
    allowed_forms = serializers.PrimaryKeyRelatedField(queryset=Form.objects.all(), many=True)

    class Meta:
        model = ObserverAccount
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password', 'allowed_forms', 'show_patient_profiles']

class VictimProfileResponseSerializer(serializers.ModelSerializer):
    """
    Serializer für das VictimProfileResponse-Modell.
    Repräsentiert die Antwortdaten zu einem Opferprofil aus dem VictimProfileDetailScreen.
    Speichert Behandlungs- und Verlaufsdaten für ein Opfer während der Übung.
    """
    class Meta:
        model = VictimProfileResponse
        fields = [
            'id',
            'button_number',       # Button-Nummer zur Identifikation
            'kh_intern',           # Krankenhaus-interne Patientennummer
            'soll_sichtung',       # Vorgesehene Sichtungskategorie
            'diagnostic_loaded',    # Diagnostische Informationen
            'vitalwerte',          # Vitalparameter
            'ist_sichtung',        # Tatsächliche Sichtungskategorie
            'sichtung_data',       # Daten zum Sichtungsprozess
            'diagnostik_data',     # Diagnostikdaten
            'therapie_data',       # Therapiedaten
            'op_team',             # OP-Team-Informationen
            'verlauf',             # Verlaufseinträge
            'observer_name',       # Name des Beobachters
            'observer_email',      # E-Mail des Beobachters
            'erstellt_am',         # Erstellungszeitpunkt
            'aktualisiert_am'      # Letzte Aktualisierung
        ]