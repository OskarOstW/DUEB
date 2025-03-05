
# models.py - Datenbankmodelle für die DÜB-Anwendung (Digitale Übungsbeobachtung)
# 
# Diese Datei definiert alle Datenmodelle für die DÜB-Anwendung. Die Anwendung dient
# der digitalen Beobachtung und Dokumentation von Digitale Übungsbeobachtungen im Rahmen
# des Katastrophenschutzes. Die Modelle bilden die Grundlage für die Datenbankstruktur
# und sind nach funktionalen Bereichen gruppiert.

from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Count, Max

# ----------------------------
# 1. Form / Question / Option / FormResponse
# ----------------------------
# Diese Modelle bilden das Kerngerüst für die dynamische Formularerstellung und -verarbeitung.
# Sie ermöglichen das Erstellen von Formularen mit verschiedenen Fragentypen und die 
# Speicherung der Antworten, inklusive Bildern und Zeitstempeln.

class Form(models.Model):
    """Grundmodell für dynamische Formulare"""
    name = models.CharField("Name des Formulars", max_length=100)
    note = models.TextField("Notiz", blank=True, null=True)
    description_form = models.TextField("Formularbeschreibung", blank=True, null=True)
    # Das Feld access_code wird im neuen System nicht mehr benötigt.
    # access_code = models.CharField("Zugriffscode", max_length=100, blank=True, null=True)
    show_patient_profile_search = models.BooleanField("Patientenprofil-Suche anzeigen", default=False)

    class Meta:
        verbose_name = "Formular"
        verbose_name_plural = "Formulare"

    def __str__(self):
        return self.name


class Question(models.Model):
    """Fragen innerhalb eines Formulars mit verschiedenen Antworttypen"""
    form = models.ForeignKey(
        Form,
        related_name='questions',
        on_delete=models.CASCADE,
        verbose_name="Zugehöriges Formular"
    )
    question_text = models.TextField("Fragetext", blank=True, null=True)
    option_type = models.CharField(
        "Antwort-Typ",
        max_length=50,
        choices=(
            ('none', 'None'),
            ('checkbox', 'Checkbox'),
            ('dropdown', 'Dropdown'),
            ('scale', 'Skala'),
            ('image', 'Bild')
        )
    )
    input_field_added = models.BooleanField("Eingabefeld hinzugefügt?", default=False)
    image_upload_desired = models.BooleanField("Bild-Upload möglich?", default=False)
    description_question = models.TextField("Beschreibung der Frage", blank=True, null=True)
    hint = models.TextField("Hinweis", blank=True, null=True)

    class Meta:
        verbose_name = "Frage"
        verbose_name_plural = "Fragen"

    def __str__(self):
        return self.question_text or "Frage (unbenannt)"


class Option(models.Model):
    """Einzelne Antwortoptionen für Fragen mit Checkbox- oder Dropdown-Typ"""
    question = models.ForeignKey(
        Question,
        related_name='options',
        on_delete=models.CASCADE,
        verbose_name="Zugehörige Frage"
    )
    label = models.CharField("Antwort-Label", max_length=255)

    class Meta:
        verbose_name = "Antwort-Option"
        verbose_name_plural = "Antwort-Optionen"

    def save(self, *args, **kwargs):
        """Verhindert die Erstellung von Optionen für Skala-Fragen"""
        if self.question.option_type == 'scale':
            raise ValidationError('Optionen mit Labels sind für Skala-Fragen nicht zulässig.')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.label


