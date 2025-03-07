# Generated by Django 5.0.1 on 2025-01-22 19:22

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DUEBapp', '0038_remove_testscenario_organization_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='contact',
            options={'verbose_name': 'Kontakt', 'verbose_name_plural': 'Kontakte'},
        ),
        migrations.AlterModelOptions(
            name='excelupload',
            options={'verbose_name': 'Excel-Upload', 'verbose_name_plural': 'Excel-Uploads'},
        ),
        migrations.AlterModelOptions(
            name='form',
            options={'verbose_name': 'Formular', 'verbose_name_plural': 'Formulare'},
        ),
        migrations.AlterModelOptions(
            name='formresponse',
            options={'verbose_name': 'Formular-Antwort', 'verbose_name_plural': 'Formular-Antworten'},
        ),
        migrations.AlterModelOptions(
            name='homescreenimage',
            options={'verbose_name': 'Startbild', 'verbose_name_plural': 'Startbilder'},
        ),
        migrations.AlterModelOptions(
            name='option',
            options={'verbose_name': 'Antwort-Option', 'verbose_name_plural': 'Antwort-Optionen'},
        ),
        migrations.AlterModelOptions(
            name='organization',
            options={'verbose_name': 'Organisation', 'verbose_name_plural': 'Organisationen'},
        ),
        migrations.AlterModelOptions(
            name='question',
            options={'verbose_name': 'Frage', 'verbose_name_plural': 'Fragen'},
        ),
        migrations.AlterModelOptions(
            name='testscenario',
            options={'verbose_name': 'Testszenario', 'verbose_name_plural': 'Testszenarien'},
        ),
        migrations.AlterModelOptions(
            name='testscenariovictim',
            options={'ordering': ['sequential_number'], 'verbose_name': 'Zuweisung Profil–Szenario', 'verbose_name_plural': 'Zuweisungen Profil–Szenario'},
        ),
        migrations.AlterModelOptions(
            name='victimprofile',
            options={'verbose_name': 'Patientenprofil', 'verbose_name_plural': 'Patientenprofile'},
        ),
        migrations.AlterField(
            model_name='contact',
            name='email',
            field=models.EmailField(max_length=254, verbose_name='E-Mail'),
        ),
        migrations.AlterField(
            model_name='contact',
            name='first_name',
            field=models.CharField(max_length=100, verbose_name='Vorname'),
        ),
        migrations.AlterField(
            model_name='contact',
            name='general_info',
            field=models.TextField(blank=True, null=True, verbose_name='Allgemeine Infos'),
        ),
        migrations.AlterField(
            model_name='contact',
            name='last_name',
            field=models.CharField(max_length=100, verbose_name='Nachname'),
        ),
        migrations.AlterField(
            model_name='contact',
            name='phone_number',
            field=models.CharField(max_length=20, verbose_name='Telefonnummer'),
        ),
        migrations.AlterField(
            model_name='excelupload',
            name='file',
            field=models.FileField(upload_to='excel_uploads/', verbose_name='Excel-Datei'),
        ),
        migrations.AlterField(
            model_name='excelupload',
            name='uploaded_at',
            field=models.DateTimeField(auto_now_add=True, verbose_name='Hochgeladen am'),
        ),
        migrations.AlterField(
            model_name='form',
            name='access_code',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Zugriffscode'),
        ),
        migrations.AlterField(
            model_name='form',
            name='description_form',
            field=models.TextField(blank=True, null=True, verbose_name='Formularbeschreibung'),
        ),
        migrations.AlterField(
            model_name='form',
            name='name',
            field=models.CharField(max_length=100, verbose_name='Name des Formulars'),
        ),
        migrations.AlterField(
            model_name='form',
            name='note',
            field=models.TextField(blank=True, null=True, verbose_name='Notiz'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='form',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='responses', to='DUEBapp.form', verbose_name='Formular'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_1',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 1'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_10',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 10'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_11',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 11'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_12',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 12'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_13',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 13'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_14',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 14'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_15',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 15'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_2',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 2'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_3',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 3'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_4',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 4'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_5',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 5'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_6',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 6'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_7',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 7'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_8',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 8'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='image_9',
            field=models.ImageField(blank=True, null=True, upload_to='uploads/', verbose_name='Bild 9'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='note',
            field=models.TextField(blank=True, null=True, verbose_name='Notiz'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='note_timestamps',
            field=models.JSONField(blank=True, null=True, verbose_name='Zeitstempel Notiz'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='observer_email',
            field=models.CharField(blank=True, max_length=255, verbose_name='Beobachter-Email'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='observer_name',
            field=models.CharField(blank=True, max_length=255, verbose_name='Beobachter-Name'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='picker_selections',
            field=models.JSONField(blank=True, null=True, verbose_name='Picker-Auswahlen'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='responses',
            field=models.JSONField(verbose_name='Antworten'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='scale_values',
            field=models.JSONField(blank=True, null=True, verbose_name='Skalen-Werte'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='submitted_at',
            field=models.DateTimeField(auto_now_add=True, verbose_name='Eingereicht am'),
        ),
        migrations.AlterField(
            model_name='formresponse',
            name='timestamps',
            field=models.JSONField(blank=True, null=True, verbose_name='Zeitstempel'),
        ),
        migrations.AlterField(
            model_name='homescreenimage',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='Beschreibung'),
        ),
        migrations.AlterField(
            model_name='homescreenimage',
            name='image',
            field=models.ImageField(upload_to='homescreen/', verbose_name='Bilddatei'),
        ),
        migrations.AlterField(
            model_name='option',
            name='label',
            field=models.CharField(max_length=255, verbose_name='Antwort-Label'),
        ),
        migrations.AlterField(
            model_name='option',
            name='question',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='options', to='DUEBapp.question', verbose_name='Zugehörige Frage'),
        ),
        migrations.AlterField(
            model_name='organization',
            name='name',
            field=models.CharField(max_length=100, unique=True, verbose_name='Name'),
        ),
        migrations.AlterField(
            model_name='organization',
            name='short_code',
            field=models.CharField(max_length=10, unique=True, verbose_name='Kürzel'),
        ),
        migrations.AlterField(
            model_name='question',
            name='description_question',
            field=models.TextField(blank=True, null=True, verbose_name='Beschreibung der Frage'),
        ),
        migrations.AlterField(
            model_name='question',
            name='form',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='DUEBapp.form', verbose_name='Zugehöriges Formular'),
        ),
        migrations.AlterField(
            model_name='question',
            name='hint',
            field=models.TextField(blank=True, null=True, verbose_name='Hinweis'),
        ),
        migrations.AlterField(
            model_name='question',
            name='image_upload_desired',
            field=models.BooleanField(default=False, verbose_name='Bild-Upload möglich?'),
        ),
        migrations.AlterField(
            model_name='question',
            name='input_field_added',
            field=models.BooleanField(default=False, verbose_name='Eingabefeld hinzugefügt?'),
        ),
        migrations.AlterField(
            model_name='question',
            name='option_type',
            field=models.CharField(choices=[('none', 'None'), ('checkbox', 'Checkbox'), ('dropdown', 'Dropdown'), ('scale', 'Skala'), ('image', 'Bild')], max_length=50, verbose_name='Antwort-Typ'),
        ),
        migrations.AlterField(
            model_name='question',
            name='question_text',
            field=models.TextField(blank=True, null=True, verbose_name='Fragetext'),
        ),
        migrations.AlterField(
            model_name='testscenario',
            name='date',
            field=models.DateField(blank=True, null=True, verbose_name='Datum'),
        ),
        migrations.AlterField(
            model_name='testscenario',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='Beschreibung'),
        ),
        migrations.AlterField(
            model_name='testscenario',
            name='name',
            field=models.CharField(max_length=200, verbose_name='Name'),
        ),
        migrations.AlterField(
            model_name='testscenario',
            name='selected_profiles',
            field=models.ManyToManyField(related_name='scenarios', through='DUEBapp.TestScenarioVictim', to='DUEBapp.victimprofile', verbose_name='Zugewiesene Profile'),
        ),
        migrations.AlterField(
            model_name='testscenariovictim',
            name='button_number',
            field=models.CharField(max_length=50, verbose_name='Button-Code'),
        ),
        migrations.AlterField(
            model_name='testscenariovictim',
            name='organization',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='DUEBapp.organization', verbose_name='Organisation'),
        ),
        migrations.AlterField(
            model_name='testscenariovictim',
            name='scenario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assignments', to='DUEBapp.testscenario', verbose_name='Szenario'),
        ),
        migrations.AlterField(
            model_name='testscenariovictim',
            name='sequential_number',
            field=models.PositiveIntegerField(verbose_name='fortlaufende Nummer'),
        ),
        migrations.AlterField(
            model_name='testscenariovictim',
            name='victim_profile',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='DUEBapp.victimprofile', verbose_name='Patientenprofil'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='actor_hints',
            field=models.TextField(blank=True, null=True, verbose_name='Darstellerhinweise'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='anesthesia_team',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='AnästhesieTeam'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='birthdate',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Geburtsdatum'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='blood_units',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Blutkonserven [Stk]'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='category',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Kategorie'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='comment',
            field=models.TextField(blank=True, null=True, verbose_name='Bemerkung'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='diagnosis',
            field=models.TextField(blank=True, null=True, verbose_name='Diagnose'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='e_fast',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='(E-FAST)'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='ekg_monitor',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='EKG Monitoring'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='emergency_op',
            field=models.CharField(blank=True, max_length=5, null=True, verbose_name='Not-OP [J/N]'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='expected_med_action',
            field=models.TextField(blank=True, null=True, verbose_name='Erwartete med. Handlung'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='fast_sono',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='FAST-Sono'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='findings',
            field=models.TextField(blank=True, null=True, verbose_name='Befund'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='firstname',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Vorname'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='gcs',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='GCS von 15'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='hb_value',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Hb Wert mg/dl'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='icu_place',
            field=models.CharField(blank=True, max_length=5, null=True, verbose_name='ITS-Platz [J/N]'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='lastname',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Name'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='medications',
            field=models.TextField(blank=True, null=True, verbose_name='Medikamente'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='op_achi_res',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Personalressource OP-Achi'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='op_nchi_res',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Personalressource OP-Nchi'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='op_sieve_basic',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='OP-Siebe Grundsiebe'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='op_sieve_special',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='OP-Siebe Spezial'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='op_uchi_res',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Personalressource OP-Uchi'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='pcz_ivena',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='PCZ IVENA'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='personal_resources',
            field=models.TextField(blank=True, null=True, verbose_name='Personalressource Schockraum etc.'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='pre_treatment_rd',
            field=models.TextField(blank=True, null=True, verbose_name='Vorversorgung RD'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='profile_number',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True, verbose_name='Profilnr'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='radiology_finds',
            field=models.TextField(blank=True, null=True, verbose_name='Radiologiebefunde'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='radiology_resources',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Personalressource Radiologie'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='red_treatment_area',
            field=models.CharField(blank=True, max_length=5, null=True, verbose_name='Roter Behandlungsbereich [J/N]'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='rekap',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Rekap in Sek.'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='required_specialty',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='erforderliche Fachrichtung'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='resp_rate',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='AF/min'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='ro_thorax',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Rö-Thorax'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='scenario_field',
            field=models.TextField(blank=True, null=True, verbose_name='Szenario'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='spo2',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='SpO2 in %'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='symptoms',
            field=models.TextField(blank=True, null=True, verbose_name='Symptome'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='sys_rr',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='sys. RR in mmHg'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='ventilation_place',
            field=models.CharField(blank=True, max_length=5, null=True, verbose_name='Beatmungsplatz [J/N]'),
        ),
        migrations.AlterField(
            model_name='victimprofile',
            name='visual_diagnosis',
            field=models.TextField(blank=True, null=True, verbose_name='Blickdiagnose'),
        ),
    ]
