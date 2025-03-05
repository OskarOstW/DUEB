# admin_excelupload.py - Excel-Import-Funktionalität für die DÜB-App
#
# Diese Datei definiert die Admin-Schnittstelle für Excel-Uploads in der DÜB-Anwendung.
# Sie ermöglicht das Hochladen von Excel-Dateien und deren automatische Verarbeitung,
# um Opferprofile (VictimProfile) aus den Tabellendaten zu erstellen oder zu aktualisieren.
# Der Excel-Import dient als effiziente Methode zum Massenimport von Patientendaten.

import openpyxl
from django.contrib import admin
from django.contrib import messages
from .models import ExcelUpload, VictimProfile

# ------------------------------------------------
# 1) ADMIN-KONFIGURATION FÜR EXCEL-UPLOADS
# ------------------------------------------------

@admin.register(ExcelUpload)
class ExcelUploadAdmin(admin.ModelAdmin):
    """
    Admin-Konfiguration für das ExcelUpload-Modell.
    Ermöglicht das Hochladen und Verarbeiten von Excel-Dateien mit Patientendaten.
    """
    list_display = ['_id', '_file', '_uploaded_at']
    readonly_fields = ['uploaded_at']

    def _id(self, obj):
        """Gibt die ID des ExcelUpload-Objekts zurück (für list_display)"""
        return obj.id
    _id.short_description = "ID"

    def _file(self, obj):
        """Gibt den Dateinamen des Uploads zurück (für list_display)"""
        return obj.file
    _file.short_description = "Datei"

    def _uploaded_at(self, obj):
        """Gibt den Zeitpunkt des Uploads zurück (für list_display)"""
        return obj.uploaded_at
    _uploaded_at.short_description = "Hochgeladen am"

    def save_model(self, request, obj, form, change):
        """
        Überschreibt die Standard-save_model-Methode, um die hochgeladene Excel-Datei
        nach dem Speichern automatisch zu verarbeiten und die Daten zu importieren.
        
        Diese Methode wird aufgerufen, wenn ein ExcelUpload-Objekt im Admin-Panel
        gespeichert wird. Sie liest die Daten aus der Excel-Datei und erstellt oder
        aktualisiert VictimProfile-Objekte basierend auf den Tabellendaten.
        """
        # Speichert zunächst das Modell mit der hochgeladenen Datei
        super().save_model(request, obj, form, change)

        # Öffnet die Excel-Datei mit openpyxl
        excel_file = obj.file.path
        wb = openpyxl.load_workbook(excel_file, data_only=True)
        sheet = wb.active

        # Verarbeitet alle Zeilen ab Zeile 2 (nach der Überschriftenzeile)
        for row in sheet.iter_rows(min_row=2):
            # Bricht die Schleife ab, wenn die erste Zelle leer ist
            if not row[0].value:
                break

            # Liest die Profilnummer aus der ersten Spalte (A)
            profile_number = str(row[0].value).strip()
            
            # Sucht nach einem existierenden Profil oder erstellt ein neues
            profile, _created = VictimProfile.objects.get_or_create(profile_number=profile_number)

            # Ordnet die Werte aus den Excel-Spalten den Profil-Feldern zu
            # Spalte B => row[1]
            if row[1].value:
                profile.pcz_ivena = str(row[1].value).strip()
            if row[2].value:
                profile.category = str(row[2].value).strip()
            if row[3].value:
                profile.expected_med_action = str(row[3].value).strip()
            if row[4].value:
                profile.diagnosis = str(row[4].value).strip()
            if row[5].value:
                profile.visual_diagnosis = str(row[5].value).strip()
            if row[6].value:
                profile.findings = str(row[6].value).strip()
            if row[7].value:
                profile.symptoms = str(row[7].value).strip()
            if row[8].value:
                profile.actor_hints = str(row[8].value).strip()
            if row[9].value:
                profile.required_specialty = str(row[9].value).strip()
            if row[10].value:
                profile.gcs = str(row[10].value).strip()
            if row[11].value:
                profile.spo2 = str(row[11].value).strip()
            if row[12].value:
                profile.rekap = str(row[12].value).strip()
            if row[13].value:
                profile.resp_rate = str(row[13].value).strip()
            if row[14].value:
                profile.sys_rr = str(row[14].value).strip()
            if row[15].value:
                profile.ekg_monitor = str(row[15].value).strip()
            if row[16].value:
                profile.ro_thorax = str(row[16].value).strip()
            if row[17].value:
                profile.fast_sono = str(row[17].value).strip()
            if row[18].value:
                profile.e_fast = str(row[18].value).strip()
            if row[19].value:
                profile.radiology_finds = str(row[19].value).strip()
            if row[20].value:
                profile.hb_value = str(row[20].value).strip()
            if row[21].value:
                profile.blood_units = str(row[21].value).strip()
            if row[22].value:
                profile.red_treatment_area = str(row[22].value).strip()
            if row[23].value:
                profile.ventilation_place = str(row[23].value).strip()
            if row[24].value:
                profile.icu_place = str(row[24].value).strip()
            if row[25].value:
                profile.emergency_op = str(row[25].value).strip()
            if row[26].value:
                profile.op_sieve_special = str(row[26].value).strip()
            if row[27].value:
                profile.op_sieve_basic = str(row[27].value).strip()
            if row[28].value:
                profile.personal_resources = str(row[28].value).strip()
            if row[29].value:
                profile.anesthesia_team = str(row[29].value).strip()
            if row[30].value:
                profile.radiology_resources = str(row[30].value).strip()
            if row[31].value:
                profile.op_achi_res = str(row[31].value).strip()
            if row[32].value:
                profile.op_uchi_res = str(row[32].value).strip()
            if row[33].value:
                profile.op_nchi_res = str(row[33].value).strip()
            if row[34].value:
                profile.medications = str(row[34].value).strip()
            if row[35].value:
                profile.pre_treatment_rd = str(row[35].value).strip()

            # Verarbeitung zusätzlicher Spalten, falls vorhanden
            if len(row) > 36 and row[36].value:
                profile.spare_col1 = str(row[36].value).strip()
            if len(row) > 37 and row[37].value:
                profile.spare_col2 = str(row[37].value).strip()
            if len(row) > 38 and row[38].value:
                profile.scenario_field = str(row[38].value).strip()
            if len(row) > 39 and row[39].value:
                profile.comment = str(row[39].value).strip()
            if len(row) > 40 and row[40].value:
                profile.lastname = str(row[40].value).strip()
            if len(row) > 41 and row[41].value:
                profile.firstname = str(row[41].value).strip()
            if len(row) > 42 and row[42].value:
                profile.birthdate = str(row[42].value).strip()

            # Speichert das aktualisierte oder neu erstellte Profil
            profile.save()

        # Schließt die Excel-Datei und zeigt eine Erfolgsmeldung
        wb.close()
        messages.success(request, "Excel-Datei erfolgreich eingelesen!")
