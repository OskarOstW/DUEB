/**
 * HomeScreen - Hauptkomponente der DÜB-Anwendung (Digitale Übungsbeobachtung)
 * Dient als zentrale Steuerungseinheit für Administratoren und Beobachter
 * Bietet Zugriff auf Formulare, Patientenprofile, Kontakte und Bildergalerie
 * Enthält rollenbasierte Funktionen (Admin: Gerätevorbereitung, Observer: eingeschränkte Rechte)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Dimensions,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Title, Button, Card, Portal, Provider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import styles from './HomeScreenStyle';
import { BASE_URL } from './../../config';
import DynamicFormQuickSearch from '../DynamicFormScreen/DynamicFormQuickSearch';

const HomeScreen = ({ route, navigation }) => {
  // ------------------------------------------------
  // 1) State-Variablen
  // ------------------------------------------------
  const role = route.params?.role || 'Observer';

  // A) Formular-Liste und Suche
  const [forms, setForms] = useState([]);
  const [displayedForms, setDisplayedForms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormName, setSelectedFormName] = useState('');
  const [formSelectorVisible, setFormSelectorVisible] = useState(false);
  const [completedForms, setCompletedForms] = useState({});

  // B) Profil-Suche
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // C) Kontakte & Bilder
  const [contacts, setContacts] = useState([]);
  const [images, setImages] = useState([]);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // D) Status zum Senden von Profilen
  const [isSendingProfiles, setIsSendingProfiles] = useState(false);
  const [sentProfilesReport, setSentProfilesReport] = useState(null);

  const flatListRef = useRef(null);
  const { width } = Dimensions.get('window');

  // E) Gerätevorbereitung (nur für Admin)
  const [lastPreparedTime, setLastPreparedTime] = useState(null);
  const [preparationState, setPreparationState] = useState('IDLE');
  const [scenarioName, setScenarioName] = useState(null);
  
  // Status-Variablen für internes Caching (nicht sichtbar für Benutzer)
  const [isCachingProfiles, setIsCachingProfiles] = useState(false);
  const [cachedProfilesCount, setCachedProfilesCount] = useState(0);
  const [totalProfilesCount, setTotalProfilesCount] = useState(0);

  // ------------------------------------------------
  // 2) Lifecycle / Effekt-Hooks
  // ------------------------------------------------
  // Wird beim Fokussieren des Screens aufgerufen, lädt Formulare je nach Rolle
  useFocusEffect(
    React.useCallback(() => {
      if (role === 'Observer') {
        setPreparationState('IDLE');
      }
      const fetchForms = async () => {
        const netInfo = await NetInfo.fetch();
        if (role === 'Admin' && netInfo.isConnected) {
          await loadForms();
        } else {
          await loadFormsFromStorage();
        }
      };
      fetchForms();
    }, [role])
  );

  // Kontakte und Bilder beim Initialisieren laden
  useEffect(() => {
    const loadContactsAndImages = async () => {
      if (role === 'Admin') {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          await fetchAndStoreContactsAndImages();
        } else {
          await loadContactsFromStorage();
          await loadImagesFromStorage();
        }
      } else {
        await loadContactsFromStorage();
        await loadImagesFromStorage();
      }
    };
    loadContactsAndImages();
  }, [role]);

  // Erweiterter Daten-Sync mit verbessertem Profil-Caching
  useEffect(() => {
    const syncDataFromBackend = async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        try {
          const token = await AsyncStorage.getItem('userToken');
          
          // Sync victim profiles
          const victimResp = await fetch(`${BASE_URL}/api/victim-profiles/`, {
            headers: token ? { Authorization: `Token ${token}` } : {},
          });
          if (victimResp.ok) {
            const victimData = await victimResp.json();
            await AsyncStorage.setItem('victimProfiles', JSON.stringify(victimData));
          }
          
          // Sync test scenario victims (including button numbers)
          await syncTestScenarioVictims(token);
          
          // Automatisches Caching aller Profile (für Admin und Observer)
          // Dies stellt sicher, dass alle Profile für beide Rollen offline verfügbar sind
          await cacheAllProfilesForOfflineUse(token);
        } catch (err) {
          console.log('[HomeScreen] Fehler beim Sync der Daten:', err);
        }
      }
    };
    syncDataFromBackend();
  }, [role]);

  // Lade Vorbereitungszeit, Szenarioname und abgeschlossene Formulare
  useEffect(() => {
    const loadPrepTime = async () => {
      try {
        const stored = await AsyncStorage.getItem('lastExercisePrep');
        if (stored) setLastPreparedTime(stored);
      } catch (err) {
        console.log('[HomeScreen] Fehler beim Laden von lastExercisePrep:', err);
      }
    };
    loadPrepTime();

    if (role === 'Admin') {
      fetchScenarioName();
    }

    const loadCompletedForms = async () => {
      try {
        const stored = await AsyncStorage.getItem('completedForms');
        if (stored) {
          setCompletedForms(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Fehler beim Laden completedForms:', err);
      }
    };
    loadCompletedForms();
  }, [role]);

  // Aktualisierung der angezeigten Formulare bei Änderung der Suchkriterien
  useEffect(() => {
    handleFilterForms(searchQuery);
  }, [forms, searchQuery]);

  // ------------------------------------------------
  // 3) TestScenarioVictims und Offline-Caching
  // ------------------------------------------------
  // Synchronisiert TestScenarioVictims mit dem Server und erstellt eine lokale Mapping-Tabelle
  const syncTestScenarioVictims = async (token) => {
    if (!token) {
      token = await AsyncStorage.getItem('userToken');
    }
    
    try {
      // Fetcht alle TestScenarioVictims (die Button-Nummern enthalten)
      const response = await fetch(`${BASE_URL}/api/test-scenario-victims/`, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      
      if (response.ok) {
        const scenarioVictimsData = await response.json();
        
        // 1. Speichere die kompletten Daten mit Button-Nummern
        await AsyncStorage.setItem('testScenarioVictims', JSON.stringify(scenarioVictimsData));
        
        // 2. Erstelle eine Button-zu-Profil-Zuordnung für schnellen Offline-Zugriff
        const buttonToProfileMap = {};
        
        // Iteriere durch alle Szenario-Opfer und erstelle die Zuordnung
        for (const victim of scenarioVictimsData) {
          if (victim.button_number && victim.victim_profile_data) {
            // Speichere die vollständigen Profildaten mit der Button-Nummer als Schlüssel
            buttonToProfileMap[victim.button_number] = {
              ...victim.victim_profile_data,
              button_number: victim.button_number,
              scenarioVictimId: victim.id,
              victim_profile: victim.victim_profile
            };
          }
        }
        
        // Speichere die Zuordnung für den schnellen Offline-Zugriff
        await AsyncStorage.setItem('buttonToProfileMap', JSON.stringify(buttonToProfileMap));
        console.log('[HomeScreen] Button-to-Profile mapping created for offline use');
      } else {
        console.log('[HomeScreen] Failed to sync test scenario victims. Status:', response.status);
      }
    } catch (err) {
      console.log('[HomeScreen] Error syncing test scenario victims:', err);
    }
  };

  // Verbesserte Funktion für das Caching aller Profildaten - für Offline-Nutzung
  const cacheAllProfilesForOfflineUse = async (token) => {
    if (!token) {
      token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('[HomeScreen] Kein Token für Profil-Caching gefunden');
        return;
      }
    }
    
    try {
      setIsCachingProfiles(true);
      setCachedProfilesCount(0);
      
      // 1. Hole alle Testszenario-Opfer mit Button-Nummern
      const scenarioVictimsStr = await AsyncStorage.getItem('testScenarioVictims');
      let scenarioVictims = [];
      
      if (!scenarioVictimsStr) {
        // Wenn nicht im Cache, direkt vom Server holen
        const scenarioResp = await fetch(`${BASE_URL}/api/test-scenario-victims/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        if (!scenarioResp.ok) {
          throw new Error('Fehler beim Laden der Testszenario-Opfer');
        }
        
        scenarioVictims = await scenarioResp.json();
        await AsyncStorage.setItem('testScenarioVictims', JSON.stringify(scenarioVictims));
      } else {
        scenarioVictims = JSON.parse(scenarioVictimsStr);
      }
      
      // Für alle Profildetails laden und cachen
      setTotalProfilesCount(scenarioVictims.length);
      
      // Button-to-Profile-Map für besseren Offline-Zugriff
      const buttonToProfileMap = {};
      const offlineVictimProfiles = [];
      
      for (let i = 0; i < scenarioVictims.length; i++) {
        const victim = scenarioVictims[i];
        const buttonNumber = victim.button_number;
        const profileId = victim.victim_profile;
        
        if (buttonNumber && profileId) {
          try {
            // Detailliertes Profil laden
            const profileResp = await fetch(`${BASE_URL}/api/victim-profiles/${profileId}/`, {
              headers: { Authorization: `Token ${token}` }
            });
            
            if (profileResp.ok) {
              const fullProfile = await profileResp.json();
              
              // 1. Speichere im Button-zu-Profil-Mapping
              buttonToProfileMap[buttonNumber] = {
                ...fullProfile,
                button_number: buttonNumber,
                scenarioVictimId: victim.id,
                victim_profile: profileId
              };
              
              // 2. Speichere in offlineVictimProfiles
              offlineVictimProfiles.push({
                ...victim,
                fullProfile,
                // Achtung: Stellen Sie sicher, dass die Profildaten VOLLSTÄNDIG sind
                // Ergänze wichtige Felder die für die Detail-Ansicht notwendig sind
                category: fullProfile.category || victim.victim_profile_data?.category || '',
                diagnosis: fullProfile.diagnosis || victim.victim_profile_data?.diagnosis || '',
                visual_diagnosis: fullProfile.visual_diagnosis || victim.victim_profile_data?.visual_diagnosis || '',
                findings: fullProfile.findings || victim.victim_profile_data?.findings || '',
                symptoms: fullProfile.symptoms || victim.victim_profile_data?.symptoms || '',
                gcs: fullProfile.gcs || victim.victim_profile_data?.gcs || '',
                sys_rr: fullProfile.sys_rr || victim.victim_profile_data?.sys_rr || '',
                spo2: fullProfile.spo2 || victim.victim_profile_data?.spo2 || '',
                ekg_monitor: fullProfile.ekg_monitor || victim.victim_profile_data?.ekg_monitor || '',
                rekap: fullProfile.rekap || victim.victim_profile_data?.rekap || '',
                resp_rate: fullProfile.resp_rate || victim.victim_profile_data?.resp_rate || '',
                hb_value: fullProfile.hb_value || victim.victim_profile_data?.hb_value || ''
              });
              
              // 3. Initialisiere ein leeres Detail-Profil zur Bearbeitung
              await initializeEmptyProfileDetailsIfNeeded(buttonNumber, profileId, fullProfile);
            }
          } catch (error) {
            console.error(`[HomeScreen] Fehler beim Laden des Profils ${profileId}:`, error);
            
            // Fallback: Verwende vorhandene Daten aus victim_profile_data
            if (victim.victim_profile_data) {
              buttonToProfileMap[buttonNumber] = {
                ...victim.victim_profile_data,
                button_number: buttonNumber,
                scenarioVictimId: victim.id,
                victim_profile: profileId
              };
              
              offlineVictimProfiles.push({
                ...victim,
                fullProfile: victim.victim_profile_data
              });
              
              await initializeEmptyProfileDetailsIfNeeded(buttonNumber, profileId, victim.victim_profile_data);
            }
          }
        }
        
        setCachedProfilesCount(i + 1);
      }
      
      // Speichere all diese Daten für den Offline-Zugriff
      await AsyncStorage.setItem('buttonToProfileMap', JSON.stringify(buttonToProfileMap));
      await AsyncStorage.setItem('offlineVictimProfiles', JSON.stringify(offlineVictimProfiles));
      
      console.log(`[HomeScreen] ${offlineVictimProfiles.length} Profile für Offline-Zugriff gecacht`);
      
      return { buttonToProfileMap, offlineVictimProfiles };
    } catch (error) {
      console.error('[HomeScreen] Fehler beim Cachen der Profile:', error);
    } finally {
      setIsCachingProfiles(false);
    }
  };
  
  // Hilfsfunktion zum Initialisieren eines leeren Profil-Detail-Datensatzes
  const initializeEmptyProfileDetailsIfNeeded = async (buttonNumber, profileId, fullProfile) => {
    const existingKey = `VictimProfileDetail_${buttonNumber}`;
    const existingData = await AsyncStorage.getItem(existingKey);
    
    // Nur initialisieren, wenn noch kein Datensatz existiert
    if (!existingData) {
      try {
        // Vorbereitung der Sichtungsdaten
        const sichtungData = [
          { id: 's1', place: 'Grün', verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
          { id: 's2', place: 'Gelb', verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
          { id: 's3', place: 'Rot',  verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
          { id: 's4', place: 'Schockraum', verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
        ];
        
        // Vorbereitung der Diagnostikdaten
        const diagnostikData = [
          {
            id: 'd1',
            place: 'EKG Monitoring',
            verletztenkatalog: fullProfile?.ekg_monitor || '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 'd2',
            place: 'Rö-Thorax',
            verletztenkatalog: fullProfile?.ro_thorax || '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 'd3',
            place: 'Fast-Sono',
            verletztenkatalog: fullProfile?.fast_sono || '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 'd4',
            place: 'E-Fast',
            verletztenkatalog: fullProfile?.e_fast || '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 'd5',
            place: 'CT',
            verletztenkatalog: fullProfile?.radiology_finds || '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          }
        ];
        
        // OP-Felder zusammenbauen
        const opAchri = (fullProfile?.op_achi_res || '').trim().toUpperCase();
        const opUchi = (fullProfile?.op_uchi_res || '').trim().toUpperCase();
        const opNchi = (fullProfile?.op_nchi_res || '').trim().toUpperCase();

        const opValuesRaw = [
          opAchri === 'N' ? '' : fullProfile?.op_achi_res,
          opUchi === 'N' ? '' : fullProfile?.op_uchi_res,
          opNchi === 'N' ? '' : fullProfile?.op_nchi_res
        ];
        const opValues = opValuesRaw.filter((val) => val && val.trim() !== '');
        const opVerletztenkatalog = opValues.join(' / ');

        // ITS-Logik
        const itsPlatz = (fullProfile?.icu_place || '').trim().toUpperCase();
        const beatmung = (fullProfile?.ventilation_place || '').trim().toUpperCase();

        let itsMitBeatmung = '';
        let itsOhneBeatmung = '';
        if (itsPlatz === 'N') {
          itsMitBeatmung = '';
          itsOhneBeatmung = '';
        } else {
          if (beatmung === 'J') {
            itsMitBeatmung = 'Ja';
          } else if (beatmung === 'N') {
            itsOhneBeatmung = 'Ja';
          } else {
            itsMitBeatmung = beatmung;
          }
        }
        
        // Vorbereitung der Therapiedaten
        const therapieData = [
          {
            id: 't1',
            place: 'Not-OP',
            verletztenkatalog: fullProfile?.emergency_op || '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 't2',
            place: 'OP',
            verletztenkatalog: opVerletztenkatalog,
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 't3',
            place: 'Aufwachraum',
            verletztenkatalog: '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 't4',
            place: 'Pacu',
            verletztenkatalog: '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 't5',
            place: 'ITS mit Beatmung',
            verletztenkatalog: itsMitBeatmung,
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 't6',
            place: 'ITS ohne Beatmung',
            verletztenkatalog: itsOhneBeatmung,
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          },
          {
            id: 't7',
            place: 'Normalstation',
            verletztenkatalog: '',
            tatsaechlicheBehandlung: '',
            von: '',
            bis: ''
          }
        ];
        
        // Initialisiere den Datensatz mit vorgefüllten Daten aus dem Profil
        const emptyDetailData = {
          buttonNumber,
          profileId,
          khInterneNummer: '',
          isKhNumLocked: false,
          ergebnisSichtung: 'SK I',
          isErgebnisSichtungLocked: false,
          sichtungData,
          sichtungLocked: false,
          diagnostikData,
          diagnostikLocked: false,
          therapieData,
          therapieLocked: false,
          opTeamList: [],
          verlaufseintraege: [],
          lastSaved: new Date().toISOString()
        };
      
        // Speichere den vorbereiteten Datensatz für die Offline-Bearbeitung
        await AsyncStorage.setItem(existingKey, JSON.stringify(emptyDetailData));
        console.log(`[HomeScreen] Leeres Profil-Detail für Button ${buttonNumber} initialisiert`);
      } catch (error) {
        console.error(`[HomeScreen] Fehler beim Initialisieren des leeren Profils ${buttonNumber}:`, error);
      }
    }
  };

  // ------------------------------------------------
  // 4) Funktionen zum Laden von Daten
  // ------------------------------------------------
  // Lädt Formulare vom Server (für Admin)
  const loadForms = async () => {
    const API_URL = `${BASE_URL}/api/forms/`;
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      await loadFormsFromStorage();
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      const resp = await fetch(API_URL, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) throw new Error('Fehler beim Abrufen der Formularliste.');

      const formsList = await resp.json();
      // Detaildaten abrufen
      const detailed = await Promise.all(
        formsList.map(async (f) => {
          const dResp = await fetch(`${API_URL}${f.id}/`, {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!dResp.ok) return null;
          return dResp.json();
        })
      );
      const filteredForms = detailed.filter((ff) => ff != null);
      // Lokal speichern
      await AsyncStorage.setItem('detailedFormsData', JSON.stringify(filteredForms));

      if (role === 'Admin') {
        const arr = formsList.map((f) => ({ label: f.name, value: f.name, id: f.id }));
        setForms(arr);
        setSelectedFormName(arr[0]?.name || '');
      } else {
        const currentObserverStr = await AsyncStorage.getItem('currentObserverAccount');
        const currentObserver = currentObserverStr ? JSON.parse(currentObserverStr) : null;
        if (currentObserver) {
          const observerForms = filteredForms.filter((ff) =>
            currentObserver.allowed_forms.includes(ff.id)
          );
          const arr = observerForms.map((ff) => ({ label: ff.name, value: ff.name, id: ff.id }));
          setForms(arr);
          setSelectedFormName(arr[0]?.name || '');
        } else {
          setForms([]);
          setSelectedFormName('');
        }
      }
    } catch (error) {
      Alert.alert('Fehler', `Formulardaten konnten nicht geladen werden: ${error.message}`);
    }
  };

  // Lädt Formulare aus dem lokalen Speicher
  const loadFormsFromStorage = async () => {
    const storedFormsData = await AsyncStorage.getItem('detailedFormsData');
    if (storedFormsData) {
      const formsData = JSON.parse(storedFormsData);
      if (role === 'Admin') {
        const arr = formsData.map((f) => ({ label: f.name, value: f.name, id: f.id }));
        setForms(arr);
        setSelectedFormName(arr[0]?.name || '');
      } else {
        const currentObserverStr = await AsyncStorage.getItem('currentObserverAccount');
        const currentObserver = currentObserverStr ? JSON.parse(currentObserverStr) : null;
        if (currentObserver) {
          const observerForms = formsData.filter((f) =>
            currentObserver.allowed_forms.includes(f.id)
          );
          const arr = observerForms.map((f) => ({ label: f.name, value: f.name, id: f.id }));
          setForms(arr);
          setSelectedFormName(arr[0]?.name || '');
        } else {
          setForms([]);
          setSelectedFormName('');
        }
      }
    } else {
      setForms([]);
      setSelectedFormName('');
    }
  };

  // Lädt Kontakte aus dem lokalen Speicher
  const loadContactsFromStorage = async () => {
    try {
      const storedContacts = await AsyncStorage.getItem('storedContacts');
      if (storedContacts) setContacts(JSON.parse(storedContacts));
      else setContacts([]);
    } catch (err) {
      console.error('[HomeScreen] Fehler beim Laden der Kontakte:', err);
    }
  };

  // Lädt Bilder aus dem lokalen Speicher
  const loadImagesFromStorage = async () => {
    try {
      const storedImages = await AsyncStorage.getItem('storedImages');
      if (storedImages) setImages(JSON.parse(storedImages));
      else setImages([]);
    } catch (err) {
      console.error('[HomeScreen] Fehler beim Laden der Bilder:', err);
    }
  };

  // Lädt Kontakte und Bilder vom Server und speichert sie lokal
  const fetchAndStoreContactsAndImages = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      // Kontakte abrufen
      const contactsResp = await fetch(`${BASE_URL}/api/contacts/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (contactsResp.ok) {
        const fetchedContacts = await contactsResp.json();
        setContacts(fetchedContacts);
        await AsyncStorage.setItem('storedContacts', JSON.stringify(fetchedContacts));
      }

      // Bilder abrufen
      const imagesResp = await fetch(`${BASE_URL}/api/images/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (imagesResp.ok) {
        const fetchedImages = await imagesResp.json();
        setImages(fetchedImages);
        await AsyncStorage.setItem('storedImages', JSON.stringify(fetchedImages));
      }
    } catch (err) {
      console.error('[HomeScreen] Fehler beim Laden von Kontakte/Bilder (online):', err);
      await loadContactsFromStorage();
      await loadImagesFromStorage();
    }
  };

  // Lädt den Szenarionamen vom Server (für Admin)
  const fetchScenarioName = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const resp = await fetch(`${BASE_URL}/api/test-scenarios/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const scenario = data[0];
          setScenarioName(scenario.name || 'Unbenanntes Szenario');
        } else {
          setScenarioName(null);
        }
      } else {
        setScenarioName(null);
      }
    } catch (err) {
      console.log('[HomeScreen] Fehler beim Laden des Test-Szenarios:', err);
      setScenarioName(null);
    }
  };

  // ------------------------------------------------
  // 5) Formular-Suche/Filter und Bearbeitung
  // ------------------------------------------------
  // Filtert Formulare basierend auf der Sucheingabe
  const handleFilterForms = (query) => {
    if (!query.trim()) {
      setDisplayedForms(forms);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = forms.filter((f) => f.label.toLowerCase().includes(lower));
    setDisplayedForms(filtered);
  };

  // Markiert ein Formular als abgeschlossen
  const toggleCompletedForForm = async (formId) => {
    const newCompleted = { ...completedForms };
    newCompleted[formId] = !newCompleted[formId];
    setCompletedForms(newCompleted);
    try {
      await AsyncStorage.setItem('completedForms', JSON.stringify(newCompleted));
    } catch (err) {
      console.error('Fehler beim Speichern completedForms:', err);
    }
  };

  // ------------------------------------------------
  // 6) Gerät vorbereiten (Admin-Funktion)
  // ------------------------------------------------
  // Hauptfunktion zur Gerätevorbereitung mit Bestätigungsdialog
  const handlePrepareDevice = async () => {
    try {
      // Bestätigungsdialog anzeigen
      Alert.alert(
        'Gerät vorbereiten',
        'Möchten Sie das Gerät für die nächste Übung vorbereiten? Sie werden anschließend ausgeloggt.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Fortfahren', onPress: async () => await prepareDeviceAndLogout() }
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error('[HomeScreen] Fehler bei Vorbereitung:', err);
      Alert.alert('Fehler', `Gerät konnte nicht vorbereitet werden: ${err.message}`);
      setPreparationState('IDLE');
    }
  };

  // Vollständige Gerätevorbereitung mit Datenlöschung und -neuladen
  const prepareDeviceAndLogout = async () => {
    try {
      setPreparationState('IN_PROGRESS');
      
      // Token sichern für API-Anfragen während des Vorgangs
      const token = await AsyncStorage.getItem('userToken');
      // Den Admin-Token separat speichern, um ihn später wiederherzustellen
      const adminToken = await AsyncStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Kein gültiges Auth-Token gefunden');
      }
      
      // Prüfen, ob eine Netzwerkverbindung besteht
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('Keine Netzwerkverbindung verfügbar');
      }
      
      console.log("[DEBUG] Starte Gerätevorbereitung...");
      
      // 1. Aktuelle Daten vom Backend laden und temporär speichern
      const backendData = await fetchAllDataFromBackend(token);
      
      // 2. Alle lokalen Daten löschen, aber den adminToken übergeben
      await clearAllLocalData(adminToken);
      
      // 3. Die frisch geladenen Daten für den nächsten Benutzer speichern
      await saveBaseDataForNextUser(backendData);
      
      // 4. Vollständiges Caching aller Profildetails
      await cacheAllProfileDetailsFromBackendData(backendData, token);
      
      // Zeitstempel der Vorbereitung speichern
      const now = new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      await AsyncStorage.setItem('lastExercisePrep', now);
      
      // Den Admin-Token wiederherstellen für spätere Observer-API-Anfragen
      if (adminToken) {
        await AsyncStorage.setItem('adminToken', adminToken);
        console.log('[DEBUG] Admin-Token für zukünftige Observer-API-Anfragen wiederhergestellt');
      }
      
      // 5. Ausloggen
      setPreparationState('COMPLETED');
      
      // Erfolgsmeldung anzeigen und dann zur Login-Seite navigieren
      Alert.alert(
        'Gerät vorbereitet',
        'Das Gerät wurde erfolgreich für die nächste Übung vorbereitet. Sie werden nun ausgeloggt.',
        [{ 
          text: 'OK', 
          onPress: () => navigation.replace('Login')
        }]
      );
      
    } catch (err) {
      console.error('[HomeScreen] Fehler bei Vorbereitung:', err);
      Alert.alert('Fehler', `Gerät konnte nicht vorbereitet werden: ${err.message}`);
      setPreparationState('IDLE');
    }
  };

  // Lädt alle Daten vom Backend für die Offline-Vorbereitung
  const fetchAllDataFromBackend = async (token) => {
    try {
      console.log("[DEBUG] Lade Daten vom Backend...");
      
      // Parallelisierte API-Anfragen für bessere Performance
      const [
        formsResp,
        contactsResp,
        imagesResp,
        observerResp,
        victimProfilesResp,
        scenariosResp,
        scenarioVictimsResp
      ] = await Promise.all([
        fetch(`${BASE_URL}/api/forms/`, {
          headers: { Authorization: `Token ${token}` }
        }),
        fetch(`${BASE_URL}/api/contacts/`, {
          headers: { Authorization: `Token ${token}` }
        }),
        fetch(`${BASE_URL}/api/images/`, {
          headers: { Authorization: `Token ${token}` }
        }),
        fetch(`${BASE_URL}/api/observer-accounts/`, {
          headers: { Authorization: `Token ${token}` }
        }),
        fetch(`${BASE_URL}/api/victim-profiles/`, {
          headers: { Authorization: `Token ${token}` }
        }),
        fetch(`${BASE_URL}/api/test-scenarios/`, {
          headers: { Authorization: `Token ${token}` }
        }),
        fetch(`${BASE_URL}/api/test-scenario-victims/`, {
          headers: { Authorization: `Token ${token}` }
        })
      ]);
      
      // Detaildaten der Formulare abrufen
      const formsList = await formsResp.json();
      const formDetails = await Promise.all(
        formsList.map(async (f) => {
          const dResp = await fetch(`${BASE_URL}/api/forms/${f.id}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          return dResp.ok ? dResp.json() : null;
        })
      );
      
      // Alle Profildaten mit vollständigen Details abrufen
      const victimProfiles = await victimProfilesResp.json();
      const scenarioVictims = await scenarioVictimsResp.json();
      
      // Vollständige Profildaten für jedes Opfer abrufen (für Offline-Zugriff)
      const fullVictimProfilesData = await Promise.all(
        victimProfiles.map(async (profile) => {
          try {
            const profileResp = await fetch(`${BASE_URL}/api/victim-profiles/${profile.id}/`, {
              headers: { Authorization: `Token ${token}` }
            });
            return profileResp.ok ? profileResp.json() : profile;
          } catch (error) {
            console.error(`[HomeScreen] Fehler beim Laden des Profils ${profile.id}:`, error);
            return profile;
          }
        })
      );
      
      // Alle Daten in einem Objekt zusammenfassen
      return {
        forms: formDetails.filter(f => f !== null),
        contacts: await contactsResp.json(),
        images: await imagesResp.json(),
        observers: await observerResp.json(),
        victimProfiles: victimProfiles,
        fullVictimProfilesData: fullVictimProfilesData.filter(p => p !== null),
        scenarios: await scenariosResp.json(),
        scenarioVictims: scenarioVictims
      };
      
    } catch (err) {
      console.error('[HomeScreen] Fehler beim Laden der Backend-Daten:', err);
      throw new Error('Fehler beim Laden der Daten vom Server');
    }
  };

  // Löscht alle lokalen Daten, behält aber den Admin-Token bei
  const clearAllLocalData = async (adminToken) => {
    try {
      console.log("[DEBUG] Lösche alle lokalen Daten...");
      
      // Admin-Token zwischenspeichern, falls übergeben
      if (!adminToken) {
        adminToken = await AsyncStorage.getItem('adminToken');
        console.log("[DEBUG] Gespeicherter Admin-Token wurde gefunden und wird beibehalten");
      }
      
      // Zunächst alle Schlüssel holen
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Spezifische Schlüssel für Profildaten identifizieren
      const profileKeys = allKeys.filter(key => 
        key.startsWith('VictimProfileDetail_') || 
        key === 'buttonToProfileMap' ||
        key === 'offlineVictimProfiles' ||
        key === 'profileStates' ||
        key === 'victimProfiles' ||
        key === 'fullVictimProfilesData' ||
        key === 'testScenarioVictims'
      );
      
      // Diese kritischen Schlüssel zuerst explizit löschen
      if (profileKeys.length > 0) {
        await AsyncStorage.multiRemove(profileKeys);
      }
      
      // Dann alles löschen - nun kontrollierter
      await AsyncStorage.clear();
      
      // Admin-Token wiederherstellen, falls vorhanden
      if (adminToken) {
        await AsyncStorage.setItem('adminToken', adminToken);
        console.log("[DEBUG] Admin-Token nach dem Löschen wiederhergestellt");
      }
      
      // Zur Sicherheit überprüfen, ob noch andere Schlüssel vorhanden sind
      const remainingKeys = await AsyncStorage.getAllKeys();
      if (remainingKeys.length > 1 || (remainingKeys.length === 1 && remainingKeys[0] !== 'adminToken')) {
        console.warn("[WARNING] Nach dem Löschen sind noch unerwartete Schlüssel vorhanden:", remainingKeys);
        // Alle Schlüssel außer adminToken entfernen
        const keysToRemove = remainingKeys.filter(key => key !== 'adminToken');
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
      }
      
      return true;
    } catch (err) {
      console.error('[HomeScreen] Fehler beim Löschen der lokalen Daten:', err);
      throw new Error('Fehler beim Zurücksetzen der lokalen Daten');
    }
  };

  // Speichert Basisdaten für den nächsten Benutzer
  const saveBaseDataForNextUser = async (data) => {
    try {
      console.log("[DEBUG] Speichere Basisdaten für nächsten Benutzer...");
      
      // Alle Daten speichern, die für den nächsten Benutzer benötigt werden
      await AsyncStorage.setItem('detailedFormsData', JSON.stringify(data.forms));
      await AsyncStorage.setItem('storedContacts', JSON.stringify(data.contacts));
      await AsyncStorage.setItem('storedImages', JSON.stringify(data.images));
      await AsyncStorage.setItem('observerAccounts', JSON.stringify(data.observers));
      await AsyncStorage.setItem('victimProfiles', JSON.stringify(data.victimProfiles));
      await AsyncStorage.setItem('fullVictimProfilesData', JSON.stringify(data.fullVictimProfilesData));
      await AsyncStorage.setItem('testScenarioVictims', JSON.stringify(data.scenarioVictims));
      
      // VERBESSERTE BUTTON-ZU-PROFIL-ZUORDNUNG mit vollständigen Profildaten
      const buttonToProfileMap = {};
      
      for (const victim of data.scenarioVictims) {
        if (victim.button_number && victim.victim_profile) {
          // Suche detailliertes Profil in den vollständigen Daten
          const fullProfile = data.fullVictimProfilesData.find(
            p => p.id === victim.victim_profile
          );
          
          if (fullProfile) {
            // Speichere das vollständige Profil im Button-Map
            buttonToProfileMap[victim.button_number] = {
              ...fullProfile,
              button_number: victim.button_number,
              scenarioVictimId: victim.id,
              victim_profile: victim.victim_profile
            };
          } else {
            // Fallback: Nehme victim_profile_data aus dem ScenarioVictim
            buttonToProfileMap[victim.button_number] = {
              ...(victim.victim_profile_data || {}),
              button_number: victim.button_number,
              scenarioVictimId: victim.id,
              victim_profile: victim.victim_profile
            };
          }
        }
      }
      
      await AsyncStorage.setItem('buttonToProfileMap', JSON.stringify(buttonToProfileMap));
      
      // Initialisiere leere Datensätze für den nächsten Benutzer
      await AsyncStorage.setItem('profileStates', JSON.stringify({}));
      await AsyncStorage.setItem('completedForms', JSON.stringify({}));
      
      console.log(`[HomeScreen] ${Object.keys(buttonToProfileMap).length} Profile für Offline-Zugriff vorbereitet`);
      
      return true;
    } catch (err) {
      console.error('[HomeScreen] Fehler beim Speichern der Basisdaten:', err);
      throw new Error('Fehler beim Speichern der Daten für den nächsten Benutzer');
    }
  };

  // Cached Profildetails aus den Backend-Daten
  const cacheAllProfileDetailsFromBackendData = async (backendData, token) => {
    try {
      console.log("[DEBUG] Cache vollständige Profildetails für Offline-Zugriff...");
      
      const offlineVictimProfiles = [];
      
      // Zähle die Anzahl der zu cachenden Profile für den Fortschritt
      setTotalProfilesCount(backendData.scenarioVictims.length);
      setCachedProfilesCount(0);
      setIsCachingProfiles(true);
      
      // Für jedes Profil im Szenario
      for (let i = 0; i < backendData.scenarioVictims.length; i++) {
        const victim = backendData.scenarioVictims[i];
        if (!victim.button_number || !victim.victim_profile) continue;
        
        // Suche das vollständige Profil in den bereits geladenen Daten
        const fullProfile = backendData.fullVictimProfilesData.find(
          p => p.id === victim.victim_profile
        );
        
        if (fullProfile) {
          // Offline speichern für spätere Verwendung
          offlineVictimProfiles.push({
            ...victim,
            fullProfile
          });
          
          // Erstelle auch ein leeres Detail-Profil zur Bearbeitung
          await initializeEmptyProfileDetailsIfNeeded(victim.button_number, victim.victim_profile, fullProfile);
        } else {
          // Falls nicht gefunden, versuche es direkt vom Server zu laden
          try {
            const profileResp = await fetch(`${BASE_URL}/api/victim-profiles/${victim.victim_profile}/`, {
              headers: { Authorization: `Token ${token}` }
            });
            
            if (profileResp.ok) {
              const profileData = await profileResp.json();
              offlineVictimProfiles.push({
                ...victim,
                fullProfile: profileData
              });
              
              // Erstelle auch ein leeres Detail-Profil zur Bearbeitung
              await initializeEmptyProfileDetailsIfNeeded(victim.button_number, victim.victim_profile, profileData);
            }
          } catch (error) {
            console.error(`[HomeScreen] Fehler beim Laden des Profils ${victim.victim_profile}:`, error);
            
            // Fallback: Verwende vorhandene Daten aus victim_profile_data
            if (victim.victim_profile_data) {
              offlineVictimProfiles.push({
                ...victim,
                fullProfile: victim.victim_profile_data
              });
              
              await initializeEmptyProfileDetailsIfNeeded(victim.button_number, victim.victim_profile, victim.victim_profile_data);
            }
          }
        }
        
        setCachedProfilesCount(i + 1);
      }
      
      // Speichere alle Profile für Offline-Zugriff
      await AsyncStorage.setItem('offlineVictimProfiles', JSON.stringify(offlineVictimProfiles));
      
      console.log(`[HomeScreen] ${offlineVictimProfiles.length} Profile vollständig für Offline-Zugriff gecacht`);
      
    } catch (error) {
      console.error('[HomeScreen] Fehler beim Cachen aller Profildetails:', error);
    } finally {
      setIsCachingProfiles(false);
    }
  };

  // ------------------------------------------------
  // 7) Admin-Aktionen für Formulare
  // ------------------------------------------------
  // Navigation zum ausgewählten Formular
  const navigateToForm = () => {
    if (selectedFormName) {
      navigation.navigate('DynamicFormScreen', { formName: selectedFormName, role });
    } else {
      Alert.alert('Fehler', 'Bitte wähle ein Formular aus.');
    }
  };

  // Formular löschen (Platzhalter-Funktion)
  const deleteForm = () => {
    if (!selectedFormName) {
      Alert.alert('Fehler', 'Bitte wähle zuerst ein Formular aus.');
      return;
    }
    Alert.alert(
      'Formular löschen',
      `Möchtest du das Formular "${selectedFormName}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          onPress: () => {
            Alert.alert('Hinweis', 'Diese Delete-Funktion ist aktuell nur als Platzhalter implementiert.');
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Formular bearbeiten
  const editForm = () => {
    if (!selectedFormName) {
      Alert.alert('Fehler', 'Bitte wähle ein Formular zum Bearbeiten aus.');
      return;
    }
    const sel = forms.find((f) => f.value === selectedFormName);
    if (sel && sel.id) {
      navigation.navigate('FormEditorScreen', { formId: sel.id, mode: 'edit', role });
    } else {
      Alert.alert('Fehler', 'Formular nicht gefunden.');
    }
  };

  // ------------------------------------------------
  // 8) Patienten-Profile senden
  // ------------------------------------------------
  const handleSendVictimProfiles = async () => {
    Alert.alert(
      "Bestätigung",
      "Möchtest du die als 'in Bearbeitung' und 'fertig' markierten Profile absenden?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Absenden",
          onPress: async () => {
            setIsSendingProfiles(true);
            setSentProfilesReport(null);
  
            try {
              // Observer / Admin-Daten laden
              let observerAccountStr = await AsyncStorage.getItem('currentObserverAccount');
              let observerAccount = null;
  
              if (observerAccountStr) {
                try {
                  observerAccount = JSON.parse(observerAccountStr);
                } catch (e) {
                  console.log('[DEBUG] Fehler beim Parsen des Observer-Accounts:', e);
                }
              }
              if (!observerAccount) {
                const adminUsername = await AsyncStorage.getItem('currentAdminUsername');
                const adminEmail = await AsyncStorage.getItem('currentAdminEmail') || 'admin@domain.tld';
                observerAccount = {
                  first_name: adminUsername || 'Admin',
                  last_name: '',
                  email: adminEmail
                };
                console.log('[DEBUG] Admin-Fallback-Account erstellt:', observerAccount);
              }
  
              // profileStates laden
              const profileStatesStr = await AsyncStorage.getItem('profileStates');
              const profileStates = profileStatesStr ? JSON.parse(profileStatesStr) : {};
  
              // ButtonNumbers herausfiltern
              const filteredButtonNumbers = Object.keys(profileStates).filter(btn => {
                const st = profileStates[btn];
                return st === 'inProgress' || st === 'done';
              });
              if (filteredButtonNumbers.length === 0) {
                Alert.alert("Hinweis", "Keine Profile sind als 'in Bearbeitung' oder 'fertig' markiert.");
                setIsSendingProfiles(false);
                return;
              }
  
              console.log("[DEBUG] Gefundene ButtonNumbers:", filteredButtonNumbers);
  
              // offlineProfiles laden
              const offlineProfilesStr = await AsyncStorage.getItem('offlineVictimProfiles');
              const offlineProfiles = offlineProfilesStr ? JSON.parse(offlineProfilesStr) : [];
  
              const profileDataArray = [];
              const validProfileMappings = [];
  
              for (const btn of filteredButtonNumbers) {
                const key = `VictimProfileDetail_${btn}`;
                const storedDataStr = await AsyncStorage.getItem(key);
                if (!storedDataStr) continue;
  
                const storedData = JSON.parse(storedDataStr);
                let victimProfileId = storedData.profileId;
  
                // Falls profileId nicht da, versuche Fallback in offlineProfiles
                if (!victimProfileId) {
                  const matchOff = offlineProfiles.find(x => x.button_number === btn);
                  if (matchOff && matchOff.victim_profile) {
                    victimProfileId = matchOff.victim_profile;
                  } else {
                    // Generiere hilfsweise ID
                    let prefix = btn.charAt(0);
                    let number = btn.substring(1);
                    let prefixValue = prefix.charCodeAt(0);
                    victimProfileId = `${prefixValue}${number}`;
                  }
                }
  
                const cleanup = arr => {
                  if (!Array.isArray(arr)) return [];
                  return arr.map(({ id, locked, ...rest }) => rest);
                };
  
                const observerName = storedData.observerName ||
                  `${observerAccount.first_name || ''} ${observerAccount.last_name || ''}`.trim();
                const observerEmail = storedData.observerEmail ||
                  (observerAccount.email || 'unknown@observer');
  
                // Hier werden jetzt auch die automatisch geladenen Daten aus storedData extrahiert
                const cleanProfile = {
                  button_number: btn,
                  kh_intern: storedData.khInterneNummer || '',
                  ist_sichtung: storedData.ergebnisSichtung || '',
                  sichtung_data: cleanup(storedData.sichtungData),
                  diagnostik_data: cleanup(storedData.diagnostikData),
                  therapie_data: cleanup(storedData.therapieData),
                  op_team: cleanup(storedData.opTeamList),
                  verlauf: cleanup(storedData.verlaufseintraege),
                  observer_name: observerName,
                  observer_email: observerEmail,
                  
                  // Neu: Automatisch geladene Daten aus storedData übernehmen
                  soll_sichtung: storedData.sichtungskategorieSoll || '',
                  
                  // Diagnostische Angaben als JSON
                  diagnostic_loaded: {
                    diagnose: storedData.diagnoseSoll || '',
                    blickdiagnose: storedData.blickdiagnoseSoll || '',
                    befund: storedData.befundSoll || '',
                    symptome: storedData.symptomeSoll || ''
                  },
                  
                  // Vitalparameter als JSON
                  vitalwerte: {
                    gcs: storedData.vitalGCS || '',
                    spo2: storedData.vitalSpO2 || '',
                    rekap: storedData.vitalRekap || '',
                    sys_rr: storedData.vitalSysRR || '',
                    ekg: storedData.vitalEKG || '',
                    af: storedData.vitalAF || '',
                    hb: storedData.vitalHb || ''
                  }
                };
                profileDataArray.push(cleanProfile);
  
                validProfileMappings.push({
                  buttonNumber: btn,
                  victimProfileId: String(victimProfileId),
                  profileNumber: btn
                });
              }
  
              if (profileDataArray.length === 0) {
                Alert.alert("Fehler", "Keine vollständigen Profildaten gefunden.");
                setIsSendingProfiles(false);
                return;
              }
  
              console.log(`[DEBUG] Sende ${validProfileMappings.length} Profile...`);
  
              // Token-Handling für Observer
              let token = await AsyncStorage.getItem('userToken');
              if (role === 'Observer') {
                // Für Observer den Admin-Token verwenden, falls verfügbar
                const adminToken = await AsyncStorage.getItem('adminToken');
                if (adminToken) {
                  token = adminToken;
                  console.log('[DEBUG] Verwende Admin-Token für Observer-API-Anfrage');
                } else {
                  console.log('[DEBUG] Kein Admin-Token gefunden, API-Anfrage wird wahrscheinlich fehlschlagen');
                }
              }
  
              const response = await fetch(`${BASE_URL}/api/send-victimprofiles/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Token ${token}`,
                },
                body: JSON.stringify({
                  profile_mapping: validProfileMappings,
                  profile_data: profileDataArray,
                  observer_account: observerAccount,
                }),
              });
  
              if (response.ok) {
                const responseData = await response.json();
                const reportData = {
                  total: profileDataArray.length,
                  successful: responseData.profiles_count || profileDataArray.length,
                  message: responseData.message || 'Profile wurden erfolgreich gesendet.',
                  details: `${responseData.profiles_count || profileDataArray.length} Profile wurden an ${observerAccount.email} gesendet.`
                };
                setSentProfilesReport(reportData);
  
                Alert.alert(
                  "Erfolg",
                  `${reportData.successful} von ${reportData.total} Profilen wurden erfolgreich gesendet.\n\n${reportData.details}`
                );
              } else {
                let errorMessage = "Fehler beim Senden der Profile.";
                try {
                  const errorData = await response.json();
                  if (errorData.error) {
                    errorMessage = errorData.error;
                  }
                } catch (e) {
                  console.error("Konnte Fehlerantwort nicht parsen:", e);
                }
                Alert.alert("Fehler", errorMessage);
              }
            } catch (e) {
              let errorMsg = "Beim Senden der Profile ist ein Fehler aufgetreten.";
              if (e.message) {
                errorMsg += "\n\nDetails: " + e.message;
              }
              Alert.alert("Fehler", errorMsg);
              console.error("Fehler beim Senden der Profile:", e);
            } finally {
              setIsSendingProfiles(false);
            }
          }
        }
      ]
    );
  };

  // ------------------------------------------------
  // 9) Rendering - Hauptkomponente
  // ------------------------------------------------
  return (
    <Provider>
      <FlatList
        data={[]}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
              <Title style={styles.headerTitle}>Digitale Übungsbeobachtung (DÜB)</Title>
            </View>

            {/* NUR ADMIN: GERÄTEVORBEREITUNG */}
            {role === 'Admin' && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.title}>
                    {scenarioName
                      ? `Gerät auf die Übung "${scenarioName}" vorbereiten`
                      : 'Gerät auf Übung vorbereiten (keine Übung gefunden)'}
                  </Title>
                  <Text style={{ marginBottom: 10 }}>
                    Zuletzt vorbereitet: {lastPreparedTime ? lastPreparedTime : 'Noch nie'}
                  </Text>

                  {preparationState === 'COMPLETED' && (
                    <View style={styles.preparationBoxSuccess}>
                      <Text style={styles.preparationBoxSuccessText}>
                        Gerät ist bereit für die Übung
                        {scenarioName ? ` "${scenarioName}"` : ''}.
                      </Text>
                    </View>
                  )}

                  {preparationState === 'IN_PROGRESS' && (
                    <View style={styles.preparationBoxInProgress}>
                      <Text style={styles.preparationBoxInProgressText}>
                        Gerät wird vorbereitet ...
                      </Text>
                    </View>
                  )}

                  <Button
                    icon="refresh"
                    mode="contained"
                    onPress={handlePrepareDevice}
                    style={styles.prepareButton}
                    loading={preparationState === 'IN_PROGRESS'}
                    disabled={preparationState === 'IN_PROGRESS'}
                  >
                    Gerät für nächste Übung vorbereiten
                  </Button>
                </Card.Content>
              </Card>
            )}

            {/* FORMULAR-AUSWAHL */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.title}>Formular auswählen</Title>

                <TouchableOpacity
                  style={styles.formSelector}
                  onPress={() => setFormSelectorVisible(true)}
                >
                  <Text style={styles.formSelectorText}>
                    {selectedFormName || 'Bitte Formular auswählen'}
                  </Text>
                  {selectedFormName ? (
                    (() => {
                      const selectedForm = forms.find((f) => f.value === selectedFormName);
                      if (selectedForm && completedForms[selectedForm.id]) {
                        return <Icon name="check-circle" size={20} color="green" />;
                      }
                      return <Icon name="chevron-down" size={20} />;
                    })()
                  ) : (
                    <Icon name="chevron-down" size={20} />
                  )}
                </TouchableOpacity>

                {role === 'Admin' && (
                  <View style={styles.adminButtonGroup}>
                    <Button
                      icon="plus"
                      mode="contained"
                      onPress={() =>
                        navigation.navigate('FormEditorScreen', { mode: 'create', role })
                      }
                      style={styles.createButton}
                    >
                      Formular erstellen
                    </Button>
                    <Button
                      icon="pencil"
                      mode="contained"
                      onPress={editForm}
                      style={styles.editButton}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      icon="delete"
                      mode="contained"
                      onPress={deleteForm}
                      style={styles.deleteButton}
                    >
                      Löschen
                    </Button>
                  </View>
                )}

                <Button
                  icon="arrow-right"
                  mode="contained"
                  onPress={navigateToForm}
                  style={styles.navigateButton}
                >
                  Zum Formular
                </Button>
              </Card.Content>
            </Card>

            {/* PATIENTENPROFILE */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.title}>Patientenprofile</Title>
                <Button
                  icon="magnify"
                  mode="contained"
                  onPress={() => setProfileModalVisible(true)}
                  style={styles.navigateButton}
                >
                  Profile suchen
                </Button>
                
                <Button
                  icon={isSendingProfiles ? undefined : "send"}
                  mode="contained"
                  onPress={handleSendVictimProfiles}
                  style={[styles.navigateButton, { marginTop: 10 }]}
                  disabled={isSendingProfiles}
                >
                  {isSendingProfiles ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#fff' }}>Sende Profile...</Text>
                    </View>
                  ) : (
                    "Profile senden"
                  )}
                </Button>

                {sentProfilesReport && (
                  <View style={styles.sentProfilesReport}>
                    <Text style={styles.sentProfilesReportTitle}>Status des letzten Sendevorgangs:</Text>
                    <Text style={styles.sentProfilesReportDetails}>
                      {sentProfilesReport.successful} von {sentProfilesReport.total} Profilen erfolgreich gesendet.
                    </Text>
                    <Text style={styles.sentProfilesReportMessage}>{sentProfilesReport.details}</Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* KONTAKTE */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.title}>Kontakte</Title>
                {contacts.length > 0 ? (
                  <FlatList
                    data={contacts}
                    keyExtractor={(item, index) =>
                      item.id ? item.id.toString() : index.toString()
                    }
                    renderItem={({ item }) => (
                      <View style={styles.contactCard}>
                        <Text style={styles.contactName}>
                          {item.first_name} {item.last_name}
                        </Text>
                        <Text style={styles.contactEmail}>Email: {item.email}</Text>
                        <Text style={styles.contactPhone}>Telefon: {item.phone_number}</Text>
                        {item.general_info ? (
                          <Text style={styles.generalInfo}>{item.general_info}</Text>
                        ) : null}
                      </View>
                    )}
                    numColumns={2}
                    columnWrapperStyle={styles.contactRow}
                    showsVerticalScrollIndicator={false}
                    style={styles.contactList}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.loadingText}>Lade Kontaktinformationen...</Text>
                )}
              </Card.Content>
            </Card>

            {/* GALERIE */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.title}>Galerie</Title>
                {images.length > 0 ? (
                  <FlatList
                    data={images}
                    keyExtractor={(item, idx) =>
                      item.id ? item.id.toString() : idx.toString()
                    }
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImageIndex(index);
                          setImageModalVisible(true);
                        }}
                        style={styles.imageItem}
                      >
                        {item.description ? (
                          <Text style={styles.imageDescription}>{item.description}</Text>
                        ) : null}
                        <Image source={{ uri: item.image_url }} style={styles.thumbnailImage} />
                      </TouchableOpacity>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageList}
                  />
                ) : (
                  <Text style={styles.loadingText}>Keine Bilder verfügbar</Text>
                )}
              </Card.Content>
            </Card>

            {/* BILD-VORSCHAU-MODAL */}
            {images.length > 0 && (
              <Modal visible={isImageModalVisible} transparent={true}>
                <View style={styles.modalBackground}>
                  <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    initialScrollIndex={selectedImageIndex}
                    keyExtractor={(item, idx) =>
                      item.id ? item.id.toString() : idx.toString()
                    }
                    renderItem={({ item }) => (
                      <View style={styles.fullscreenImageContainer}>
                        {item.description && (
                          <Text style={styles.fullscreenImageDescription}>
                            {item.description}
                          </Text>
                        )}
                        <Image source={{ uri: item.image_url }} style={styles.fullscreenImage} />
                      </View>
                    )}
                    getItemLayout={(data, index) => ({
                      length: width,
                      offset: width * index,
                      index,
                    })}
                    onScrollToIndexFailed={(info) => {
                      const wait = new Promise((res) => setTimeout(res, 500));
                      wait.then(() => {
                        flatListRef.current?.scrollToIndex({
                          index: info.index,
                          animated: true,
                        });
                      });
                    }}
                    ref={flatListRef}
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setImageModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Schließen</Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            )}
          </View>
        }
      />

      {/* PROFIL-SUCHE-MODAL */}
      {profileModalVisible && (
        <DynamicFormQuickSearch
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          searchEndpoint={`${BASE_URL}/api/test-scenario-victims/`}
          onProfileSelect={(buttonNumber) => {
            navigation.navigate('VictimProfileDetailScreen', { buttonNumber, role });
            setProfileModalVisible(false);
          }}
        />
      )}

      {/* FORMULAR-SUCHE-MODAL */}
      <Portal>
        <Modal
          visible={formSelectorVisible}
          onRequestClose={() => setFormSelectorVisible(false)}
          animationType="slide"
          transparent={false}
        >
          <View style={styles.modalOuterContainer}>
            <LinearGradient colors={['#007bff', '#0056b3']} style={styles.headerLarge}>
              <Text style={styles.headerLargeText}>Formular-Auswahl</Text>
            </LinearGradient>
            <View style={styles.introBox}>
              <Text style={styles.introBoxTitle}>
                Formulare als „vollständig" markieren (optional)
              </Text>
              <Text style={styles.introBoxDescription}>
                Bitte kennzeichnen Sie mit der großen Checkbox, sobald ein Formular
                vollständig ausgefüllt wurde. Klicken Sie auf einen Eintrag, um das
                gewünschte Formular auszuwählen.
              </Text>
            </View>
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <Icon name="search" size={18} color="#007bff" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Formular suchen..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => handleFilterForms(searchQuery)}
              >
                <Text style={styles.searchButtonText}>Suchen</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.resultsWrapper}>
              {displayedForms.length > 0 ? (
                <FlatList
                  data={displayedForms}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.resultsList}
                  renderItem={({ item }) => {
                    const isCompleted = !!completedForms[item.id];
                    return (
                      <View
                        style={[
                          styles.resultItem,
                          isCompleted && styles.resultItemCompleted,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.resultItemContent}
                          onPress={() => {
                            setSelectedFormName(item.value);
                            setFormSelectorVisible(false);
                          }}
                        >
                          <View style={styles.resultItemHeader}>
                            <Icon
                              name="file-text-o"
                              size={20}
                              color="#4E4E4E"
                              style={{ marginRight: 8 }}
                            />
                            <Text style={styles.resultItemHeaderText}>{item.label}</Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.checkBoxBottomRight}>
                          <Checkbox
                            style={styles.checkboxLarge}
                            value={isCompleted}
                            onValueChange={() => toggleCompletedForForm(item.id)}
                            color={isCompleted ? '#28a745' : undefined}
                          />
                        </View>
                      </View>
                    );
                  }}
                />
              ) : (
                <Text style={styles.noResultsText}>Keine Formulare gefunden.</Text>
              )}
            </View>
            <View style={styles.footerContainer}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => setFormSelectorVisible(false)}
              >
                <Icon name="close" size={16} color="#fff" />
                <Text style={styles.footerButtonText}>Schließen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
};

export default HomeScreen;











































