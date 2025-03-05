/**
 * FormEditorScreenStyle.js
 * 
 * Stildefinitionen für die FormEditorScreen-Komponente der DÜB-Anwendung.
 * Diese Datei enthält alle Styling-Informationen für den Formular-Editor,
 * der es Administratoren ermöglicht, neue Formulare zu erstellen und bestehende
 * zu bearbeiten. Definiert Stile für Eingabefelder, Fragenbereiche, Optionen
 * und interaktive Elemente wie Buttons und Checkboxen.
 */

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // ------------------------------------------------
  // 1) Grundlegende Container und Layout-Stile
  // ------------------------------------------------
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'black',
    padding: 15,
    borderRadius: 5,
  },
  formLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  
  // ------------------------------------------------
  // 2) Eingabefelder und Formularelemente
  // ------------------------------------------------
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  additionalInfoInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  hintInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    marginVertical: 5,
    borderRadius: 5,
  },
  
  // ------------------------------------------------
  // 3) Fragen-Container und Antwortoptionen
  // ------------------------------------------------
  questionContainer: {
    borderWidth: 2,
    borderColor: 'black',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
  },
  questionHeader: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionComponentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  optionSymbol: {
    marginRight: 10,
  },
  
  // ------------------------------------------------
  // 4) Button-Stile und interaktive Elemente
  // ------------------------------------------------
  deleteButton: {
    padding: 5,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 5,
  },
  addButtonText: {
    color: 'white',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addQuestionButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 20,
  },
  addQuestionButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  rightAlignDeleteButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff5c5c',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullQuestionDeleteButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  
  // ------------------------------------------------
  // 5) Spezielle Komponenten: Skala und Bildupload
  // ------------------------------------------------
  imageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  imageDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff5c5c',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  imageDeleteButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  scaleContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  scaleNumbersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  scaleNumberContainer: {
    alignItems: 'center',
  },
  scaleNumber: {
    fontSize: 16,
  },
  scaleDeleteButton: {
    backgroundColor: '#ff5c5c',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDeleteButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  
  // ------------------------------------------------
  // 6) Hilfe-Bereich und Footer-Elemente
  // ------------------------------------------------
  infoIconContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 10,
    color: 'green',
    fontSize: 16,
  },
});

export default styles;