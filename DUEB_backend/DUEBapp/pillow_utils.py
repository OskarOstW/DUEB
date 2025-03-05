# pillow_utils.py - Bildgenerierungsfunktionen für die DÜB-Anwendung
#
# Diese Datei enthält Hilfsfunktionen zur Erzeugung von Bilddateien mittels der Pillow-Bibliothek.
# Die Hauptfunktion generiert eine tabellarische Übersicht aller Patientenprofile eines Szenarios,
# die farblich nach Sichtungskategorien unterschieden werden.

import os
import random
import datetime
from django.conf import settings
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

def generate_overview_image(entries, scenario_name="Krankenhausübung", date_str="22.04.2024"):
    """
    Erzeugt ein Übersichtsbild mit einer Tabelle aller Patientenprofile eines Szenarios.
    
    Parameters:
        entries (list): Liste von Dictionaries mit Patientendaten
        scenario_name (str): Name des Übungsszenarios
        date_str (str/date): Datum der Übung als String oder Datetime-Objekt
    
    Returns:
        str: Relativer Pfad zur erzeugten Bilddatei
    """
    
    # ---------------------------------------------------
    # 1) INITIALISIERUNG DER SCHRIFTART
    # ---------------------------------------------------
    try:
        # Versuche, eine TrueType-Schriftart zu laden
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except:
        # Fallback auf die Standardschriftart, wenn die TrueType-Schrift nicht verfügbar ist
        font = ImageFont.load_default()

    # ---------------------------------------------------
    # 2) BILDABMESSUNGEN UND TABELLENSTRUKTUR
    # ---------------------------------------------------
    # Definition der Spalten und ihrer Breiten
    columns = ["Button-Nr.", "Profil-Nr", "Kategorie", "Diagnose", "Blickdiagnose", "PCZ"]
    col_widths = [120, 100, 200, 300, 300, 200]
    row_height = 40  
    header_height = 60

    # Berechnung der Gesamtbildgröße
    img_width = sum(col_widths) + 80  # Zusätzlicher Platz für Ränder
    img_height = header_height + row_height * (len(entries) + 1) + 50  # +1 für Überschriftenzeile, +50 für Fußzeile

    # Erzeugen eines neuen weißen Bildes mit den berechneten Dimensionen
    img = Image.new("RGB", (img_width, img_height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # ---------------------------------------------------
    # 3) SORTIERUNG DER EINTRÄGE NACH KATEGORIE UND BUTTON-NUMMER
    # ---------------------------------------------------
    def sort_key(entry):
        """
        Hilfsfunktion zur Sortierung der Einträge nach Sichtungskategorie und Button-Nummer.
        - Sortiert primär nach Kategorie (SK 1/SK 4 > SK 1 > SK 2 > SK 3)
        - Sortiert sekundär nach Button-Nummer, mit Sonderbehandlung für Buttons mit 'K' am Ende
        """
        cat = entry.get("category", "").strip()
        btn = entry.get("button_number", "")
       
        # Prioritäten-Mapping für die Sichtungskategorien
        # "SK 1/SK 4" und "SK 4" haben höchste Priorität (0)
        cat_priority = {
            "SK 1/SK 4": 0,
            "SK 4": 0,
            "SK 1": 1,
            "SK 1 (akute vitale Bedrohung)": 1,
            "SK 2": 2,
            "SK 2 (schwer verletzt)": 2,
            "SK 3": 3,
            "SK 3 (leicht verletzt)": 3
        }
       
        # Extrahiere Nummer aus button_number, mit Sonderbehandlung für Buttons mit 'K' am Ende
        try:
            clean_btn = ''.join(c for c in btn if c.isdigit() or (c == 'K' and btn.endswith('K')))
            if clean_btn.endswith('K'):
                # Buttons mit 'K' am Ende bekommen 0.5 hinzuaddiert für Sortierzwecke
                base_num = int(clean_btn[:-1])
                btn_num = base_num + 0.5
            else:
                btn_num = int(clean_btn)
        except:
            # Fallback für ungültige Button-Nummern
            btn_num = 999
           
        # Sortierkriterium: Tuple aus (Kategorie-Priorität, Button-Nummer)
        return (cat_priority.get(cat, 5), btn_num)
       
    # Sortiere die Einträge nach dem definierten Schlüssel
    entries = sorted(entries, key=sort_key)

    # ---------------------------------------------------
    # 4) ZEICHNEN DER KOPFZEILE UND SPALTENÜBERSCHRIFTEN
    # ---------------------------------------------------
    # Titel und Datum in der Kopfzeile
    draw.text((20, 10), scenario_name, fill=(0,0,0), font=font)
    
    # Formatierung des Datums, abhängig vom Eingabetyp
    if isinstance(date_str, datetime.date):
        formatted_date = date_str.strftime('%d.%m.%Y')
    else:
        formatted_date = date_str
    
    # Datum rechts ausrichten
    date_text = f"Datum der Übung: {formatted_date}"
    date_width = draw.textlength(date_text, font=font)
    draw.text((img_width - date_width - 20, 10), date_text, fill=(0,0,0), font=font)

    # Spaltenüberschriften
    x_offset = 20
    y_offset = header_height
    for i, col_name in enumerate(columns):
        draw.text((x_offset, y_offset), col_name, fill=(0,0,0), font=font)
        x_offset += col_widths[i]

    # Trennlinie unter den Spaltenüberschriften
    line_y = y_offset + row_height - 5
    draw.line((20, line_y, img_width-20, line_y), fill=(0,0,0), width=2)

    # ---------------------------------------------------
    # 5) ZEICHNEN DER DATENZEILEN MIT FARBKODIERUNG
    # ---------------------------------------------------
    y_offset += row_height
    for entry in entries:
        cat = entry.get("category", "").strip()
       
        # Hintergrundfarbe basierend auf Sichtungskategorie:
        # - SK 1/SK 4 und SK 4: Dunkelrot
        # - SK 1: Helleres Rot
        # - SK 2: Gelb
        # - SK 3: Grün
        # - Andere: Grau
        if cat in ["SK 1/SK 4", "SK 4"]:
            bg_color = (180, 0, 0)  # Dunkelrot
        elif cat.startswith("SK 1"):
            bg_color = (255, 150, 150)  # Helleres Rot
        elif "SK 2" in cat:
            bg_color = (255, 255, 150)  # Kräftiges Gelb
        elif "SK 3" in cat:
            bg_color = (150, 255, 150)  # Kräftiges Grün
        else:
            bg_color = (230, 230, 230)  # Standard-Grau

        # Zeichne Hintergrundrechteck für die Zeile
        draw.rectangle(
            (20, y_offset, img_width-20, y_offset + row_height),
            fill=bg_color,
            outline=(0, 0, 0),
            width=1
        )

        # Daten für die Zellen extrahieren
        row_data = [
            entry.get("button_number", ""),
            entry.get("profile_number", ""),
            cat,
            entry.get("diagnosis", ""),
            entry.get("visual", ""),
            entry.get("pcz", ""),
        ]

        # Zeichnen der Zelleninhalte mit Textumbruch
        x_off = 20
        for i, cell_text in enumerate(row_data):
            text = str(cell_text)
           
            # Berechne verfügbare Breite für den Text
            available_width = col_widths[i] - 10
           
            # Textumbruch implementieren
            words = text.split()
            lines = []
            current_line = []
            current_width = 0
           
            # Wörter auf Zeilen verteilen basierend auf verfügbarer Breite
            for word in words:
                word_width = draw.textlength(word + " ", font=font)
                if current_width + word_width <= available_width:
                    current_line.append(word)
                    current_width += word_width
                else:
                    if current_line:
                        lines.append(" ".join(current_line))
                    current_line = [word]
                    current_width = word_width
           
            # Letzte Zeile hinzufügen, falls vorhanden
            if current_line:
                lines.append(" ".join(current_line))

            # Zeichnen jeder Textzeile innerhalb der Zelle
            for idx, line in enumerate(lines):
                y_pos = y_offset + 5 + (idx * 15)
                # Sicherstellen, dass der Text in der Zeile bleibt
                if y_pos + 15 <= y_offset + row_height:
                    draw.text((x_off+5, y_pos), line, fill=(0,0,0), font=font)

            # Vertikale Trennlinien zwischen Spalten
            if i < len(col_widths)-1:
                x_line = x_off + col_widths[i]
                draw.line(
                    (x_line, y_offset, x_line, y_offset + row_height),
                    fill=(0,0,0),
                    width=1
                )
               
            x_off += col_widths[i]

        # Zur nächsten Zeile gehen
        y_offset += row_height

    # ---------------------------------------------------
    # 6) ZEITSTEMPEL UND SPEICHERUNG
    # ---------------------------------------------------
    # Aktuellen Zeitstempel hinzufügen
    draw.text(
        (20, img_height - 30),
        f"Erstellt am {timezone.now():%d.%m.%Y %H:%M}",
        fill=(128,128,128),
        font=font
    )

    # Formatierung des Datums für den Dateinamen
    if isinstance(date_str, datetime.date):
        date_filename = date_str.strftime('%d_%m_%Y')
    else:
        date_filename = date_str.replace('.', '_')

    # Generiere eindeutigen Dateinamen mit Zufallsnummer
    random_num = random.randint(1000, 9999)
    filename = f"uebersicht_{scenario_name}_{date_filename}_{random_num}.png".replace(" ", "_")
    save_path = os.path.join(settings.MEDIA_ROOT, "homescreen", filename)
    
    # Speichern des Bildes als PNG
    img.save(save_path, format="PNG")

    # Relativen Pfad zurückgeben für die Datenbankverknüpfung
    relative_path = os.path.join("homescreen", filename)
    return relative_path