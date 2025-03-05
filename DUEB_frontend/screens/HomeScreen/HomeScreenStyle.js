/**
 * Style-Definitionen für den HomeScreen der DÜB-Anwendung
 * Enthält Styles für Container, Karten, Buttons, Modals und weitere UI-Elemente
 * Definiert einheitliches Erscheinungsbild der Hauptseite mit responsivem Design
 */

import { StyleSheet, Dimensions } from 'react-native';

export default StyleSheet.create({
  // ------------------------------------------------
  // 1) Basis-Container und Layout
  // ------------------------------------------------
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  
  // ------------------------------------------------
  // 2) Card-Komponenten
  // ------------------------------------------------
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    marginBottom: 15,
  },
  
  // ------------------------------------------------
  // 3) Formular-Selektor und Admin-Buttons
  // ------------------------------------------------
  formSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  formSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  adminButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  createButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: '#28a745',
  },
  editButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#17a2b8',
  },
  deleteButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: '#dc3545',
  },
  navigateButton: {
    backgroundColor: '#007bff',
  },
  
  // ------------------------------------------------
  // 4) Kontakte und Bildergalerie
  // ------------------------------------------------
  contactList: {
    maxHeight: 250,
  },
  contactRow: {
    justifyContent: 'space-between',
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    marginBottom: 10,
    elevation: 2,
    maxWidth: '48%',
  },
  contactName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  generalInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  imageList: {
    maxHeight: 200,
  },
  imageItem: {
    marginRight: 15,
    width: 150,
    height: 180,
    justifyContent: 'flex-end',
  },
  thumbnailImage: {
    width: 150,
    height: 150,
    borderRadius: 5,
  },
  imageDescription: {
    marginBottom: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  
  // ------------------------------------------------
  // 5) Modale und Vollbild-Ansichten
  // ------------------------------------------------
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  fullscreenImageDescription: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOuterContainer: {
    flex: 1,
    backgroundColor: '#f1f3f6',
  },
  headerLarge: {
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerLargeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  // ------------------------------------------------
  // 6) Suchleiste und Ergebnisse
  // ------------------------------------------------
  introBox: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
    elevation: 2,
  },
  introBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#17a2b8',
  },
  introBoxDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#007bff',
    paddingHorizontal: 15,
    alignItems: 'center',
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resultsWrapper: {
    flex: 1,
    marginHorizontal: 15,
    marginBottom: 70,
  },
  resultsList: {
    marginTop: 8,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 20,
    fontSize: 15,
  },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    elevation: 2,
    position: 'relative',
  },
  resultItemContent: {
    // Klick-Bereich für das Formular
  },
  resultItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultItemHeaderText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4E4E4E',
  },
  resultItemCompleted: {
    borderLeftWidth: 6,
    borderLeftColor: '#28a745',
  },
  checkBoxBottomRight: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  checkboxLarge: {
    transform: [{ scale: 1.3 }],
  },
  footerContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    flexDirection: 'row',
  },
  footerButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginLeft: 10,
    elevation: 3,
  },
  footerButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },
  
  // ------------------------------------------------
  // 7) Gerätevorbereitung (Admin-Bereich)
  // ------------------------------------------------
  prepareButton: {
    backgroundColor: '#007bff',
    marginTop: 10,
  },
  preparationBoxSuccess: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  preparationBoxSuccessText: {
    color: '#155724',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  preparationBoxInProgress: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  preparationBoxInProgressText: {
    color: '#856404',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  // ------------------------------------------------
  // 8) Profilversand-Status
  // ------------------------------------------------
  sentProfilesReport: {
    marginTop: 15,
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  sentProfilesReportTitle: {
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 5,
  },
  sentProfilesReportDetails: {
    color: '#155724',
    marginBottom: 5,
  },
  sentProfilesReportMessage: {
    color: '#155724',
    fontStyle: 'italic',
  }
});
















