/**
 * Style-Definitionen für den Login-Screen
 * Enthält Styles für Container, Titel, Eingabefelder und Anmelde-Button
 * Verwendet neutrale Farben mit blauem Akzent für den Login-Button
 */

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // ------------------------------------------------
  // 1) Container und Layout
  // ------------------------------------------------
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  
  // ------------------------------------------------
  // 2) Titel und Text-Elemente
  // ------------------------------------------------
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // ------------------------------------------------
  // 3) Eingabefelder für Benutzername und Passwort
  // ------------------------------------------------
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  
  // ------------------------------------------------
  // 4) Anmelde-Button
  // ------------------------------------------------
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
});