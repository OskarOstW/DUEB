# email_and_excel.py - Excel-Generierung und E-Mail-Versand für Formularantworten
# 
# Diese Datei enthält Funktionen zur Erzeugung von Excel-Dateien aus Formularantworten
# und zum Versand dieser Dateien per E-Mail an Beobachter. Die Excel-Dateien werden
# strukturiert aufbereitet und ermöglichen die Nachbearbeitung der während der
# Digitale Übungsbeobachtung erfassten Daten auch außerhalb der Anwendung.

import os
import tempfile
import xlsxwriter
from datetime import datetime
from django.core.mail import EmailMessage
from django.conf import settings

# --------------------------------------------------
# 1) EXCEL-DATEI GENERIERUNG
# --------------------------------------------------
def generate_excel_file(form_response):
    """
    Generiert eine temporäre Excel-Datei mit den Daten aus dem FormResponse.
    Gibt den Pfad zur erstellten Datei zurück.

    Bei Checkbox-Fragen erlaubt wir Mehrfachauswahl:
    - Validation: "any" (Erlaubt alle Werte)
    - input_message: beschreibt, wie der Nutzer Zeilenumbrüche (ALT+ENTER) und
      Semikolons verwenden soll.
    """

    # --------------------------------------------------
    # 1) Dateiname
    # --------------------------------------------------
    observer_name_sanitized = form_response.observer_name.replace(' ', '_') or "Unbekannt"
    date_str = datetime.now().strftime("%d%m%Y")  # z.B. "20012025"
    file_name = f"Formular_{observer_name_sanitized}_{date_str}.xlsx"

    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file_name)

    # --------------------------------------------------
    # 2) Workbook & Worksheets
    # --------------------------------------------------
    workbook = xlsxwriter.Workbook(file_path)

    # Hauptsheet (wird später geschützt)
    worksheet = workbook.add_worksheet("Formular-Auswertung")
    # Leeres Anleitungs-Sheet
    guide_sheet = workbook.add_worksheet("Anleitung")

    # --------------------------------------------------
    # 3) Formatierungen
    # --------------------------------------------------
    # a) Standard-Format: gesperrt, Rahmen, Zeilenumbruch
    locked_bordered_format = workbook.add_format({
        'locked': True,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
        'bg_color': '#F2F2F2',  # Hellgrau → gesperrt
    })

    # b) Format für Zellen, die bearbeitet werden dürfen (unlocked)
    unlocked_bordered_format = workbook.add_format({
        'locked': False,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
        'bg_color': '#FFFFFF',  # Weiß → editierbar
    })

    # c) Kopfzeilen-Format (gesperrt + fett + grauer Hintergrund, zentriert)
    header_format = workbook.add_format({
        'bold': True,
        'locked': True,
        'border': 1,
        'bg_color': '#D0CECE',
        'valign': 'top',
        'align': 'center',
    })

    # d) Fettschrift (gesperrt)
    bold_format = workbook.add_format({
        'bold': True,
        'locked': True
    })

    # e) Weiß ohne Rahmen (für Leerzeilen u. ä., entsperrt)
    white_no_border = workbook.add_format({
        'bg_color': '#FFFFFF',
        'border': 0,
        'locked': False
    })

    # f) Format für zentrierten Hinweis (Zeile 6)
    centered_bold_wrap = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'align': 'center',
        'valign': 'vcenter',
        'locked': True
    })

    # g) Format für zusammengeführte Zellen Zeile 7 (dicker Rahmen, zentriert)
    merged_header_center = workbook.add_format({
        'bold': True,
        'locked': True,
        'border': 2,  # dickerer Rahmen
        'bg_color': '#D0CECE',
        'align': 'center',
        'valign': 'vcenter'
    })

    # h) Format für "Keine Antwort erforderlich" (gesperrt)
    locked_message_format = workbook.add_format({
        'locked': True,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
        'bg_color': '#F2F2F2',  # Hellgrau
        'align': 'center'
    })

    # i) Format für "Keine Freitext-Antwort erforderlich" (gesperrt)
    locked_freetext_format = workbook.add_format({
        'locked': True,
        'border': 1,
        'text_wrap': True,
        'valign': 'top',
        'bg_color': '#F2F2F2',
        'align': 'center'
    })

    # Deutsch-Mapping für den Antworttyp
    answer_type_map = {
        'none': 'Keine',
        'checkbox': 'Checkbox',
        'dropdown': 'Auswahlmenü',
        'scale': 'Skala',
        'image': 'Bild'
    }

    # --------------------------------------------------
    # 4) Schreibschutz nur ab Zeile 8 für Spalten A–D
    #
    # (Zeilen 1–7 teils offen, teils gesperrt)
    # --------------------------------------------------
    worksheet.write("A1", "Datum der Krankenhausbegutachtung:", bold_format)
    worksheet.write("B1", datetime.now().strftime("%d.%m.%Y"), unlocked_bordered_format)

    worksheet.write("A2", "Beobachter-Email:", bold_format)
    observer_email = form_response.observer_email or "N/A"
    worksheet.write("B2", observer_email, unlocked_bordered_format)

    observer_name_clean = (form_response.observer_name.strip() or "N/A").split()
    first_name = observer_name_clean[0] if len(observer_name_clean) >= 1 else "N/A"
    last_name = observer_name_clean[-1] if len(observer_name_clean) > 1 else "N/A"
    worksheet.write("A3", "Vorname:", bold_format)
    worksheet.write("B3", first_name, unlocked_bordered_format)
    worksheet.write("A4", "Nachname:", bold_format)
    worksheet.write("B4", last_name, unlocked_bordered_format)

    # Zeile 6: Hinweis
    worksheet.merge_range("A6:G6",
        "Bitte prüfen Sie die oben genannten Daten auf Korrektheit.\n"
        "Spalten A–D (grau) sind ab Zeile 8 nicht änderbar.\n"
        "Spalten E–G (weiß) können Sie ab Zeile 8 ausfüllen.\n\n"
        "Hinweis für Checkboxen: Mehrere Antworten je Zeile durch ALT+ENTER.\n"
        "Bitte jede Zeile mit Semikolon trennen/abschließen!",
        centered_bold_wrap
    )

    # Zeile 7
    worksheet.merge_range("A7:D7", "Nicht ausfüllen", merged_header_center)
    worksheet.merge_range("E7:G7", "Antworten anpassen", merged_header_center)

    # --------------------------------------------------
    # 5) Spaltenüberschriften in Zeile 8
    # --------------------------------------------------
    headers = [
        "Frage #",
        "Fragetext",
        "Antworttyp",
        "Antwortoptionen",
        "Ausgewählte Antwort(en)",
        "Freitext",
        "Zeitstempel mit Notiz",
    ]
    start_row = 7  # Zeile 8
    for col_num, header_text in enumerate(headers):
        worksheet.write(start_row, col_num, header_text, header_format)

    # --------------------------------------------------
    # 6) Spaltenbreiten/Format ab Zeile 8
    # --------------------------------------------------
    for col in range(0, 4):
        worksheet.set_column(col, col, 25, locked_bordered_format)  # A–D gesperrt
    for col in range(4, 7):
        worksheet.set_column(col, col, 35, unlocked_bordered_format)  # E–G entsperrt

    # --------------------------------------------------
    # 7) Fragen/Antworten aus form_response
    # --------------------------------------------------
    questions = form_response.form.questions.all()
    responses = form_response.responses or {}
    picker_selections = form_response.picker_selections or {}
    scale_values = form_response.scale_values or {}
    timestamps = form_response.timestamps or {}

    row = start_row + 1  # ab Zeile 9
    for idx, question in enumerate(questions, start=1):
        q_text = question.question_text or ""
        original_answer_type = question.option_type or "none"
        mapped_answer_type = answer_type_map.get(original_answer_type, original_answer_type)

        # Spalte D: Optionsliste (nur Anzeige)
        bullet_options = []
        if original_answer_type in ["checkbox", "dropdown"]:
            bullet_options = [opt.label for opt in question.options.all()]
        options_list = "\n".join(f"• {o}" for o in bullet_options)

        # Spalte E: Ausgewählte Antwort(en)
        if original_answer_type == "checkbox":
            # Mehrfachauswahl => Values in responses[f"{question.id}_{opt.id}"] = bool
            selected_opts = []
            for opt in question.options.all():
                key = f"{question.id}_{opt.id}"
                if responses.get(key):
                    selected_opts.append(opt.label)
            # semikolon-getrennte Darstellung
            user_answer = ";".join(selected_opts)

        elif original_answer_type == "dropdown":
            user_answer = picker_selections.get(str(question.id), "")
        elif original_answer_type == "scale":
            user_answer = str(scale_values.get(str(question.id), ""))
        else:
            user_answer = ""

        # Spalte F: Freitext
        if question.input_field_added:
            free_text_answer = responses.get(str(question.id), "")
        else:
            free_text_answer = "Keine Freitext-Antwort erforderlich"

        # Spalte G: Zeitstempel
        ts_entries = []
        if str(question.id) in timestamps:
            for i, ts_obj in enumerate(timestamps[str(question.id)], start=1):
                line = f"{i}) {ts_obj.get('timestamp', '')}"
                if ts_obj.get("note"):
                    line += f"\n   Notiz: {ts_obj['note']}"
                ts_entries.append(line)
        question_timestamps_str = "\n".join(ts_entries)

        # Zusammenbauen der Zeile
        row_data = [
            idx,                # Spalte A: Frage #
            q_text,             # Spalte B
            mapped_answer_type, # Spalte C
            options_list,       # Spalte D
            user_answer,        # Spalte E
            free_text_answer,   # Spalte F
            question_timestamps_str,  # Spalte G
        ]

        # Schreiben (ggf. gesperrt)
        for col_num, value in enumerate(row_data):
            if col_num == 4 and mapped_answer_type == "Keine":
                # Spalte E + "Keine" => gesperrt
                worksheet.write(row, col_num, "Keine Antwort erforderlich", locked_message_format)
            elif col_num == 5 and not question.input_field_added:
                # Spalte F + kein Freitext => gesperrt
                worksheet.write(row, col_num, "Keine Freitext-Antwort erforderlich", locked_freetext_format)
            else:
                worksheet.write(row, col_num, value)

        # Datenvalidierung in Spalte E
        if original_answer_type == "checkbox":
            worksheet.data_validation(row, 4, row, 4, {
                'validate': 'any',
                'input_title': 'Mehrfachauswahl möglich',
                'input_message': (
                    "Geben Sie mehrere Antworten ein.\n"
                    "Pro Antwort Zeilenumbruch (ALT+ENTER)\n"
                    "und trennen/enden Sie sie mit Semikolon."
                )
            })
        elif original_answer_type == "dropdown":
            source = bullet_options if bullet_options else ["(Keine Optionen vorhanden)"]
            worksheet.data_validation(row, 4, row, 4, {
                'validate': 'list',
                'source': source,
                'input_title': 'Mögliche Werte',
                'input_message': 'Wählen Sie genau eine Option aus.'
            })
        elif original_answer_type == "scale":
            worksheet.data_validation(row, 4, row, 4, {
                'validate': 'integer',
                'criteria': 'between',
                'minimum': 1,
                'maximum': 10,
                'input_title': 'Skala 1–10',
                'input_message': 'Bitte einen Wert zwischen 1 und 10 eingeben.'
            })
        # "none"/"image" => keine Data Validation

        row += 1

    last_question_row = row - 1

    # --------------------------------------------------
    # 8) Leerzeile & Allgemeine Notiz
    # --------------------------------------------------
    worksheet.set_row(row, 15, white_no_border)
    row += 1

    if form_response.note:
        worksheet.merge_range(row, 0, row, 6, "Allgemeine Notiz", bold_format)
        row += 1
        worksheet.merge_range(row, 0, row, 6, form_response.note, unlocked_bordered_format)
        row += 1

    note_ts = getattr(form_response, 'note_timestamps', []) or []
    if note_ts:
        worksheet.merge_range(row, 0, row, 6, "Zeitstempel zur allgemeinen Notiz", bold_format)
        row += 1
        lines = []
        for i, ts_obj in enumerate(note_ts, start=1):
            line = f"{i}) {ts_obj.get('timestamp', '')}"
            if ts_obj.get("note"):
                line += f"\n   Notiz: {ts_obj['note']}"
            lines.append(line)
        combined = "\n\n".join(lines)
        worksheet.merge_range(row, 0, row + 2, 6, combined, unlocked_bordered_format)
        row += 3

    # --------------------------------------------------
    # 9) Bedingte Formatierung (gelb), Spalte E & F – für leere Zellen
    # --------------------------------------------------
    if last_question_row >= 9:
        range_e = f"E9:E{last_question_row}"
        range_f = f"F9:F{last_question_row}"
        worksheet.conditional_format(
            range_e,
            {'type': 'blanks', 'format': workbook.add_format({'bg_color': '#FFFF00'})}
        )
        worksheet.conditional_format(
            range_f,
            {'type': 'blanks', 'format': workbook.add_format({'bg_color': '#FFFF00'})}
        )

    # --------------------------------------------------
    # 10) Anleitung-Worksheet bleibt leer
    # --------------------------------------------------
    guide_sheet.protect('')

    # --------------------------------------------------
    # 11) Hauptsheet schützen (Passwort "1234")
    # --------------------------------------------------
    worksheet.protect('1234', {'objects': True, 'scenarios': True})

    workbook.close()
    return file_path


