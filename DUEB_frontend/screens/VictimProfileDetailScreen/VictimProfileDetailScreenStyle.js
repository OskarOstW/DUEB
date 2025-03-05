// VictimProfileDetailScreenStyle.js - Stildefinitionen für den Patientenbegleitbogen
// Definiert alle visuellen Aspekte des VictimProfileDetailScreens einschließlich
// Farbschema, Layouts und UI-Komponenten-Styling

// ------------------------------------------------
// 1) Importe und Initialisierung
// ------------------------------------------------
import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

// ------------------------------------------------
// 2) Hilfsfunktionen
// ------------------------------------------------
/**
 * Bestimmt den Stil für die Sichtungskategorie-Box basierend auf der Kategorie.
 * Die Triage-Farben (rot/gelb/grün) werden beibehalten, da sie eine fachliche
 * Bedeutung haben.
 */
export function getSichtungBoxStyle(category) {
  if (!category) {
    return {
      backgroundColor: '#616161',
      borderColor: '#424242',
      textColor: '#fff'
    };
  }
  const catLower = category.toLowerCase();
  if (catLower.includes('sk 1') || catLower.includes('akute vitale bedrohung')) {
    return {
      backgroundColor: '#b71c1c',
      borderColor: '#7f0000',
      textColor: '#fff'
    };
  }
  if (catLower.includes('sk 2') || catLower.includes('schwer verletzt')) {
    return {
      backgroundColor: '#f9a825',
      borderColor: '#f57f17',
      textColor: '#fff'
    };
  }
  if (catLower.includes('sk 3') || catLower.includes('leicht verletzt')) {
    return {
      backgroundColor: '#2e7d32',
      borderColor: '#1b5e20',
      textColor: '#fff'
    };
  }
  return {
    backgroundColor: '#616161',
    borderColor: '#424242',
    textColor: '#fff'
  };
}

// ------------------------------------------------
// 3) Hauptstildeklarationen
// ------------------------------------------------
export default StyleSheet.create({
  // ------------------------------------------------
  // 3.1) Basis-Container
  // ------------------------------------------------
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },

  // ------------------------------------------------
  // 3.2) Header-Bereich
  // ------------------------------------------------
  headerContainer: {
    backgroundColor: '#007bff',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLabel: {
    color: '#fff',
    marginRight: 6,
    fontSize: 14,
  },
  headerInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
  },

  // Buttons im Header für Bestätigen und Bearbeiten
  confirmBtn: {
    backgroundColor: '#007bff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeRemoveButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ------------------------------------------------
  // 3.3) Hauptinhalt und Karten
  // ------------------------------------------------
  // Haupt-ScrollView
  scrollInner: {
    padding: 15,
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },

  // "Sichtungskategorie"-Box (SOLL)
  sichtungHighlightBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    alignItems: 'center',
  },
  sichtungHighlightTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  sichtungHighlightValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Diagnostische Angaben (Karte)
  diagnosisCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },

  // Abschnitt-Header
  sectionHeader: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  sectionHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  cardContent: {
    padding: 10,
  },
  labelLine: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  labelBold: {
    fontWeight: 'bold',
    color: '#333',
  },

  // Vital-Karte
  vitalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
    marginTop: 8,
    marginBottom: 4,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },
  vitalLabel: {
    fontSize: 14,
    color: '#333',
  },
  vitalValue: {
    fontWeight: 'bold',
    color: '#444',
  },

  // Karten (Ergebnis-Sichtung)
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 15,
    color: '#007bff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  pickerSelect: {
    backgroundColor: '#fff',
    borderRadius: 6,
  },

  // ------------------------------------------------
  // 3.4) Tabellen und Eingabefelder
  // ------------------------------------------------
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    paddingVertical: 6,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  th: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
    paddingLeft: 4,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tdBefund: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 2,
    fontSize: 13,
    color: '#333',
  },
  tdInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 2,
    flexWrap: 'wrap',
  },
  tdLocked: {
    backgroundColor: '#eee',
  },

  // Info & große Textfelder
  infoHint: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#777',
    marginBottom: 6,
  },
  bigInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ccc',
    minHeight: 60,
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    color: '#333',
  },

  actionButtonsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 100,
  },

  // ------------------------------------------------
  // 3.5) Buttons und Interaktionselemente
  // ------------------------------------------------
  // "+ Eintrag hinzufügen" Button
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  addRowText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },

  // Speichern & Verlassen (unten links)
  saveButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 16,
  },

  // "Bemerkung" oder "Notiz" Button
  noteButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 16,
  },

  navigationButtonsContainer: {
    position: 'absolute',
    right: 15,
    top: '45%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  navigationButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 25,
    marginVertical: 5,
  },

  // Suchen-Button
  searchButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#6f42c1',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 16,
  },

  // ------------------------------------------------
  // 3.6) Modals und Overlays
  // ------------------------------------------------
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTextInput: {
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    color: '#000',
    textAlignVertical: 'top',
  },
  modalTextHeader: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubmitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#f44336',
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  timestampButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 5,
  },
  timestampButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  collapseSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  collapseSwitchLabel: {
    marginRight: 10,
    fontSize: 14,
    color: '#666',
  },

  // Overlay beim Auto-Speichern
  savingContainer: {
    position: 'absolute',
    bottom: 80,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
  },

  // ------------------------------------------------
  // 3.7) Zusätzliche UI-Elemente
  // ------------------------------------------------
  // Untere Buttons
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
  },

  // Zusatzinformationen und Warnungen
  sectionInfoText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  limitWarning: {
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
    fontStyle: 'italic',
    fontSize: 14,
  },
});






















