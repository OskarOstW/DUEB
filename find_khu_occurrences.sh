#!/bin/bash

# Skript zum Auffinden aller "KHU"-Vorkommen im Projekt
# Erstellt: $(date)
# Verwendung: Im WinfProjekt-Verzeichnis ausführen

# Ausgabedatei für die Ergebnisse
OUTPUT_FILE="khu_occurrences.txt"
echo "Suche nach 'KHU'-Vorkommen im Projekt. Ergebnisse werden in $OUTPUT_FILE gespeichert."

# Lösche die Ausgabedatei, falls sie bereits existiert
rm -f "$OUTPUT_FILE"

# Header für die Ausgabedatei
echo "=== Vorkommen von 'KHU' im Projekt ===" > "$OUTPUT_FILE"
echo "Erstellt am: $(date)" >> "$OUTPUT_FILE"
echo "===========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Funktion zum Durchsuchen von Dateien, aber node_modules und venv ausschließen
find_occurrences() {
    # 1. Suche nach "KHU" in Dateinamen (case-sensitive)
    echo "=== KHU in Datei- und Verzeichnisnamen ===" >> "$OUTPUT_FILE"
    find . -type f -o -type d | grep -v "node_modules\|venv\|\.git" | grep "KHU" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    # 2. Suche nach "KHU" in Textdateien (case-sensitive)
    echo "=== KHU in Dateiinhalten ===" >> "$OUTPUT_FILE"
    find . -type f -not -path "*/node_modules/*" -not -path "*/venv/*" -not -path "*/.git/*" | 
    while read -r file; do
        # Überspringe Binärdateien
        if file "$file" | grep -q "text"; then
            # Suche nach "KHU" im Dateiinhalt
            matches=$(grep -n "KHU" "$file" 2>/dev/null)
            if [ -n "$matches" ]; then
                echo "Datei: $file" >> "$OUTPUT_FILE"
                echo "$matches" | while read -r line; do
                    line_num=$(echo "$line" | cut -d: -f1)
                    content=$(echo "$line" | cut -d: -f2-)
                    echo "  Zeile $line_num: $content" >> "$OUTPUT_FILE"
                done
                echo "" >> "$OUTPUT_FILE"
            fi
        fi
    done

    # 3. Suche auch nach "khu" (kleingeschrieben) in Textdateien
    echo "=== khu (kleingeschrieben) in Dateiinhalten ===" >> "$OUTPUT_FILE"
    find . -type f -not -path "*/node_modules/*" -not -path "*/venv/*" -not -path "*/.git/*" | 
    while read -r file; do
        # Überspringe Binärdateien
        if file "$file" | grep -q "text"; then
            # Suche nach "khu" im Dateiinhalt
            matches=$(grep -n "khu" "$file" 2>/dev/null)
            if [ -n "$matches" ]; then
                echo "Datei: $file" >> "$OUTPUT_FILE"
                echo "$matches" | while read -r line; do
                    line_num=$(echo "$line" | cut -d: -f1)
                    content=$(echo "$line" | cut -d: -f2-)
                    echo "  Zeile $line_num: $content" >> "$OUTPUT_FILE"
                done
                echo "" >> "$OUTPUT_FILE"
            fi
        fi
    done
    
    # 4. Hinweise für Django-spezifische Dateien
    echo "=== Wichtige Django-Dateien für manuelle Prüfung ===" >> "$OUTPUT_FILE"
    find . -name "settings.py" -o -name "urls.py" -o -name "wsgi.py" -o -name "asgi.py" -o -name "manage.py" -o -name "apps.py" | 
    grep -v "node_modules\|venv" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    # 5. Hinweise für React-Native-spezifische Dateien
    echo "=== Wichtige React-Native-Dateien für manuelle Prüfung ===" >> "$OUTPUT_FILE"
    find . -name "app.json" -o -name "package.json" -o -name "config.js" | 
    grep -v "node_modules\|venv" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

# Führe die Suche durch
find_occurrences

# Zusammenfassung
total_occurrences=$(grep -c "Zeile" "$OUTPUT_FILE")
echo "=== Zusammenfassung ===" >> "$OUTPUT_FILE"
echo "Insgesamt $total_occurrences Vorkommen von 'KHU' gefunden." >> "$OUTPUT_FILE"
echo "Bitte überprüfen Sie alle Fundstellen sorgfältig vor der Umbenennung." >> "$OUTPUT_FILE"
echo "Achten Sie besonders auf Django-Migrationen und Datenbankbezüge." >> "$OUTPUT_FILE"

echo "Suche abgeschlossen. $total_occurrences Vorkommen gefunden."
echo "Vollständige Ergebnisse in $OUTPUT_FILE"