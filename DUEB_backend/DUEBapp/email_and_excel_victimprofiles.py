# email_and_excel_victimprofiles.py - Excel-Generierung und E-Mail-Versand für Patientenbegleitbögen
#
# Diese Datei enthält Funktionen zur Erstellung von Excel-Dateien mit Patientenprofildaten
# und zum Versand dieser Dateien per E-Mail an Beobachter. Im Gegensatz zur allgemeinen
# email_and_excel.py ist diese Datei speziell auf die Strukturierung und Formatierung 
# von Patientenbegleitbögen ausgerichtet, die während der Digitale Übungsbeobachtung verwendet werden.

import os
import tempfile
import xlsxwriter
import copy
from datetime import datetime
from django.core.mail import EmailMessage
from django.conf import settings
from .models import TestScenarioVictim, VictimProfileResponse  # Import für Button-Nummer Zuordnung und Response-Daten

# --------------------------------------------------
# 1) EXCEL-DATEI GENERIERUNG
# --------------------------------------------------
def generate_victim_profiles_excel_file(observer_account, profiles):
    """
    Generiert eine temporäre Excel-Datei mit den Daten aus den VictimProfiles.
    Gibt den Pfad zur erstellten Datei zurück.
    
    Parameter:
    - observer_account: Objekt mit first_name und email Attributen
    - profiles: Liste von VictimProfile-Objekten oder deren „Klone".
    
    Jedes Profil erhält ein eigenes Arbeitsblatt basierend auf der Button-Nummer.
    """

    # --------------------------------------------------
    # 1) Dateiname erstellen
    # --------------------------------------------------
    observer_name_sanitized = getattr(observer_account, 'first_name', '').replace(' ', '_') or "Unbekannt"
    date_str = datetime.now().strftime("%d%m%Y")  # z.B. "20012025"
    file_name = f"Patientenbegleitboegen_{observer_name_sanitized}_{date_str}.xlsx"

    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file_name)

    # --------------------------------------------------
    # 2) Workbook & Worksheets
    # --------------------------------------------------
    workbook = xlsxwriter.Workbook(file_path)
    
    # --------------------------------------------------
    # 3) Standard-Formatierungen
    # --------------------------------------------------
    # Hier werden alle Zell- und Textformate definiert, die in der Excel-Datei verwendet werden
    header_format = workbook.add_format({
        'bold': True,
        'locked': True,
        'border': 1,
        'bg_color': '#007bff',  # Blau
        'font_color': '#FFFFFF',
        'align': 'center',
        'valign': 'vcenter',
    })
    
    subheader_format = workbook.add_format({
        'bold': True,
        'locked': True,
        'border': 1,
        'bg_color': '#6c757d',  # Grau
        'font_color': '#FFFFFF',
        'align': 'left',
        'valign': 'vcenter',
    })
    
    locked_bordered_format = workbook.add_format({
        'locked': True,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
        'bg_color': '#F2F2F2',  # Hellgrau → gesperrt
    })
    
    unlocked_bordered_format = workbook.add_format({
        'locked': False,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
        'bg_color': '#FFFFFF',  # Weiß → editierbar
    })
    
    # Neues Format für leere, editierbare Zellen (gelb markiert)
    empty_editable_format = workbook.add_format({
        'locked': False,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
        'bg_color': '#FFFFCC',  # Helles Gelb für leere Eingabefelder
    })
    
    bold_format = workbook.add_format({
        'bold': True,
        'locked': True
    })
    
    # Spezielle Formatierungen für Sichtungskategorien
    sk1_format = workbook.add_format({
        'border': 1,
        'bg_color': '#d32f2f',  # Rot
        'font_color': '#FFFFFF',
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'locked': False,  # Nicht schreibgeschützt für IST-Sichtung
    })
    
    sk2_format = workbook.add_format({
        'border': 1,
        'bg_color': '#f9a825',  # Gelb
        'font_color': '#000000',
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'locked': False,  # Nicht schreibgeschützt für IST-Sichtung
    })
    
    sk3_format = workbook.add_format({
        'border': 1,
        'bg_color': '#388e3c',  # Grün
        'font_color': '#FFFFFF',
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'locked': False,  # Nicht schreibgeschützt für IST-Sichtung
    })
    
    # Spezielle Formatierungen für SOLL-Sichtungskategorien (schreibgeschützt)
    sk1_locked_format = workbook.add_format({
        'border': 1,
        'bg_color': '#d32f2f',  # Rot
        'font_color': '#FFFFFF',
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'locked': True,  # Schreibgeschützt für SOLL-Sichtung
    })
    
    sk2_locked_format = workbook.add_format({
        'border': 1,
        'bg_color': '#f9a825',  # Gelb
        'font_color': '#000000',
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'locked': True,  # Schreibgeschützt für SOLL-Sichtung
    })
    
    sk3_locked_format = workbook.add_format({
        'border': 1,
        'bg_color': '#388e3c',  # Grün
        'font_color': '#FFFFFF',
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'locked': True,  # Schreibgeschützt für SOLL-Sichtung
    })
    
    table_header_format = workbook.add_format({
        'bold': True,
        'locked': True,
        'border': 1,
        'bg_color': '#4472C4',  # Dunkelblau
        'font_color': '#FFFFFF',
        'align': 'center',
        'valign': 'vcenter',
        'text_wrap': True,
    })
    
    # Neues Format für die Übersichtstabelle
    overview_header_format = workbook.add_format({
        'bold': True,
        'locked': True,
        'border': 1,
        'bg_color': '#4472C4',  # Dunkelblau
        'font_color': '#FFFFFF',
        'align': 'center',
        'valign': 'vcenter',
        'text_wrap': True,
    })
    
    overview_data_format = workbook.add_format({
        'locked': True,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
    })
    
    # --------------------------------------------------
    # 4) Übersichtsblatt erstellen
    # --------------------------------------------------
    # Hier wird ein Übersichtsblatt erstellt, das alle Profile zusammenfasst
    overview_sheet = workbook.add_worksheet("Übersicht")
    
    # Originalbreiten der Spalten
    overview_sheet.set_column('A:A', 20)
    overview_sheet.set_column('B:B', 35)
    overview_sheet.set_column('C:C', 15)
    overview_sheet.set_column('D:D', 35)
    overview_sheet.set_column('E:E', 15)
    
    # Überschrift
    overview_sheet.merge_range('A1:E1', "Übersicht der Patientenbegleitbögen", header_format)
    
    # Allgemeine Informationen
    overview_sheet.write('A3', "Beobachter:", bold_format)
    observer_name = f"{getattr(observer_account, 'first_name', '')} {getattr(observer_account, 'last_name', '')}"
    observer_name = observer_name.strip() or "Unbekannt"
    overview_sheet.write('B3', observer_name, locked_bordered_format)
    
    overview_sheet.write('C3', "E-Mail:", bold_format)
    observer_email = getattr(observer_account, 'email', '') or "Unbekannt"
    overview_sheet.write('D3', observer_email, locked_bordered_format)
    
    overview_sheet.write('A4', "Datum der Übung:", bold_format)
    overview_sheet.write('B4', datetime.now().strftime("%d.%m.%Y"), locked_bordered_format)
    
    overview_sheet.write('C4', "Anzahl Profile:", bold_format)
    overview_sheet.write('D4', len(profiles), locked_bordered_format)
    
    # Übersichtstabelle der Profile
    overview_sheet.merge_range('A6:E6', "Zusammenfassung der Profile", subheader_format)
    
    # Tabellenkopf
    overview_sheet.write('A7', "Button-Nr.", overview_header_format)
    overview_sheet.write('B7', "SOLL-Sichtung", overview_header_format)
    overview_sheet.write('C7', "IST-Sichtung", overview_header_format)
    overview_sheet.write('D7', "KH interne Pat.-Nr.", overview_header_format)
    
    row = 8
    for profile in profiles:
        if profile is None or not hasattr(profile, 'id'):
            continue
            
        button_number = getattr(profile, '_button_number', None)
        if not button_number:
            button_number = getattr(profile, 'profile_number', None) or f"P{profile.id}"
            
        response = getattr(profile, '_victim_response', None)
        
        soll_kategorie = getattr(profile, 'category', '') or ''
        ist_sichtung = ""
        if response and hasattr(response, 'ist_sichtung'):
            ist_sichtung = response.ist_sichtung or ""
            
        kh_intern = ""
        if response and hasattr(response, 'kh_intern'):
            kh_intern = response.kh_intern or ""
        
        # Übersichtsdaten schreiben
        overview_sheet.write(f'A{row}', button_number, overview_data_format)
        overview_sheet.write(f'B{row}', soll_kategorie, overview_data_format)
        overview_sheet.write(f'C{row}', ist_sichtung, overview_data_format)
        overview_sheet.write(f'D{row}', kh_intern, overview_data_format)
        
        row += 1
    
    overview_sheet.protect('1234')
    
    # --------------------------------------------------
    # 5) Arbeitsblätter erstellen – pro Profil
    # --------------------------------------------------
    # Für jedes Profil wird ein separates Arbeitsblatt erstellt
    print(f"[DEBUG] Erstelle Excel-Datei mit {len(profiles)} Profilen")
    used_sheet_names = set()

    for profile in profiles:
        if profile is None or not hasattr(profile, 'id'):
            continue

        profile_id = profile.id
        
        # 1) Button-Nummer ermitteln
        button_number = getattr(profile, '_button_number', None)
        if not button_number:
            button_number = getattr(profile, 'profile_number', None) or f"P{profile_id}"
        
        # 2) Falls wir eine VictimProfileResponse-artige Struktur haben
        response = getattr(profile, '_victim_response', None)

        print(f"[DEBUG] Erstelle Arbeitsblatt für Profil {profile_id} mit Button {button_number}")

        # Arbeitsblatt-Name
        base_sheet_name = f"Button_{button_number}"
        base_sheet_name = base_sheet_name.replace('/', '-').replace('\\', '-')
        if len(base_sheet_name) > 31:
            base_sheet_name = base_sheet_name[:28] + '...'
        
        sheet_name = base_sheet_name
        counter = 1
        while sheet_name.lower() in used_sheet_names:
            suffix = f"_{counter}"
            if len(base_sheet_name) + len(suffix) > 31:
                sheet_name = base_sheet_name[:28-len(suffix)] + '...' + suffix
            else:
                sheet_name = base_sheet_name + suffix
            counter += 1
        
        used_sheet_names.add(sheet_name.lower())
        
        try:
            worksheet = workbook.add_worksheet(sheet_name)
        except Exception as e:
            print(f"[ERROR] Fehler beim Erstellen des Arbeitsblatts '{sheet_name}': {e}")
            import random
            fallback_name = f"Profil_{random.randint(1000,9999)}"
            while fallback_name.lower() in used_sheet_names:
                fallback_name = f"Profil_{random.randint(1000,9999)}"
            used_sheet_names.add(fallback_name.lower())
            try:
                worksheet = workbook.add_worksheet(fallback_name)
                print(f"[INFO] Verwende Fallback-Namen '{fallback_name}' für Profil {profile_id}")
            except Exception as e2:
                print(f"[ERROR] Auch Fallback-Name konnte nicht erstellt werden: {e2}")
                continue
        
        # Zurück zu den ursprünglichen Spaltenbreiten
        worksheet.set_column('A:A', 20)     # Spalte A - Behandlungsort
        worksheet.set_column('B:B', 35)     # Spalte B - Verletztenkatalog
        worksheet.set_column('C:C', 40)     # Spalte C - Tatsächliche Behandlung
        worksheet.set_column('D:D', 12)     # Spalte D - von
        worksheet.set_column('E:E', 12)     # Spalte E - bis

        # --------------------------------------------------
        # Kopfbereich
        # --------------------------------------------------
        worksheet.merge_range('A1:E1', f"Patientenbegleitbogen - Buttonnummer {button_number}", header_format)
        
        # Beobachter
        worksheet.write('A2', "Beobachter:", bold_format)
        observer_name = f"{getattr(observer_account, 'first_name', '')} {getattr(observer_account, 'last_name', '')}"
        observer_name = observer_name.strip() or "Unbekannt"
        worksheet.write('B2', observer_name, locked_bordered_format)
        
        # Datum - D2 und E2 verschmolzen
        worksheet.write('C2', "Datum der Übung:", bold_format)
        worksheet.merge_range('D2:E2', datetime.now().strftime("%d.%m.%Y"), locked_bordered_format)
        
        # KH-intern
        kh_intern = ""
        if response and hasattr(response, 'kh_intern'):
            kh_intern = response.kh_intern or ""
        worksheet.write('A3', "KH interne Pat.-Nr:", bold_format)
        
        # Wenn leer, dann gelbes Format verwenden
        kh_format = empty_editable_format if not kh_intern else unlocked_bordered_format
        worksheet.write('B3', kh_intern, kh_format)
        
        # SOLL-Sichtung - D3 und E3 verschmolzen
        soll_kategorie = getattr(profile, 'category', '') or ''
        worksheet.write('C3', "SOLL-Sicht.", bold_format)
        if "SK I" in soll_kategorie or "SK 1" in soll_kategorie:
            worksheet.merge_range('D3:E3', soll_kategorie, sk1_locked_format)
        elif "SK II" in soll_kategorie or "SK 2" in soll_kategorie:
            worksheet.merge_range('D3:E3', soll_kategorie, sk2_locked_format)
        elif "SK III" in soll_kategorie or "SK 3" in soll_kategorie:
            worksheet.merge_range('D3:E3', soll_kategorie, sk3_locked_format)
        else:
            worksheet.merge_range('D3:E3', soll_kategorie, locked_bordered_format)
        
        # IST-Sichtung mit Dropdown
        worksheet.write('A4', "IST-Sichtungskategorie:", bold_format)
        
        ist_sichtung = ""
        if response and hasattr(response, 'ist_sichtung'):
            ist_sichtung = response.ist_sichtung or ""
        
        # Dropdown-Liste für IST-Sichtung erstellen
        worksheet.data_validation('B4', {
            'validate': 'list',
            'source': ['SK I', 'SK II', 'SK III'],
            'error_title': 'Ungültige Eingabe',
            'error_message': 'Bitte wählen Sie einen Wert aus der Liste aus.'
        })
        
        # Format entsprechend der aktuellen IST-Sichtung - NICHT schreibgeschützt
        if "SK I" in ist_sichtung or "SK 1" in ist_sichtung:
            worksheet.write('B4', ist_sichtung, sk1_format)
        elif "SK II" in ist_sichtung or "SK 2" in ist_sichtung:
            worksheet.write('B4', ist_sichtung, sk2_format)
        elif "SK III" in ist_sichtung or "SK 3" in ist_sichtung:
            worksheet.write('B4', ist_sichtung, sk3_format)
        else:
            # Wenn leer, dann weißes Format verwenden
            worksheet.write('B4', ist_sichtung, unlocked_bordered_format)

        # Bedingte Formatierung für die IST-Sichtung
        worksheet.conditional_format('B4', {
            'type':     'text',
            'criteria': 'containing',
            'value':    'SK I',
            'format':   sk1_format
        })
        
        worksheet.conditional_format('B4', {
            'type':     'text',
            'criteria': 'containing',
            'value':    'SK 1',
            'format':   sk1_format
        })
        
        worksheet.conditional_format('B4', {
            'type':     'text',
            'criteria': 'containing',
            'value':    'SK II',
            'format':   sk2_format
        })
        
        worksheet.conditional_format('B4', {
            'type':     'text',
            'criteria': 'containing',
            'value':    'SK 2',
            'format':   sk2_format
        })
        
        worksheet.conditional_format('B4', {
            'type':     'text',
            'criteria': 'containing',
            'value':    'SK III',
            'format':   sk3_format
        })
        
        worksheet.conditional_format('B4', {
            'type':     'text',
            'criteria': 'containing',
            'value':    'SK 3',
            'format':   sk3_format
        })

        # --------------------------------------------------
        # Diagnostische Angaben
        # --------------------------------------------------
        current_row = 5  # Startet direkt bei Zeile 5, keine Leerzeile
        
        worksheet.merge_range(f'A{current_row}:E{current_row}', "Diagnostische Angaben", subheader_format)
        current_row += 1
        
        # Diagnose - Direkt ohne Leerzeile
        worksheet.write(f'A{current_row}', "Diagnose:", bold_format)
        worksheet.merge_range(f'B{current_row}:E{current_row}', getattr(profile, 'diagnosis', ''), locked_bordered_format)
        current_row += 1
        
        # Blickdiagnose
        worksheet.write(f'A{current_row}', "Blickdiagnose:", bold_format)
        worksheet.merge_range(f'B{current_row}:E{current_row}', getattr(profile, 'visual_diagnosis', ''), locked_bordered_format)
        current_row += 1
        
        # Befund
        worksheet.write(f'A{current_row}', "Befund:", bold_format)
        worksheet.merge_range(f'B{current_row}:E{current_row}', getattr(profile, 'findings', ''), locked_bordered_format)
        current_row += 1
        
        # Symptome
        worksheet.write(f'A{current_row}', "Symptome:", bold_format)
        worksheet.merge_range(f'B{current_row}:E{current_row}', getattr(profile, 'symptoms', ''), locked_bordered_format)
        current_row += 1

        # --------------------------------------------------
        # Vitalparameter
        # --------------------------------------------------
        worksheet.merge_range(f'A{current_row}:E{current_row}', "Vitalparameter", subheader_format)
        current_row += 1
        
        # Alle 7 Vitalparameter anzeigen - Direkt ohne Leerzeile
        # GCS
        worksheet.write(f'A{current_row}', "GCS:", bold_format)
        worksheet.write(f'B{current_row}', getattr(profile, 'gcs', ''), locked_bordered_format)
        current_row += 1
        
        # SpO2
        worksheet.write(f'A{current_row}', "SpO2:", bold_format)
        worksheet.write(f'B{current_row}', getattr(profile, 'spo2', ''), locked_bordered_format)
        current_row += 1
        
        # Rekap
        worksheet.write(f'A{current_row}', "Rekap:", bold_format)
        worksheet.write(f'B{current_row}', getattr(profile, 'rekap', ''), locked_bordered_format)
        current_row += 1
        
        # Hb
        worksheet.write(f'A{current_row}', "Hb:", bold_format)
        worksheet.write(f'B{current_row}', getattr(profile, 'hb_value', ''), locked_bordered_format)
        current_row += 1
        
        # sys. RR
        worksheet.write(f'A{current_row}', "sys. RR:", bold_format)
        worksheet.write(f'B{current_row}', getattr(profile, 'sys_rr', ''), locked_bordered_format)
        current_row += 1
        
        # EKG
        worksheet.write(f'A{current_row}', "EKG:", bold_format)
        worksheet.write(f'B{current_row}', getattr(profile, 'ekg_monitor', ''), locked_bordered_format)
        current_row += 1
        
        # AF
        worksheet.write(f'A{current_row}', "AF:", bold_format)
        worksheet.write(f'B{current_row}', getattr(profile, 'resp_rate', ''), locked_bordered_format)
        current_row += 1

        # --------------------------------------------------
        # Sichtung
        # --------------------------------------------------
        worksheet.merge_range(f'A{current_row}:E{current_row}', "Sichtungspunkt", subheader_format)
        current_row += 1
        
        # Tabellenkopf für Sichtungspunkt - Direkt ohne Leerzeile
        worksheet.write(current_row, 0, "Behandlungsort", table_header_format)
        worksheet.write(current_row, 1, "Verletztenkatalog", table_header_format)
        worksheet.write(current_row, 2, "Tatsächliche Behandlung", table_header_format)
        worksheet.write(current_row, 3, "von", table_header_format)
        worksheet.write(current_row, 4, "bis", table_header_format)
        current_row += 1
        
        sichtung_data = []
        if response and hasattr(response, 'sichtung_data') and response.sichtung_data:
            sichtung_data = response.sichtung_data

        sichtung_map = {}
        if isinstance(sichtung_data, list):
            for item in sichtung_data:
                if isinstance(item, dict) and 'place' in item:
                    sichtung_map[item['place']] = item
        elif isinstance(sichtung_data, dict):
            for key, val in sichtung_data.items():
                if isinstance(val, dict) and 'place' in val:
                    sichtung_map[val['place']] = val
                else:
                    sichtung_map[key] = val
        
        soll_kategorie = getattr(profile, 'category', '') or ''
        standard_sichtungspunkte = [
            ("Grün", "Nein" if not soll_kategorie.startswith("SK 3") else "Ja"),
            ("Gelb", "Nein" if not soll_kategorie.startswith("SK 2") else "Ja"),
            ("Rot",  "Nein" if not soll_kategorie.startswith("SK 1") else "Ja"),
            ("Schockraum", "Nein"),
        ]
        
        for place, expected in standard_sichtungspunkte:
            actual = ""
            time_von = ""
            time_bis = ""

            if place in sichtung_map:
                item = sichtung_map[place]
                if isinstance(item, dict):
                    actual = item.get('tatsaechlicheBehandlung', '')
                    time_von = item.get('von', '')
                    time_bis = item.get('bis', '')
            
            worksheet.write(current_row, 0, place, locked_bordered_format)
            worksheet.write(current_row, 1, expected, locked_bordered_format)
            
            # Format je nachdem, ob Feld leer ist
            actual_format = empty_editable_format if not actual else unlocked_bordered_format
            von_format = empty_editable_format if not time_von else unlocked_bordered_format
            bis_format = empty_editable_format if not time_bis else unlocked_bordered_format
            
            worksheet.write(current_row, 2, actual, actual_format)
            worksheet.write(current_row, 3, time_von, von_format)
            worksheet.write(current_row, 4, time_bis, bis_format)
            current_row += 1

        # --------------------------------------------------
        # Diagnostik
        # --------------------------------------------------
        worksheet.merge_range(f'A{current_row}:E{current_row}', "Diagnostik", subheader_format)
        current_row += 1
        
        # Tabellenkopf für Diagnostik - Direkt ohne Leerzeile
        worksheet.write(current_row, 0, "Untersuchung", table_header_format)
        worksheet.write(current_row, 1, "Verletztenkatalog", table_header_format)
        worksheet.write(current_row, 2, "Tatsächliche Behandlung", table_header_format)
        worksheet.write(current_row, 3, "von", table_header_format)
        worksheet.write(current_row, 4, "bis", table_header_format)
        current_row += 1
        
        diagnostik_data = []
        if response and hasattr(response, 'diagnostik_data') and response.diagnostik_data:
            diagnostik_data = response.diagnostik_data
        
        diagnostik_map = {}
        if isinstance(diagnostik_data, list):
            for item in diagnostik_data:
                if isinstance(item, dict) and 'place' in item:
                    diagnostik_map[item['place']] = item
        elif isinstance(diagnostik_data, dict):
            for k, v in diagnostik_data.items():
                if isinstance(v, dict) and 'place' in v:
                    diagnostik_map[v['place']] = v
                else:
                    diagnostik_map[k] = v

        standard_diagnostik = [
            ("EKG Monitoring", getattr(profile, 'ekg_monitor', '')),
            ("Rö-Thorax", getattr(profile, 'ro_thorax', '')),
            ("Fast-Sono", getattr(profile, 'fast_sono', '')),
            ("E-Fast", getattr(profile, 'e_fast', '')),
            ("CT", getattr(profile, 'radiology_finds', '')),
        ]
        
        for place, expected in standard_diagnostik:
            actual = ""
            time_von = ""
            time_bis = ""

            if place in diagnostik_map:
                item = diagnostik_map[place]
                if isinstance(item, dict):
                    actual = item.get('tatsaechlicheBehandlung', '')
                    time_von = item.get('von', '')
                    time_bis = item.get('bis', '')

            worksheet.write(current_row, 0, place, locked_bordered_format)
            worksheet.write(current_row, 1, expected, locked_bordered_format)
            
            # Format je nachdem, ob Feld leer ist
            actual_format = empty_editable_format if not actual else unlocked_bordered_format
            von_format = empty_editable_format if not time_von else unlocked_bordered_format
            bis_format = empty_editable_format if not time_bis else unlocked_bordered_format
            
            worksheet.write(current_row, 2, actual, actual_format)
            worksheet.write(current_row, 3, time_von, von_format)
            worksheet.write(current_row, 4, time_bis, bis_format)
            current_row += 1

        # --------------------------------------------------
        # Therapie
        # --------------------------------------------------
        worksheet.merge_range(f'A{current_row}:E{current_row}', "Therapie", subheader_format)
        current_row += 1
        
        # Tabellenkopf für Therapie - Direkt ohne Leerzeile
        worksheet.write(current_row, 0, "Behandlungsort", table_header_format)
        worksheet.write(current_row, 1, "Verletztenkatalog", table_header_format)
        worksheet.write(current_row, 2, "Tatsächliche Behandlung", table_header_format)
        worksheet.write(current_row, 3, "von", table_header_format)
        worksheet.write(current_row, 4, "bis", table_header_format)
        current_row += 1

        therapie_data = []
        if response and hasattr(response, 'therapie_data') and response.therapie_data:
            therapie_data = response.therapie_data

        therapie_map = {}
        if isinstance(therapie_data, list):
            for item in therapie_data:
                if isinstance(item, dict) and 'place' in item:
                    therapie_map[item['place']] = item
        elif isinstance(therapie_data, dict):
            for k, v in therapie_data.items():
                if isinstance(v, dict) and 'place' in v:
                    therapie_map[v['place']] = v
                else:
                    therapie_map[k] = v

        op_achri = (getattr(profile, 'op_achi_res', '') or '').strip().upper()
        op_uchi = (getattr(profile, 'op_uchi_res', '') or '').strip().upper()
        op_nchi = (getattr(profile, 'op_nchi_res', '') or '').strip().upper()

        op_values = []
        if op_achri and op_achri != 'N':
            op_values.append(op_achri)
        if op_uchi and op_uchi != 'N':
            op_values.append(op_uchi)
        if op_nchi and op_nchi != 'N':
            op_values.append(op_nchi)
        op_verletztenkatalog = " / ".join(op_values)

        its_platz = (getattr(profile, 'icu_place', '') or '').strip().upper()
        beatmung = (getattr(profile, 'ventilation_place', '') or '').strip().upper()

        its_mit_beatmung = ''
        its_ohne_beatmung = ''
        if its_platz != 'N':
            if beatmung == 'J':
                its_mit_beatmung = 'Ja'
            elif beatmung == 'N':
                its_ohne_beatmung = 'Ja'
            else:
                its_mit_beatmung = beatmung
        
        standard_therapie = [
            ("Not-OP", getattr(profile, 'emergency_op', '')),
            ("OP", op_verletztenkatalog),
            ("Aufwachraum", ""),
            ("Pacu", ""),
            ("ITS mit Beatmung", its_mit_beatmung),
            ("ITS ohne Beatmung", its_ohne_beatmung),
            ("Normalstation", ""),
        ]
        
        for place, expected in standard_therapie:
            actual = ""
            time_von = ""
            time_bis = ""

            if place in therapie_map:
                entry = therapie_map[place]
                if isinstance(entry, dict):
                    actual = entry.get('tatsaechlicheBehandlung', '')
                    time_von = entry.get('von', '')
                    time_bis = entry.get('bis', '')

            worksheet.write(current_row, 0, place, locked_bordered_format)
            worksheet.write(current_row, 1, expected, locked_bordered_format)
            
            # Format je nachdem, ob Feld leer ist
            actual_format = empty_editable_format if not actual else unlocked_bordered_format
            von_format = empty_editable_format if not time_von else unlocked_bordered_format
            bis_format = empty_editable_format if not time_bis else unlocked_bordered_format
            
            worksheet.write(current_row, 2, actual, actual_format)
            worksheet.write(current_row, 3, time_von, von_format)
            worksheet.write(current_row, 4, time_bis, bis_format)
            current_row += 1

        # --------------------------------------------------
        # OP-Team
        # --------------------------------------------------
        # Diese Zeile verursacht keine Überlappung mehr
        worksheet.merge_range(f'A{current_row}:E{current_row}', "OP-Team", subheader_format)
        current_row += 1

        # Tabellenkopf für OP-Team - D und E für "Dauer" verschmolzen
        worksheet.write(current_row, 0, "Name", table_header_format)
        worksheet.write(current_row, 1, "Fachdisziplin", table_header_format)
        worksheet.write(current_row, 2, "Start", table_header_format)
        worksheet.merge_range(current_row, 3, current_row, 4, "Dauer", table_header_format)
        current_row += 1

        op_team_list = []
        if response and hasattr(response, 'op_team') and response.op_team:
            op_team_list = response.op_team
        
        if not op_team_list:
            # 10 leere Zeilen für Eingaben
            for _ in range(10):
                worksheet.write(current_row, 0, "", empty_editable_format)
                worksheet.write(current_row, 1, "", empty_editable_format)
                worksheet.write(current_row, 2, "", empty_editable_format)
                # D und E Zellen verschmolzen
                worksheet.merge_range(current_row, 3, current_row, 4, "", empty_editable_format)
                current_row += 1
        else:
            for entry in op_team_list:
                if isinstance(entry, dict):
                    name = entry.get('name', '')
                    fach = entry.get('fach', '')
                    start = entry.get('start', '')
                    dauer = entry.get('dauer', '')

                    # Format je nachdem, ob Feld leer ist
                    name_format = empty_editable_format if not name else unlocked_bordered_format
                    fach_format = empty_editable_format if not fach else unlocked_bordered_format
                    start_format = empty_editable_format if not start else unlocked_bordered_format
                    dauer_format = empty_editable_format if not dauer else unlocked_bordered_format
                    
                    worksheet.write(current_row, 0, name, name_format)
                    worksheet.write(current_row, 1, fach, fach_format)
                    worksheet.write(current_row, 2, start, start_format)
                    # D und E Zellen verschmolzen
                    worksheet.merge_range(current_row, 3, current_row, 4, dauer, dauer_format)
                    current_row += 1

            # auf 10 auffüllen
            for _ in range(max(0, 10 - len(op_team_list))):
                worksheet.write(current_row, 0, "", empty_editable_format)
                worksheet.write(current_row, 1, "", empty_editable_format)
                worksheet.write(current_row, 2, "", empty_editable_format)
                # D und E Zellen verschmolzen
                worksheet.merge_range(current_row, 3, current_row, 4, "", empty_editable_format)
                current_row += 1

        # --------------------------------------------------
        # Verlauf
        # --------------------------------------------------
       
        current_row += 2
        
        # Jetzt ist die Zeile garantiert frei von merge_range-Operationen
        worksheet.merge_range(f'A{current_row}:E{current_row}', "Verlaufseinträge", subheader_format)
        current_row += 1
        
        # Header für Verlauf:
        worksheet.write(current_row, 0, "Uhrzeit", table_header_format)
        worksheet.write(current_row, 1, "KH-Bereich", table_header_format)
        worksheet.merge_range(current_row, 2, current_row, 4, "Beobachtungen", table_header_format)
        current_row += 1

        verlauf_list = []
        if response and hasattr(response, 'verlauf') and response.verlauf:
            verlauf_list = response.verlauf

        if not verlauf_list:
            for _ in range(10):
                worksheet.write(current_row, 0, "", empty_editable_format)
                worksheet.write(current_row, 1, "", empty_editable_format)
                worksheet.merge_range(current_row, 2, current_row, 4, "", empty_editable_format)
                current_row += 1
        else:
            for entry in verlauf_list:
                if isinstance(entry, dict):
                    uhrzeit = entry.get('uhrzeit', '')
                    khBereich = entry.get('khBereich', '')
                    beobachtungen = entry.get('beobachtungen', '')

                    # Format je nachdem, ob Feld leer ist
                    uhrzeit_format = empty_editable_format if not uhrzeit else unlocked_bordered_format
                    khBereich_format = empty_editable_format if not khBereich else unlocked_bordered_format
                    beobachtungen_format = empty_editable_format if not beobachtungen else unlocked_bordered_format
                    
                    worksheet.write(current_row, 0, uhrzeit, uhrzeit_format)
                    worksheet.write(current_row, 1, khBereich, khBereich_format)
                    worksheet.merge_range(current_row, 2, current_row, 4, beobachtungen, beobachtungen_format)
                    current_row += 1

            # auffüllen auf 10
            for _ in range(max(0, 10 - len(verlauf_list))):
                worksheet.write(current_row, 0, "", empty_editable_format)
                worksheet.write(current_row, 1, "", empty_editable_format)
                worksheet.merge_range(current_row, 2, current_row, 4, "", empty_editable_format)
                current_row += 1

        # --------------------------------------------------
        # Fußzeile
        # --------------------------------------------------
        current_row += 2  # Zwei Leerzeilen vor der Fußzeile
        worksheet.merge_range(
            f'A{current_row}:E{current_row}',
            f"Erstellt am {datetime.now().strftime('%d.%m.%Y %H:%M')} für {observer_account.first_name} {observer_account.last_name}",
            workbook.add_format({
                'italic': True,
                'font_color': '#666666',
                'align': 'center'
            })
        )

        # Worksheet schützen
        worksheet.protect('1234')

    workbook.close()
    return file_path


