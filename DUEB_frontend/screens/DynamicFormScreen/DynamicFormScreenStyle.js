/**
 * DynamicFormScreenStyle.js
 * 
 * Stildefinitionen für die DynamicFormScreen-Komponente der DÜB-Anwendung.
 * Diese Datei enthält alle Styling-Informationen für das dynamische Formular,
 * einschließlich Layouts, Eingabefelder, Zeitstempel, Bildanzeige und Modals.
 * 
 * Die Styles sind nach funktionalen Bereichen gruppiert und folgen einem 
 * einheitlichen Designkonzept mit klaren visuellen Hierarchien und konsistenten 
 * Abständen, Farben und Rundungen.
 */

import { StyleSheet, Dimensions } from 'react-native';

// Bildschirmbreite für responsive Layouts
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ------------------------------------------------
  // 1) Grundlegende Layout- und Container-Stile
  // ------------------------------------------------
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  formHeader: {
    marginBottom: 20,
    padding: 10,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  formDescription: {
    fontSize: 18,
    color: '#666',
    textAlign: 'left',
    marginBottom: 20,
  },
  formDescriptionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  formDescriptionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  questionContainer: {
    borderWidth: 2,
    borderColor: '#aaa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 50,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  questionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },

  // ------------------------------------------------
  // 2) Formularelement-Stile (Inputs, Checkboxen, Slider)
  // ------------------------------------------------
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
    color: '#000',
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#000',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginVertical: 8,
    flex: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  labelContainer: {
    flex: 1,
    marginLeft: 8,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  checkboxGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    width: '100%',
  },
  picker: {
    width: '100%',
  },
  slider: {
    width: '100%',
  },
  scaleMarksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  scaleMarkLabel: {
    fontSize: 12,
  },
  
  // ------------------------------------------------
  // 3) Bild-Upload und Anzeigestile
  // ------------------------------------------------
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUploadText: {
    marginLeft: 5,
    color: '#000',
    fontSize: 16,
  },
  imagePreviewWrapper: {
    position: 'relative',
    margin: 5,
    width: '30%',
  },
  imagePreview: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 5,
  },
  imageDeleteButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 15,
  },
  imageNameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
    marginTop: 5,
    backgroundColor: '#fff',
    color: '#000',
    width: '100%',
  },
  
  // ------------------------------------------------
  // 4) Zeitstempel-Stile
  // ------------------------------------------------
  timestampDisplayContainer: {
    marginTop: 10,
  },
  timestampItem: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  timestampText: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  timestampNoteInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginTop: 5,
    backgroundColor: '#fff',
    color: '#000',
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
    color: 'white',
    marginLeft: 5,
  },
  timestampButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timestampEditButton: {
    backgroundColor: '#28a745',
    padding: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 5,
  },
  timestampEditButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  timestampRemoveButton: {
    backgroundColor: '#ff5c5c',
    padding: 5,
    borderRadius: 5,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestampRemoveButtonText: {
    color: 'white',
    marginLeft: 5,
  },

  // ------------------------------------------------
  // 5) Modal und Dialog-Stile
  // ------------------------------------------------
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTextHeader: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTextInput: {
    width: '100%',
    minHeight: 50,
    textAlign: 'left',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  modalSubmitButton: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalSubmitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },

  // ------------------------------------------------
  // 6) Button-Stile und Navigation
  // ------------------------------------------------
  saveButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    marginLeft: 10,
  },
  noteButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteButtonText: {
    color: 'white',
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  clearButton: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: 'blue',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
  },
  clearButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  submitButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#ff5c5c',
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  
  // ------------------------------------------------
  // 7) Navigation und Hilfselemente
  // ------------------------------------------------
  navigationButtonsContainer: {
    position: 'absolute',
    right: 15,
    top: '45%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 25,
    marginVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: 'purple',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonPatients: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    backgroundColor: 'purple',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    marginLeft: 10,
  },
  savingContainer: {
    position: 'absolute',
    bottom: 80,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: 'white',
    marginLeft: 10,
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
  hintText: {
    backgroundColor: '#ffffcc',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    fontStyle: 'italic',
    color: '#666',
  },
  hintPrefix: {
    fontWeight: 'bold',
  },

  // ------------------------------------------------
  // 8) Vollbild-Bildanzeige
  // ------------------------------------------------
  fullscreenImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    backgroundColor: 'black',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  fullscreenImageDescription: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  
  // ------------------------------------------------
  // 9) FAB und Aktionsmenü
  // ------------------------------------------------
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  actionMenuContainer: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'flex-start',
    width: 240,
  },
  actionMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  actionMenuButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    textAlign: 'left',
  },
  
  // ------------------------------------------------
  // 10) Suchmodal und Suchinterface
  // ------------------------------------------------
  searchModalView: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    alignSelf: 'stretch',
  },
  searchModalHeader: {
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  searchModalHint: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
    textAlign: 'left',
  },
  searchModalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    alignSelf: 'stretch',
    color: '#000',
  },
  searchModalButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 15,
    alignSelf: 'stretch',
  },
  searchModalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  searchModalCloseButton: {
    backgroundColor: '#ff5c5c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'stretch',
  },
  searchModalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default styles;






