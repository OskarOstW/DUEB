// App.js - Hauptkomponente der DÜB-Anwendung (Digitale Übungsbeobachtung)
// Stellt den Navigationscontainer und die grundlegende App-Struktur bereit
// mit einheitlichem Header, Anmeldestatus und Online-Status-Anzeige

// ------------------------------------------------
// 1) Importe
// ------------------------------------------------
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Provider as PaperProvider } from 'react-native-paper';

// Bildschirme (intern gleich, Anzeige-Titel ins Deutsche übersetzt)
import LoginScreen from './screens/LoginScreen/LoginScreen';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import FormEditorScreen from './screens/FormEditorScreen/FormEditorScreen';
import DynamicFormScreen from './screens/DynamicFormScreen/DynamicFormScreen';
import VictimProfileDetailScreen from './screens/VictimProfileDetailScreen/VictimProfileDetailScreen';

const Stack = createNativeStackNavigator();

// ------------------------------------------------
// 2) Header-Komponenten
// ------------------------------------------------
// Abmelde-Button – einheitlich mit größerer Schrift und gleichen Rahmen
const AbmeldeButton = ({ navigation }) => (
  <TouchableOpacity 
    onPress={() => handleAbmelden(navigation)}
    style={styles.logoutButton}
  >
    <Icon name="sign-out" size={20} color="#fff" style={{ marginRight: 5 }} />
    <Text style={styles.logoutButtonText}>Abmelden</Text>
  </TouchableOpacity>
);

const handleAbmelden = async (navigation) => {
  try {
    // Admin-Token für zukünftige Observer-Anfragen speichern
    const adminToken = await AsyncStorage.getItem('adminToken');
    
    // Alle relevanten Sitzungsdaten löschen
    await AsyncStorage.multiRemove([
      'userToken',
      'currentAdminUsername',
      'currentAdminEmail',
      'currentObserverAccount',
      'observerApiToken'
    ]);
    
    // Den Admin-Token wiederherstellen, wenn vorhanden
    if (adminToken) {
      await AsyncStorage.setItem('adminToken', adminToken);
      console.log('[DEBUG] Admin-Token für zukünftige Observer-Anfragen beibehalten');
    }
    
    navigation.replace('Login');
  } catch (error) {
    console.error('Fehler beim Abmelden:', error);
  }
};

// Anzeige "Angemeldet als" – in einem einheitlichen Box-Container
const AnmeldeStatus = () => {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const fetchUsername = async () => {
      const adminUsername = await AsyncStorage.getItem('currentAdminUsername');
      if (adminUsername) {
        setUsername(adminUsername);
      } else {
        const observerStr = await AsyncStorage.getItem('currentObserverAccount');
        if (observerStr) {
          const observer = JSON.parse(observerStr);
          setUsername(observer.username);
        } else {
          setUsername(null);
        }
      }
    };
    fetchUsername();
  }, []);

  return (
    <View style={styles.boxContainer}>
      <Icon name="user" size={20} color="#fff" style={{ marginRight: 5 }} />
      <Text style={styles.boxText}>
        Angemeldet als: {username ? username : 'Nicht angemeldet'}
      </Text>
    </View>
  );
};

// Anzeige "Online" oder "Offline" – ebenfalls in einer einheitlichen Box
const OnlineStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.boxContainer}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: isConnected ? '#28a745' : '#dc3545' },
        ]}
      />
      <Text style={styles.boxText}>
        {isConnected ? 'Online' : 'Offline'}
      </Text>
    </View>
  );
};

// ------------------------------------------------
// 3) Benutzerdefinierter Header
// ------------------------------------------------
// Neuer Header – zeigt den Seitentitel in einer Box (etwas weiter nach rechts) sowie "Angemeldet als" und "Online/Offline"
// Alle Elemente sind zentriert, einheitlich groß und mit Rahmen sowie leichtem Schatten versehen
const DeutscherHeader = ({ navigation, titel }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerCenter}>
        <View style={styles.titleContainer}>
          <Text style={styles.boxText}>{titel}</Text>
        </View>
        <AnmeldeStatus />
        <OnlineStatus />
      </View>
      <View style={styles.headerRight}>
        <AbmeldeButton navigation={navigation} />
      </View>
    </View>
  );
};

// Hilfsfunktion zur Definition der Screen-Optionen
const createScreenOptions = (navigation, titel) => ({
  header: () => <DeutscherHeader navigation={navigation} titel={titel} />,
});

// ------------------------------------------------
// 4) Hauptkomponente
// ------------------------------------------------
const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerLeft: () => null, // Entfernt den Zurück-Pfeil
          }}
        >
          {/* Login-Bildschirm ohne Header */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          {/* Übersetzte Titel – interne Namen bleiben unverändert */}
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={({ navigation }) => createScreenOptions(navigation, 'Hauptmenü')}
          />
          <Stack.Screen 
            name="FormEditorScreen"
            component={FormEditorScreen} 
            options={({ navigation }) => createScreenOptions(navigation, 'Formularbearbeitung')}
          />
          <Stack.Screen 
            name="DynamicFormScreen"
            component={DynamicFormScreen}
            options={({ navigation }) => createScreenOptions(navigation, 'Formular')}
          />
          <Stack.Screen
            name="VictimProfileDetailScreen"
            component={VictimProfileDetailScreen}
            options={({ navigation }) => createScreenOptions(navigation, 'Patientenbegleitbogen')}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;

// ------------------------------------------------
// 5) Styling
// ------------------------------------------------
const styles = StyleSheet.create({
  // Gesamter Header – etwas höher
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  // Der zentrale Bereich, in dem alle drei Boxen nebeneinander zentriert werden
  headerCenter: {
    flex: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  // Einheitliche Boxen für Titel, "Angemeldet als" und "Online/Offline"
  boxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0056b3',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#fff',
    // Leichter Schatten
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  // Der Titelcontainer soll ähnlich sein, mit etwas zusätzlichem Abstand nach rechts
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0056b3',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10, // Etwas mehr Abstand nach rechts
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  boxText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  // Abmelde-Button – einheitlich mit größerer Schrift und gleichen Abmessungen
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});