# --------------------------------------------------
# 2) E-MAIL VERSAND
# --------------------------------------------------
def send_victimprofiles_email(observer_account, profiles, profile_data=None):
    """
    Sendet eine E-Mail mit angehängter Excel-Zusammenfassung der VictimProfiles.
    
    Pro Button/Profil ein eigenes Tabellenblatt. Falls in profile_data
    nutzerspezifische Daten enthalten sind, werden sie einem 
    geklonten Profil-Objekt zugewiesen.
    """
    try:
        # Validiere Eingabedaten
        if not observer_account or not hasattr(observer_account, 'email') or not observer_account.email:
            print("[INFO] send_victimprofiles_email: Kein Versand, da kein Observer-Account oder keine E-Mail.")
            return
        if observer_account.email == "unknown@observer":
            print("[INFO] send_victimprofiles_email: Kein Versand, da 'unknown@observer'.")
            return
        if not profiles:
            print("[INFO] Keine Profile für E-Mail-Versand übergeben.")
            return

        # Jedes Profile → ein Klon
        valid_profiles = []

        # Wenn zusätzliche Profildaten vorhanden sind, diese für die Excel-Generierung verwenden
        if profile_data and isinstance(profile_data, list):
            print(f"[DEBUG] Profile-Daten direkt verwendet für Excel-Generierung: {len(profile_data)} Einträge")
            for idx, original_profile in enumerate(profiles):
                if not original_profile:
                    continue
                
                cloned_profile = copy.copy(original_profile)
                
                # Versuche hier, passendes data_item anhand button_number zu finden
                # falls die Reihenfolge nicht 1:1 sein sollte
                data_item = None
                bn = getattr(original_profile, '_button_number', None)
                if bn:
                    for pd in profile_data:
                        if pd.get('button_number') == bn:
                            data_item = pd
                            break
                
                if not data_item and idx < len(profile_data):
                    data_item = profile_data[idx]
                
                if data_item:
                    btn_number = data_item.get('button_number', '')
                    setattr(cloned_profile, '_button_number', btn_number)
                    
                    response_obj = type('VictimProfileResponse', (), {})()
                    for key, value in data_item.items():
                        setattr(response_obj, key, value)
                    
                    setattr(cloned_profile, '_victim_response', response_obj)
                else:
                    # minimal fallback
                    setattr(cloned_profile, '_button_number', getattr(original_profile, 'profile_number', None))
                    setattr(cloned_profile, '_victim_response', None)
                
                valid_profiles.append(cloned_profile)
        else:
            # Fallback: Daten aus der Datenbank verwenden
            for p in profiles:
                if not p or not hasattr(p, 'id'):
                    continue
                btn_num = getattr(p, '_button_number', None) or p.profile_number or f"P{p.id}"

                cloned_profile = copy.copy(p)
                setattr(cloned_profile, '_button_number', btn_num)
                
                # VictimProfileResponse?
                try:
                    response = VictimProfileResponse.objects.filter(button_number=btn_num).first()
                    setattr(cloned_profile, '_victim_response', response)
                except Exception as e:
                    print(f"[ERROR] Konnte Response nicht abrufen: {e}")
                    setattr(cloned_profile, '_victim_response', None)
                
                valid_profiles.append(cloned_profile)

        # Listenanzeige für E-Mail-Text erstellen
        profile_info = []
        for vp in valid_profiles:
            bnn = getattr(vp, '_button_number', 'Unbekannt')
            cat = getattr(vp, 'category', '')
            profile_info.append(f"• Button/Profil {bnn} ({cat})")
        profile_list_text = "\n".join(profile_info)
        
        # Excel-Datei generieren
        excel_file_path = generate_victim_profiles_excel_file(observer_account, valid_profiles)
        
        # Vor- und Nachname des Beobachters für die E-Mail-Begrüßung
        observer_name = f"{getattr(observer_account, 'first_name', '')} {getattr(observer_account, 'last_name', '')}"
        observer_name = observer_name.strip() or "Beobachter"
        
        # E-Mail-Text und Betreff erstellen
        subject = "Ihre Patientenbegleitbögen der DÜB-Übung"
        message = (
            f"Hallo {observer_name},\n\n"
            f"vielen Dank für Ihre Teilnahme an der Krankenhausübung. "
            f"Im Anhang finden Sie eine Excel-Datei mit den Patientenbegleitbögen "
            f"für folgende Patienten:\n\n"
            f"{profile_list_text}\n\n"
            f"Sie können die Daten in der Excel-Datei einsehen und die weißen Felder "
            f"bei Bedarf bearbeiten. Die gelb markierten Felder benötigen Ihre Eingabe. "
            f"Die grauen Felder enthalten die Originaldaten und sind zum Schutz gesperrt "
            f"(Kennwort: 1234).\n\n"
            f"Das Übersichtsblatt enthält eine Zusammenfassung aller Profile.\n\n"
            f"Beste Grüße,\n"
            f"Ihr DÜB-Team"
        )

        # E-Mail-Objekt erstellen und versenden
        email = EmailMessage(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [observer_account.email],
        )
        
        if excel_file_path and os.path.exists(excel_file_path):
            email.attach_file(excel_file_path)
            try:
                email.send()
                print(f"[INFO] E-Mail mit Patientenbegleitbögen erfolgreich an {observer_account.email} versendet.")
            except Exception as e:
                print(f"[ERROR] Fehler beim Senden der E-Mail: {e}")
        else:
            print("[ERROR] Excel-Datei existiert nicht oder wurde nicht erfolgreich erstellt.")
        
        # Temporäre Datei löschen
        if excel_file_path and os.path.exists(excel_file_path):
            try:
                os.remove(excel_file_path)
            except Exception as e:
                print(f"[WARNING] Konnte temporäre Datei nicht löschen: {e}")

    except Exception as e:
        import traceback
        print("[ERROR] Unerwarteter Fehler beim E-Mail-Versand:", e)
        print("[ERROR] Details:", traceback.format_exc())