class FormResponse(models.Model):
    """Speichert alle Antworten zu einem ausgefüllten Formular"""
    form = models.ForeignKey(
        Form,
        related_name='responses',
        on_delete=models.CASCADE,
        verbose_name="Formular"
    )
    observer_name = models.CharField("Beobachter-Name", max_length=255, blank=True)
    observer_email = models.CharField("Beobachter-Email", max_length=255, blank=True)
    responses = models.JSONField("Antworten")
    picker_selections = models.JSONField("Picker-Auswahlen", blank=True, null=True)
    scale_values = models.JSONField("Skalen-Werte", blank=True, null=True)
    timestamps = models.JSONField("Zeitstempel", blank=True, null=True)
    note = models.TextField("Notiz", blank=True, null=True)
    submitted_at = models.DateTimeField("Eingereicht am", auto_now_add=True)
    note_timestamps = models.JSONField("Zeitstempel Notiz", blank=True, null=True)

    # Feste 15 Bild-Felder für hochgeladene Bilder zu Fragen im Formular
    image_1 = models.ImageField("Bild 1", upload_to='uploads/', blank=True, null=True)
    image_2 = models.ImageField("Bild 2", upload_to='uploads/', blank=True, null=True)
    image_3 = models.ImageField("Bild 3", upload_to='uploads/', blank=True, null=True)
    image_4 = models.ImageField("Bild 4", upload_to='uploads/', blank=True, null=True)
    image_5 = models.ImageField("Bild 5", upload_to='uploads/', blank=True, null=True)
    image_6 = models.ImageField("Bild 6", upload_to='uploads/', blank=True, null=True)
    image_7 = models.ImageField("Bild 7", upload_to='uploads/', blank=True, null=True)
    image_8 = models.ImageField("Bild 8", upload_to='uploads/', blank=True, null=True)
    image_9 = models.ImageField("Bild 9", upload_to='uploads/', blank=True, null=True)
    image_10 = models.ImageField("Bild 10", upload_to='uploads/', blank=True, null=True)
    image_11 = models.ImageField("Bild 11", upload_to='uploads/', blank=True, null=True)
    image_12 = models.ImageField("Bild 12", upload_to='uploads/', blank=True, null=True)
    image_13 = models.ImageField("Bild 13", upload_to='uploads/', blank=True, null=True)
    image_14 = models.ImageField("Bild 14", upload_to='uploads/', blank=True, null=True)
    image_15 = models.ImageField("Bild 15", upload_to='uploads/', blank=True, null=True)

    class Meta:
        verbose_name = "Formular-Antwort"
        verbose_name_plural = "Formular-Antworten"

    def __str__(self):
        return f"Response to {self.form.name} by {self.observer_name}"


# ----------------------------
# 2. Contacts + Homescreen
# ----------------------------
# Diese Modelle speichern Kontaktdaten und Startbildschirm-Inhalte für die Anwendung,
# die offline verfügbar sein sollen.

class Contact(models.Model):
    """Speichert Kontaktdaten für wichtige Ansprechpartner im System"""
    first_name = models.CharField("Vorname", max_length=100)
    last_name = models.CharField("Nachname", max_length=100)
    phone_number = models.CharField("Telefonnummer", max_length=20)
    email = models.EmailField("E-Mail")
    general_info = models.TextField("Allgemeine Infos", blank=True, null=True)

    class Meta:
        verbose_name = "Kontakt"
        verbose_name_plural = "Kontakte"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class HomeScreenImage(models.Model):
    """Bilder für den Startbildschirm der Anwendung"""
    image = models.ImageField("Bilddatei", upload_to='homescreen/')
    description = models.TextField("Beschreibung", blank=True, null=True)

    class Meta:
        verbose_name = "Startbild"
        verbose_name_plural = "Startbilder"

    def __str__(self):
        return f"Image {self.id}"


# ----------------------------
# 3. VictimProfile + 2 leere Spalten
# ----------------------------
# Dieses Modell enthält detaillierte Daten zu den Patientenprofilen (Opferprofilen)
# für die Digitale Übungsbeobachtung, inklusive medizinischer Daten und Behandlungsinformationen.