# --------------------------------------------------
# 2) E-MAIL VERSAND
# --------------------------------------------------
def send_confirmation_email(form_response):
    """
    Sendet eine E-Mail mit angehängter Excel-Zusammenfassung.
    Enthält zusätzlichen Hinweis zu Bildern.
    
    Wenn observer_email == "unknown@observer", wird keine E-Mail gesendet.
    """
    if form_response.observer_email == "unknown@observer":
        # Stattdessen nur ein Log-Eintrag
        print("[INFO] send_confirmation_email: Kein Versand, da 'unknown@observer'.")
        return

    excel_file_path = generate_excel_file(form_response)

    hint_about_images = (
        "\n\nHinweis: Falls Sie Bilder zum Formular hinzugefügt haben, "
        "wurden diese bereits an die Senatsverwaltung übertragen. "
        "Sie müssen nicht erneut per Mail gesendet werden."
    )

    subject = "Ihre Formularantwort"
    message = (
        f"Hallo {form_response.observer_name},\n\n"
        f"vielen Dank für das Ausfüllen des Formulars \"{form_response.form.name}\". "
        f"Im Anhang finden Sie eine Zusammenfassung Ihrer Antworten.\n\n"
        f"Beste Grüße,\nIhr Team"
        + hint_about_images
    )

    email = EmailMessage(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [form_response.observer_email],
    )

    if excel_file_path:
        email.attach_file(excel_file_path)

    email.send()

    # Temporäre Datei entfernen
    if excel_file_path and os.path.exists(excel_file_path):
        os.remove(excel_file_path)
