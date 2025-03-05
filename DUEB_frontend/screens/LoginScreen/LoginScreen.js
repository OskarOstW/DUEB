/**
 * Login Screen für die DÜB-Anwendung (Digitale Übungsbeobachtung)
 * Ermöglicht die Anmeldung als Admin (online) oder Observer (offline)
 * Prüft auf bestehende Authentifizierungs-Tokens und navigiert ggf. direkt zur Home-Seite
 */

// ------------------------------------------------
// 1) Importe
// ------------------------------------------------
import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';

import styles from './LoginScreenStyle';
import { BASE_URL } from './../../config';

const LoginScreen = ({ navigation, route }) => {
  // ------------------------------------------------
  // 2) State-Variablen
  // ------------------------------------------------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // ------------------------------------------------
  // 3) Effekt-Hooks
  // ------------------------------------------------
  // Bei Komponenten-Mount prüfen, ob bereits ein Token vorhanden ist
  // Falls ja, direkt zur Home-Seite weiterleiten ohne Login-Prozess
  useEffect(() => {
    AsyncStorage.getItem('userToken').then(token => {
      console.log("[DEBUG] LoginScreen: existing token in storage:", token);
      if (token) {
        navigation.replace('Home', { role: 'Admin' });
      }
    });
  }, [navigation]);

  // ------------------------------------------------
  // 4) Login-Funktion mit Online- und Offline-Pfad
  // ------------------------------------------------
  const handleLogin = async () => {
    try {
      // 4.1) Online-Login-Versuch als Admin mit Backend-Authentifizierung
      const response = await fetch(`${BASE_URL}/api/api-token-auth/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      console.log("[DEBUG] LoginScreen: Admin login response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[DEBUG] LoginScreen: Admin login success, token:", data.token);
        
        // Authentifizierungstoken für Session speichern
        await AsyncStorage.setItem('userToken', data.token);
        // Admin-Token separat speichern für spätere API-Zugriffe
        await AsyncStorage.setItem('adminToken', data.token);
        // Benutzernamen für Anzeige im Header speichern
        await AsyncStorage.setItem('currentAdminUsername', username);
        // E-Mail-Adresse speichern falls vorhanden
        if (data.email) {
          await AsyncStorage.setItem('currentAdminEmail', data.email);
        }
        
        // Beobachter-Konten vom Server abrufen und lokal speichern
        // (wichtig für späteren Offline-Modus)
        const observerResp = await fetch(`${BASE_URL}/api/observer-accounts/`, {
          headers: { Authorization: `Token ${data.token}` },
        });
        if (observerResp.ok) {
          const observerData = await observerResp.json();
          console.log("[DEBUG] LoginScreen: Fetched observer accounts:", observerData);
          await AsyncStorage.setItem('observerAccounts', JSON.stringify(observerData));
        }
        
        Alert.alert('Erfolg', 'Sie haben sich erfolgreich angemeldet!');
        navigation.replace('Home', { role: 'Admin' });
        return;
      } else {
        throw new Error("Admin login failed");
      }
    } catch (_) {
      // 4.2) Offline-Login-Versuch als Beobachter (Observer)
      // Wenn Online-Login fehlschlägt, wird versucht, lokal gespeicherte Beobachterkonten zu nutzen
      try {
        const storedObserversStr = await AsyncStorage.getItem('observerAccounts');
        console.log("[DEBUG] LoginScreen: observerAccounts from storage:", storedObserversStr);
        if (!storedObserversStr) {
          throw new Error("No observer accounts stored");
        }
        
        // Suche nach passendem Beobachterkonto in den gespeicherten Daten
        const observerAccounts = JSON.parse(storedObserversStr);
        const matchingObserver = observerAccounts.find(
          acc => acc.username === username && acc.password === password
        );
        if (!matchingObserver) {
          throw new Error("Kein passendes Observer-Konto gefunden");
        }
        
        // Aktuellen Beobachter für die Session speichern
        await AsyncStorage.setItem('currentObserverAccount', JSON.stringify(matchingObserver));
        // Observer-spezifischen Token setzen
        await AsyncStorage.setItem('userToken', 'observer');
        
        // Prüfen, ob ein zuvor gespeicherter Admin-Token für API-Anfragen verfügbar ist
        const adminToken = await AsyncStorage.getItem('adminToken');
        if (adminToken) {
          // Diesen Token für Observer-API-Anfragen verwenden
          await AsyncStorage.setItem('observerApiToken', adminToken);
          console.log("[DEBUG] LoginScreen: Using cached admin token for observer API access");
        } else {
          console.log("[DEBUG] LoginScreen: No admin token available for API requests");
        }
        
        console.log("[DEBUG] LoginScreen: Observer offline login success, dummy token set.");
        Alert.alert('Erfolg', 'Sie haben sich erfolgreich angemeldet!');
        navigation.replace('Home', { role: 'Observer' });
        return;
      } catch (offlineError) {
        console.log("[DEBUG] LoginScreen: Observer login error:", offlineError);
        Alert.alert('Fehler', 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
      }
    }
  };

  // ------------------------------------------------
  // 5) Rendering der Benutzeroberfläche
  // ------------------------------------------------
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Anmeldung</Text>
      <TextInput
        placeholder="Benutzername"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Anmelden</Text>
      </TouchableOpacity>
    </View>
  );
};

// ------------------------------------------------
// 6) PropTypes-Definitionen für Komponenten-Validierung
// ------------------------------------------------
LoginScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default LoginScreen;