class VictimProfile(models.Model):
    """Umfassendes Profil für simulierte Patienten in der Übung"""
    # Identifikation und Grundinformationen
    profile_number = models.CharField("Profilnr", max_length=50, unique=True, blank=True, null=True)
    category = models.CharField("Kategorie", max_length=200, blank=True, null=True)
    pcz_ivena = models.CharField("PCZ IVENA", max_length=200, blank=True, null=True)
    expected_med_action = models.TextField("Erwartete med. Handlung", blank=True, null=True)
    diagnosis = models.TextField("Diagnose", blank=True, null=True)
    visual_diagnosis = models.TextField("Blickdiagnose", blank=True, null=True)
    findings = models.TextField("Befund", blank=True, null=True)
    symptoms = models.TextField("Symptome", blank=True, null=True)
    actor_hints = models.TextField("Darstellerhinweise", blank=True, null=True)
    required_specialty = models.CharField("erforderliche Fachrichtung", max_length=200, blank=True, null=True)

    # Vitalparameter
    gcs = models.CharField("GCS von 15", max_length=50, blank=True, null=True)
    spo2 = models.CharField("SpO2 in %", max_length=50, blank=True, null=True)
    rekap = models.CharField("Rekap in Sek.", max_length=50, blank=True, null=True)
    resp_rate = models.CharField("AF/min", max_length=50, blank=True, null=True)
    sys_rr = models.CharField("sys. RR in mmHg", max_length=50, blank=True, null=True)

    # Diagnostik und Befunde
    ekg_monitor = models.CharField("EKG Monitoring", max_length=200, blank=True, null=True)
    ro_thorax = models.CharField("Rö-Thorax", max_length=200, blank=True, null=True)
    fast_sono = models.CharField("FAST-Sono", max_length=200, blank=True, null=True)
    e_fast = models.CharField("(E-FAST)", max_length=200, blank=True, null=True)
    radiology_finds = models.TextField("Radiologiebefunde", blank=True, null=True)
    hb_value = models.CharField("Hb Wert mg/dl", max_length=50, blank=True, null=True)
    blood_units = models.CharField("Blutkonserven [Stk]", max_length=50, blank=True, null=True)

    # Behandlungsplatz-Anforderungen
    red_treatment_area = models.CharField("Roter Behandlungsbereich [J/N]", max_length=5, blank=True, null=True)
    ventilation_place = models.CharField("Beatmungsplatz [J/N]", max_length=5, blank=True, null=True)
    icu_place = models.CharField("ITS-Platz [J/N]", max_length=5, blank=True, null=True)
    emergency_op = models.CharField("Not-OP [J/N]", max_length=5, blank=True, null=True)

    # OP und Ressourcen
    op_sieve_special = models.CharField("OP-Siebe Spezial", max_length=200, blank=True, null=True)
    op_sieve_basic = models.CharField("OP-Siebe Grundsiebe", max_length=200, blank=True, null=True)
    personal_resources = models.TextField("Personalressource Schockraum etc.", blank=True, null=True)
    anesthesia_team = models.CharField("AnästhesieTeam", max_length=200, blank=True, null=True)
    radiology_resources = models.CharField("Personalressource Radiologie", max_length=200, blank=True, null=True)
    op_achi_res = models.CharField("Personalressource OP-Achi", max_length=200, blank=True, null=True)
    op_uchi_res = models.CharField("Personalressource OP-Uchi", max_length=200, blank=True, null=True)
    op_nchi_res = models.CharField("Personalressource OP-Nchi", max_length=200, blank=True, null=True)

    # Medikation und Vorbehandlung
    medications = models.TextField("Medikamente", blank=True, null=True)
    pre_treatment_rd = models.TextField("Vorversorgung RD", blank=True, null=True)

    # Reservespalten für zukünftige Erweiterungen
    spare_col1 = models.CharField("Leere Spalte 1 (AK)", max_length=255, blank=True, null=True)
    spare_col2 = models.CharField("Leere Spalte 2 (AL)", max_length=255, blank=True, null=True)

    # Weitere Informationen
    scenario_field = models.TextField("Szenario", blank=True, null=True)
    comment = models.TextField("Bemerkung", blank=True, null=True)
    lastname = models.CharField("Name", max_length=100, blank=True, null=True)
    firstname = models.CharField("Vorname", max_length=100, blank=True, null=True)
    birthdate = models.CharField("Geburtsdatum", max_length=50, blank=True, null=True)

    class Meta:
        verbose_name = "Patientenprofil"
        verbose_name_plural = "Patientenprofile"

    def __str__(self):
        base = f"Profil {self.profile_number or self.pk}"
        if self.category:
            base += f" [{self.category}]"
        return base


# ----------------------------
# 4. ExcelUpload
# ----------------------------
# Modell für den Upload von Excel-Dateien, die Patientenprofile enthalten.

class ExcelUpload(models.Model):
    """Speichert hochgeladene Excel-Dateien für den Import von Patientenprofilen"""
    file = models.FileField("Excel-Datei", upload_to='excel_uploads/')
    uploaded_at = models.DateTimeField("Hochgeladen am", auto_now_add=True)

    class Meta:
        verbose_name = "Excel-Upload"
        verbose_name_plural = "Excel-Uploads"

    def __str__(self):
        return f"ExcelUpload #{self.pk} vom {self.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}"


# ----------------------------
# 5. Organization
# ----------------------------
# Modell für die teilnehmenden Organisationen (z.B. Krankenhäuser) an der Übung.

class Organization(models.Model):
    """Organisationen, die an der Digitale Übungsbeobachtung teilnehmen"""
    name = models.CharField("Name", max_length=100, unique=True)
    short_code = models.CharField("Kürzel", max_length=10, unique=True)

    class Meta:
        verbose_name = "Organisation"
        verbose_name_plural = "Organisationen"

    def __str__(self):
        return f"{self.name} ({self.short_code})"

    def clean(self):
        """Validiert, dass das Kürzel nur aus Buchstaben besteht"""
        if not self.short_code.isalpha():
            raise ValidationError({
                'short_code': 'Das Kürzel darf nur aus Buchstaben bestehen.'
            })


# ----------------------------
# 6. TestScenario + Through-Modell TestScenarioVictim
# ----------------------------
# Modelle für die Testszenarios und die Zuordnung von Patientenprofilen zu diesen Szenarien.

class TestScenario(models.Model):
    """Übungsszenario für die Digitale Übungsbeobachtung"""
    name = models.CharField("Name", max_length=200)
    date = models.DateField("Datum", blank=True, null=True)
    description = models.TextField("Beschreibung", blank=True, null=True)

    selected_profiles = models.ManyToManyField(
        'VictimProfile',
        through='TestScenarioVictim',
        related_name='scenarios',
        verbose_name="Zugewiesene Profile"
    )

    class Meta:
        verbose_name = "Testszenario"
        verbose_name_plural = "Testszenarien"

    def __str__(self):
        return f"{self.name} ({self.date})" if self.date else self.name

    def get_assigned_profile_ids(self):
        """Gibt alle IDs der zugeordneten Patientenprofile zurück"""
        return self.assignments.values_list('victim_profile_id', flat=True)

    def get_profile_stats(self):
        """Gibt Statistiken über die Verteilung der Profilkategorien zurück"""
        stats = (
            self.assignments
                .values('victim_profile__category')
                .annotate(count=models.Count('id'))
                .order_by('victim_profile__category')
        )
        return {item['victim_profile__category']: item['count'] for item in stats}

    def clean(self):
        """
        Verhindert das Anlegen eines zweiten TestScenarios – gilt auch im Admin.
        Die Anwendung erlaubt nur ein aktives Testszenario gleichzeitig.
        """
        if not self.pk and TestScenario.objects.exists():
            raise ValidationError(
                "Es existiert bereits ein Testszenario. Bitte löschen Sie es erst, "
                "bevor Sie ein neues anlegen."
            )
        super().clean()


class TestScenarioVictim(models.Model):
    """Verknüpfungsmodell für die Zuordnung von Patientenprofilen zu Testszenarien"""
    scenario = models.ForeignKey(
        TestScenario,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name="Szenario"
    )
    victim_profile = models.ForeignKey(
        'VictimProfile',
        on_delete=models.CASCADE,
        verbose_name="Patientenprofil"
    )
    organization = models.ForeignKey(
        'Organization',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        verbose_name="Organisation"
    )

    sequential_number = models.PositiveIntegerField("fortlaufende Nummer")
    button_number = models.CharField("Button-Code", max_length=50)

    class Meta:
        verbose_name = "Zuweisung Profil–Szenario"
        verbose_name_plural = "Zuweisungen Profil–Szenario"
        ordering = ['sequential_number']
        constraints = [
            models.UniqueConstraint(
                fields=['scenario', 'organization', 'sequential_number'],
                name='unique_scenario_org_number'
            ),
            models.UniqueConstraint(
                fields=['scenario', 'button_number'],
                name='unique_scenario_button'
            ),
        ]

    def __str__(self):
        return f"{self.scenario.name} | {self.victim_profile.profile_number} => {self.button_number}"

    def save(self, *args, **kwargs):
        """
        Automatische Generierung der fortlaufenden Nummer und des Button-Codes,
        wenn diese noch nicht gesetzt sind.
        """
        if not self.sequential_number and self.organization:
            max_org = TestScenarioVictim.objects.filter(
                scenario=self.scenario,
                organization=self.organization
            ).aggregate(models.Max('sequential_number'))['sequential_number__max'] or 0
            self.sequential_number = max_org + 1

        if not self.button_number and self.organization:
            self.button_number = f"{self.organization.short_code}{self.sequential_number:02d}"

        super().save(*args, **kwargs)


# ----------------------------
# 7. ObserverAccount (Neues Modell für Beobachterkonten)
# ----------------------------
# Modell für die Beobachterkonten, die auf bestimmte Formulare Zugriff haben.

class ObserverAccount(models.Model):
    """Beobachterkonten mit eingeschränktem Zugriff auf bestimmte Formulare"""
    username = models.CharField("Benutzername", max_length=150, unique=True)
    first_name = models.CharField("Vorname", max_length=150)
    last_name = models.CharField("Nachname", max_length=150)
    email = models.EmailField("E-Mail")
    password = models.CharField("Passwort", max_length=128)
    allowed_forms = models.ManyToManyField(
        Form,
        blank=True,
        verbose_name="Zugängliche Formulare"
    )
    show_patient_profiles = models.BooleanField("Patientenprofile anzeigen", default=False)

    class Meta:
        verbose_name = "Beobachterkonto"
        verbose_name_plural = "Beobachterkonten"

    def __str__(self):
        return f"{self.username} ({self.first_name} {self.last_name})"

# ----------------------------
# 8. VictimProfileResponse - Angepasstes Modell für die Patientenbegleitbögen
# ----------------------------
# Speichert die Antworten und Beobachtungen zu einem bestimmten Patientenprofil.

class VictimProfileResponse(models.Model):
    """
    Dieses Modell speichert alle Daten aus dem VictimProfileDetailScreen.
    Es enthält die Beobachtungsdaten für einen Patienten während der Übung,
    einschließlich Sichtung, Diagnostik, Therapie und Verlauf.
    """
    button_number = models.CharField("Button-Nr", max_length=50)
    kh_intern = models.CharField("KH interne Pat.-Nr", max_length=50, blank=True, null=True)
    soll_sichtung = models.CharField("SOLL-Sichtungskategorie", max_length=100, blank=True, null=True)
    
    # Diagnostische Angaben und Vitalparameter
    diagnostic_loaded = models.JSONField("Diagnostische Angaben (SOLL)", blank=True, null=True)
    vitalwerte = models.JSONField("Vitalparameter (SOLL)", blank=True, null=True)
    
    # Sichtungs- und Behandlungsdaten
    ist_sichtung = models.CharField("IST-Sichtungskategorie", max_length=100, blank=True, null=True)
    sichtung_data = models.JSONField("Sichtungspunkt-Daten", blank=True, null=True)
    diagnostik_data = models.JSONField("Diagnostik-Daten", blank=True, null=True)
    therapie_data = models.JSONField("Therapie-Daten", blank=True, null=True)
    
    # OP-Team und Verlaufseinträge (jetzt als JSONField für bessere Strukturierung)
    op_team = models.JSONField("OP-Team", blank=True, null=True,
                              help_text="Liste der OP-Team-Einträge (max. 10)")
    verlauf = models.JSONField("Verlaufseinträge", blank=True, null=True,
                              help_text="Liste der Verlaufseinträge (max. 10)")
    
    # Beobachter-Infos
    observer_name = models.CharField("Beobachter-Name", max_length=255, blank=True, null=True)
    observer_email = models.EmailField("Beobachter-Email", blank=True, null=True)
    
    # Zeitstempel für die Erstellung
    erstellt_am = models.DateTimeField("Erstellt am", auto_now_add=True)
    aktualisiert_am = models.DateTimeField("Aktualisiert am", auto_now=True)

    class Meta:
        verbose_name = "Antwort Patientenbegleitbogen"
        verbose_name_plural = "Antworten Patientenbegleitbogen"
        ordering = ['-erstellt_am']  # Neueste zuerst anzeigen

    def __str__(self):
        return f"VictimProfileResponse ({self.button_number}) - {self.observer_name}"
