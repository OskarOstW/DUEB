// VictimProfileDetailScreen.js - Detailansicht für Patientenbegleitbögen
// Ermöglicht die Anzeige und Bearbeitung von Patientenprofildaten während einer Digitale Übungsbeobachtung
// Enthält Funktionen für Sichtungsdaten, Diagnostik, Therapie, OP-Team und Verlaufsdokumentation

// ------------------------------------------------
// 1) Importe und Initialisierung
// ------------------------------------------------
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import styles, { getSichtungBoxStyle } from './VictimProfileDetailScreenStyle';
import { BASE_URL } from './../../config';

// Hilfsfunktion für den Rahmen im "Ergebnis Sichtung (IST)" Bereich
// Setzt einen dickeren Rahmen (4px) mit unterschiedlichen Farben je nach Sichtungsstufe
function getErgebnisSichtungFrame(ergebnisSichtung) {
  switch (ergebnisSichtung) {
    case 'SK I':
      return {
        borderWidth: 4,
        borderColor: '#d32f2f', // Rot
      };
    case 'SK II':
      return {
        borderWidth: 4,
        borderColor: '#f9a825', // Gelb
      };
    case 'SK III':
      return {
        borderWidth: 4,
        borderColor: '#388e3c', // Grün
      };
    default:
      return {
        borderWidth: 4,
        borderColor: '#333',
      };
  }
}

// ------------------------------------------------
// 2) Hauptkomponente
// ------------------------------------------------
const VictimProfileDetailScreen = ({ route, navigation }) => {
  // ------------------------------------------------
  // 2.1) Parameter & lokale State-Variablen
  // ------------------------------------------------
  const { buttonNumber, role } = route.params || {};

  if (!buttonNumber) {
    Alert.alert('Fehler', 'Kein Button-Code übergeben!');
  }

  // Profil, das von der API/von Offline-Daten kommt
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);

  // Kopfbereich
  const [displayButtonNumber, setDisplayButtonNumber] = useState('');
  const [khInterneNummer, setKhInterneNummer] = useState('');
  const [khNumLocked, setKhNumLocked] = useState(false);

  // SOLL-Daten (aus dem Profil)
  const [sichtungskategorieSoll, setSichtungskategorieSoll] = useState('');
  const [diagnoseSoll, setDiagnoseSoll] = useState('');
  const [blickdiagnoseSoll, setBlickdiagnoseSoll] = useState('');
  const [befundSoll, setBefundSoll] = useState('');
  const [symptomeSoll, setSymptomeSoll] = useState('');

  // Vitalwerte
  const [vitalGCS, setVitalGCS] = useState('');
  const [vitalSysRR, setVitalSysRR] = useState('');
  const [vitalSpO2, setVitalSpO2] = useState('');
  const [vitalEKG, setVitalEKG] = useState('');
  const [vitalRekap, setVitalRekap] = useState('');
  const [vitalAF, setVitalAF] = useState('');
  const [vitalHb, setVitalHb] = useState('');

  // Ergebnis-Sichtung (IST)
  const [ergebnisSichtung, setErgebnisSichtung] = useState('SK I');
  const [ergebnisSichtungLocked, setErgebnisSichtungLocked] = useState(false);

  // Tabellen: Sichtung / Diagnostik / Therapie
  const [sichtungData, setSichtungData] = useState([]);
  const [diagnostikData, setDiagnostikData] = useState([]);
  const [therapieData, setTherapieData] = useState([]);

  // Lock-Flags
  const [sichtungLocked, setSichtungLocked] = useState(false);
  const [diagnostikLocked, setDiagnostikLocked] = useState(false);
  const [therapieLocked, setTherapieLocked] = useState(false);

  // OP-Team & Verlauf
  const [opTeamList, setOpTeamList] = useState([]);
  const [verlaufseintraege, setVerlaufseintraege] = useState([]);

  // Sonstiges
  const [isSaving, setIsSaving] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  // Zeit-Picker
  const [isTimePickerVisibleForField, setIsTimePickerVisibleForField] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState(null);

  // Die folgenden States nutzen wir nur, um den Beobachternamen / E-Mail
  // zu erfassen, falls wir das Profil hochladen wollen (submitVictimProfileResponse).
  const [observerName, setObserverName] = useState('');
  const [observerEmail, setObserverEmail] = useState('');
  
  // Debugging-Status
  const [loadDebugInfo, setLoadDebugInfo] = useState('');

  // ------------------------------------------------
  // 2.2) Profil laden & Auto-Save
  // ------------------------------------------------
  useEffect(() => {
    if (buttonNumber) {
      // Vollständiges Zurücksetzen vor dem Laden eines neuen Profils
      resetAllStates();
      checkConnectivityAndLoadProfile(buttonNumber);
    }
  }, [buttonNumber]);

  // Vollständig überarbeitete resetAllStates-Funktion
  const resetAllStates = () => {
    // Nutzereingaben zurücksetzen
    setKhInterneNummer('');
    setKhNumLocked(false);
    
    // Ergebnis-Sichtung (IST) zurücksetzen
    setErgebnisSichtung('SK I');
    setErgebnisSichtungLocked(false);
    
    // Lock-Flags zurücksetzen
    setSichtungLocked(false);
    setDiagnostikLocked(false);
    setTherapieLocked(false);
    
    // OP-Team & Verlauf zurücksetzen
    setOpTeamList([]);
    setVerlaufseintraege([]);
    
    // NICHT zurücksetzen: Profile-Daten, sichtungskategorieSoll, diagnoseSoll, etc.
    // Diese werden beim Laden neu gesetzt
    
    // Sonstiges
    setIsSaving(false);
    setOfflineMode(false);
    setLoadDebugInfo('');
  };

  // Alle 45 Sekunden autosaven
  useEffect(() => {
    const interval = setInterval(() => {
      saveLocalEdits();
    }, 45000);
    return () => clearInterval(interval);
  }, [
    khInterneNummer,
    ergebnisSichtung,
    sichtungData,
    diagnostikData,
    therapieData,
    opTeamList,
    verlaufseintraege
  ]);

  // Admin- oder Observer-Daten laden (Name/E-Mail)
  useEffect(() => {
    const loadUserData = async () => {
      const adminUsername = await AsyncStorage.getItem('currentAdminUsername');
      if (adminUsername) {
        setObserverName(adminUsername);
        const adminEmail = await AsyncStorage.getItem('currentAdminEmail');
        setObserverEmail(adminEmail || '');
      } else {
        // Fallback: Observer
        const observerStr = await AsyncStorage.getItem('currentObserverAccount');
        if (observerStr) {
          const observer = JSON.parse(observerStr);
          setObserverName(
            `${observer.first_name} ${observer.last_name}`.trim() || observer.username
          );
          setObserverEmail(observer.email || '');
        }
      }
    };
    loadUserData();
  }, []);

  // Prüft Internetverbindung und lädt das Profil
  const checkConnectivityAndLoadProfile = async (btn) => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      setOfflineMode(false);
      await loadProfileFromServer(btn);
    } else {
      setOfflineMode(true);
      await loadProfileFromStorage(btn);
    }
  };

  // ------------------------------------------------
  // 2.3) Server-Laden
  // ------------------------------------------------
  const loadProfileFromServer = async (btn) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const resp = await fetch(`${BASE_URL}/api/test-scenario-victims/?search=${btn}`, {
        headers: { Authorization: `Token ${token}` }
      });
      if (!resp.ok) {
        throw new Error('Fehler beim Laden der Zuordnung (ScenarioVictim).');
      }
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`Kein Profil zu Button: ${btn} gefunden`);
      }
      const scenarioVictim = data[0];
      setDisplayButtonNumber(scenarioVictim.button_number || '');

      const victimId = scenarioVictim.victim_profile;
      if (!victimId) throw new Error('Keine victim_profile-ID vorhanden!');
      
      // Profil-ID für später speichern
      setProfileId(victimId);

      // VictimProfile laden
      const respProfile = await fetch(`${BASE_URL}/api/victim-profiles/${victimId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      if (!respProfile.ok) {
        throw new Error('Fehler beim Laden des VictimProfiles (Server).');
      }
      const fullProfile = await respProfile.json();

      // States belegen
      setProfile(fullProfile);
      setSichtungskategorieSoll(fullProfile.category || '');
      setDiagnoseSoll(fullProfile.diagnosis || '');
      setBlickdiagnoseSoll(fullProfile.visual_diagnosis || '');
      setBefundSoll(fullProfile.findings || '');
      setSymptomeSoll(fullProfile.symptoms || '');
      setVitalGCS(fullProfile.gcs || '');
      setVitalSysRR(fullProfile.sys_rr || '');
      setVitalSpO2(fullProfile.spo2 || '');
      setVitalEKG(fullProfile.ekg_monitor || '');
      setVitalRekap(fullProfile.rekap || '');
      setVitalAF(fullProfile.resp_rate || '');
      setVitalHb(fullProfile.hb_value || '');

      // offline speichern
      await storeOfflineProfile(scenarioVictim, fullProfile);

      // Tabellendaten initialisieren mit den Profildaten
      initSichtungData(fullProfile);
      initDiagnostikData(fullProfile);
      initTherapieData(fullProfile);

      // lokale Eingaben laden (falls schon vorhanden)
      await loadLocalEdits(btn);

      // Überprüfen, ob bereits eine VictimProfileResponse existiert
      checkExistingResponse(btn);

    } catch (e) {
      Alert.alert('Fehler', e.message);
    }
  };

  // Prüfen, ob bereits eine Response für das Profil existiert
  const checkExistingResponse = async (btn) => {
    try {
      // Zuerst prüfen, ob bereits lokale Bearbeitungen existieren:
      const localKey = `VictimProfileDetail_${btn}`;
      const localDataStr = await AsyncStorage.getItem(localKey);
  
      // Falls lokale Daten existieren, NICHT den Serverwert überschreiben
      if (localDataStr) {
        console.log(`[INFO] Lokale Daten für ${btn} gefunden – Serverdaten werden nicht übernommen.`);
        return;
      }
  
      // Lokale Daten existieren nicht – aber wir wollen nicht automatisch
      // den alten KH‑internen Wert vom Server laden.
      // Daher überspringen wir hier das Laden oder setzen explizit den Wert auf leer.
      // (Alternativ: Du könntest hier auch den Rest der Daten laden, aber das KH‑interne Feld bewusst ignorieren.)
      
      const token = await AsyncStorage.getItem('userToken');
      const resp = await fetch(`${BASE_URL}/api/victim-profile-responses/?search=${btn}`, {
        headers: { Authorization: `Token ${token}` }
      });
  
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          // Filtere die Antworten, die zum aktuellen Benutzer gehören:
          const currentUsername = await AsyncStorage.getItem('currentAdminUsername');
          const observerStr = await AsyncStorage.getItem('currentObserverAccount');
          const currentObserver = observerStr ? JSON.parse(observerStr) : null;
  
          const ownResponses = data.filter(response => {
            if (currentUsername && response.observer_name === currentUsername) return true;
            if (currentObserver && response.observer_email === currentObserver.email) return true;
            return false;
          });
  
          if (ownResponses.length > 0) {
            const existingResponse = ownResponses[0];
  
            // Hier NICHT den KH‑internen Wert übernehmen – stattdessen auf leer setzen:
            setKhInterneNummer('');
            
            // Die anderen Felder kannst du wie gehabt laden:
            setErgebnisSichtung(existingResponse.ist_sichtung || 'SK I');
            
            // Falls du noch weitere Felder aus der existierenden Antwort übernehmen möchtest,
            // kannst du dies hier tun, ohne den KH‑internen Wert zu beeinflussen.
          }
        }
      }
    } catch (error) {
      console.error("Fehler beim Prüfen auf existierende Antwort:", error);
    }
  };
  

  const storeOfflineProfile = async (scenarioVictim, fullProfile) => {
    try {
      const stored = await AsyncStorage.getItem('offlineVictimProfiles');
      let arr = stored ? JSON.parse(stored) : [];
      const idx = arr.findIndex(
        (item) => item.button_number === scenarioVictim.button_number
      );
      const newObj = { ...scenarioVictim, fullProfile };
      if (idx >= 0) {
        arr[idx] = newObj;
      } else {
        arr.push(newObj);
      }
      await AsyncStorage.setItem('offlineVictimProfiles', JSON.stringify(arr));
    } catch (err) {
      console.log('Fehler storeOfflineProfile:', err);
    }
  };

  // ------------------------------------------------
  // 2.4) Lokal-Laden
  // ------------------------------------------------
  const loadProfileFromStorage = async (btn) => {
    try {
      let fullProfile = null;
      let displayBtn = '';
      let tempProfileId = null;
      let debugInfo = '';
  
      // 1. Zunächst in der Button-zu-Profil-Zuordnung nachschauen
      const buttonToProfileMapStr = await AsyncStorage.getItem('buttonToProfileMap');
      if (buttonToProfileMapStr) {
        try {
          const buttonToProfileMap = JSON.parse(buttonToProfileMapStr);
          debugInfo += `ButtonToProfileMap geladen, Einträge: ${Object.keys(buttonToProfileMap).length}\n`;
          
          if (buttonToProfileMap[btn]) {
            fullProfile = buttonToProfileMap[btn];
            displayBtn = btn;
            tempProfileId = fullProfile.victim_profile || fullProfile.id;
            debugInfo += `Profil für ${btn} in buttonToProfileMap gefunden.\n`;
          } else {
            // Versuche case-insensitive Suche
            const lowerBtn = btn.toLowerCase();
            for (const key of Object.keys(buttonToProfileMap)) {
              if (key.toLowerCase() === lowerBtn) {
                fullProfile = buttonToProfileMap[key];
                displayBtn = key;
                tempProfileId = fullProfile.victim_profile || fullProfile.id;
                debugInfo += `Profil für ${btn} (als ${key}) in buttonToProfileMap gefunden.\n`;
                break;
              }
            }
            if (!fullProfile) {
              debugInfo += `Profil für ${btn} NICHT in buttonToProfileMap gefunden.\n`;
            }
          }
        } catch (e) {
          debugInfo += `Fehler beim Parsen von buttonToProfileMap: ${e.message}\n`;
        }
      } else {
        debugInfo += 'buttonToProfileMap nicht vorhanden.\n';
      }
  
      // 2. Falls nicht gefunden, im offlineVictimProfiles nachschauen
      if (!fullProfile) {
        const storedOffline = await AsyncStorage.getItem('offlineVictimProfiles');
        if (storedOffline) {
          try {
            const arr = JSON.parse(storedOffline);
            debugInfo += `OfflineVictimProfiles geladen, Einträge: ${arr.length}\n`;
            
            // Exakte Suche
            const matched = arr.find(
              (x) => (x.button_number || '').toLowerCase() === btn.toLowerCase()
            );
            
            if (matched) {
              if (matched.fullProfile) {
                fullProfile = matched.fullProfile;
                displayBtn = matched.button_number || '';
                tempProfileId = matched.victim_profile || matched.fullProfile.id;
                debugInfo += `Profil für ${btn} in offlineVictimProfiles gefunden.\n`;
              } else {
                debugInfo += `Eintrag für ${btn} in offlineVictimProfiles gefunden, aber fullProfile fehlt.\n`;
              }
            } else {
              debugInfo += `Profil für ${btn} NICHT in offlineVictimProfiles gefunden.\n`;
            }
          } catch (e) {
            debugInfo += `Fehler beim Parsen von offlineVictimProfiles: ${e.message}\n`;
          }
        } else {
          debugInfo += 'offlineVictimProfiles nicht vorhanden.\n';
        }
      }
  
      // 3. Falls nicht gefunden, versuche fallback in "victimProfiles"
      if (!fullProfile) {
        const allVictims = await AsyncStorage.getItem('victimProfiles');
        if (allVictims) {
          try {
            const vpArr = JSON.parse(allVictims);
            debugInfo += `VictimProfiles geladen, Einträge: ${vpArr.length}\n`;
            
            // Versuche über profile_number zu finden
            const fallback = vpArr.find((item) => {
              const bn = item.profile_number ? 'p' + item.profile_number : '';
              return bn.toLowerCase() === btn.toLowerCase();
            });
            
            if (fallback) {
              fullProfile = fallback;
              displayBtn = fallback.profile_number ? 'P' + fallback.profile_number : '';
              tempProfileId = fallback.id;
              debugInfo += `Profil für ${btn} in victimProfiles (als P${fallback.profile_number}) gefunden.\n`;
            } else {
              debugInfo += `Profil für ${btn} NICHT in victimProfiles gefunden.\n`;
            }
          } catch (e) {
            debugInfo += `Fehler beim Parsen von victimProfiles: ${e.message}\n`;
          }
        } else {
          debugInfo += 'victimProfiles nicht vorhanden.\n';
        }
      }
  
      // 4. Als letzten Versuch, schaue im VictimProfileDetail direkt nach
      if (!fullProfile) {
        const detailKey = `VictimProfileDetail_${btn}`;
        const detailStr = await AsyncStorage.getItem(detailKey);
        if (detailStr) {
          try {
            const detailData = JSON.parse(detailStr);
            if (detailData.profileId) {
              tempProfileId = detailData.profileId;
              displayBtn = btn;
              // Hier haben wir kein vollständiges Profil, aber wir können die bereits gespeicherten Daten laden
              debugInfo += `ProfileId ${tempProfileId} in VictimProfileDetail_${btn} gefunden.\n`;
              
              // Wir versuchen, das Profil aus fullVictimProfilesData zu laden
              const fullProfilesStr = await AsyncStorage.getItem('fullVictimProfilesData');
              if (fullProfilesStr) {
                try {
                  const fullProfiles = JSON.parse(fullProfilesStr);
                  const matchedFull = fullProfiles.find(p => p.id === tempProfileId);
                  if (matchedFull) {
                    fullProfile = matchedFull;
                    debugInfo += `Vollständiges Profil für ID ${tempProfileId} in fullVictimProfilesData gefunden.\n`;
                  }
                } catch (e) {
                  debugInfo += `Fehler beim Parsen von fullVictimProfilesData: ${e.message}\n`;
                }
              }
            }
          } catch (e) {
            debugInfo += `Fehler beim Parsen von VictimProfileDetail_${btn}: ${e.message}\n`;
          }
        } else {
          debugInfo += `VictimProfileDetail_${btn} nicht vorhanden.\n`;
        }
      }
  
      if (!fullProfile) {
        // Setze den Debug-Text zur Fehlerbehebung
        setLoadDebugInfo(debugInfo);
        Alert.alert(
          'Fehler', 
          `Offline: Kein vollständiges Profil zu "${btn}" gefunden. Bitte wenden Sie sich an den Administrator.`,
          [
            {
              text: 'Details anzeigen',
              onPress: () => Alert.alert('Debug-Info', debugInfo)
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
        return;
      }
  
      // Profile-ID für später speichern
      setProfileId(tempProfileId);
  
      // States belegen
      setProfile(fullProfile);
      setDisplayButtonNumber(displayBtn);
      setSichtungskategorieSoll(fullProfile.category || '');
      setDiagnoseSoll(fullProfile.diagnosis || '');
      setBlickdiagnoseSoll(fullProfile.visual_diagnosis || '');
      setBefundSoll(fullProfile.findings || '');
      setSymptomeSoll(fullProfile.symptoms || '');
      setVitalGCS(fullProfile.gcs || '');
      setVitalSysRR(fullProfile.sys_rr || '');
      setVitalSpO2(fullProfile.spo2 || '');
      setVitalEKG(fullProfile.ekg_monitor || '');
      setVitalRekap(fullProfile.rekap || '');
      setVitalAF(fullProfile.resp_rate || '');
      setVitalHb(fullProfile.hb_value || '');
  
      // Tabellendaten initialisieren mit den Profildaten
      initSichtungData(fullProfile);
      initDiagnostikData(fullProfile);
      initTherapieData(fullProfile);
  
      // lokale Eingaben laden
      await loadLocalEdits(btn);
  
    } catch (err) {
      Alert.alert('Fehler', `Konnte nicht offline laden: ${err.message}`);
    }
  };

  // ------------------------------------------------
  // 2.5) Lokale Eingaben & Initialisierung
  // ------------------------------------------------
  const loadLocalEdits = async (btn) => {
    console.log(`[DEBUG] Lade lokale Eingaben für Button ${btn}`);
    // Eindeutiger Schlüssel für dieses spezifische Profil
    const k = `VictimProfileDetail_${btn}`;
    const localStr = await AsyncStorage.getItem(k);
    
    if (!localStr) {
      console.log(`[DEBUG] Keine lokalen Daten für ${btn} gefunden.`);
      return;
    }
    
    try {
      const saved = JSON.parse(localStr);
      
      // Sicherheitscheck: Ist der gespeicherte Button der richtige?
      if (saved.buttonNumber !== btn) {
        console.log(`[ERROR] Datenfehler: Gespeicherte Daten gehören zu Button ${saved.buttonNumber}, nicht ${btn}`);
        return;
      }
      
      // Laden der gespeicherten Daten für dieses spezifische Profil
      setKhInterneNummer(saved.khInterneNummer || '');
      setKhNumLocked(saved.isKhNumLocked || false);
      setErgebnisSichtung(saved.ergebnisSichtung || 'SK I');
      setErgebnisSichtungLocked(saved.isErgebnisSichtungLocked || false);
    
      if (Array.isArray(saved.sichtungData) && saved.sichtungData.length > 0) {
        setSichtungData(saved.sichtungData);
      }
      setSichtungLocked(saved.sichtungLocked || false);
    
      if (Array.isArray(saved.diagnostikData) && saved.diagnostikData.length > 0) {
        setDiagnostikData(saved.diagnostikData);
      }
      setDiagnostikLocked(saved.diagnostikLocked || false);
    
      if (Array.isArray(saved.therapieData) && saved.therapieData.length > 0) {
        setTherapieData(saved.therapieData);
      }
      setTherapieLocked(saved.therapieLocked || false);
    
      if (saved.opTeamList && Array.isArray(saved.opTeamList)) {
        setOpTeamList(saved.opTeamList);
      }
      
      if (saved.verlaufseintraege && Array.isArray(saved.verlaufseintraege)) {
        setVerlaufseintraege(saved.verlaufseintraege);
      }
    } catch (err) {
      console.error(`[ERROR] Fehler beim Laden der lokalen Daten: ${err.message}`);
    }
  };
  

  // Beispiel-Initialisierung
  const initSichtungData = (prof) => {
    const arr = [
      { id: 's1', place: 'Grün', verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
      { id: 's2', place: 'Gelb', verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
      { id: 's3', place: 'Rot',  verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
      { id: 's4', place: 'Schockraum', verletztenkatalog: 'Nein', tatsaechlicheBehandlung: '', von: '', bis: '' },
    ];
    setSichtungData(arr);
  };

  const initDiagnostikData = (prof) => {
    const arr = [
      {
        id: 'd1',
        place: 'EKG Monitoring',
        verletztenkatalog: prof?.ekg_monitor || '',
        tatsaechlicheBehandlung: '',
        von: '',
        bis: ''
      },
      {
        id: 'd2',
        place: 'Rö-Thorax',
        verletztenkatalog: prof?.ro_thorax || '',
        tatsaechlicheBehandlung: '',
        von: '',
        bis: ''
      },
      {
        id: 'd3',
        place: 'Fast-Sono',
        verletztenkatalog: prof?.fast_sono || '',
        tatsaechlicheBehandlung: '',
        von: '',
        bis: ''
      },
      {
        id: 'd4',
        place: 'E-Fast',
        verletztenkatalog: prof?.e_fast || '',
        tatsaechlicheBehandlung: '',
        von: '',
        bis: ''
      },
      {
        id: 'd5',
        place: 'CT',
        verletztenkatalog: prof?.radiology_finds || '',
        tatsaechlicheBehandlung: '',
        von: '',
        bis: ''
      }
    ];
    setDiagnostikData(arr);
  };

  const initTherapieData = (prof) => {
    // OP-Felder zusammenbauen
    const opAchri = (prof?.op_achi_res || '').trim().toUpperCase();
    const opUchi = (prof?.op_uchi_res || '').trim().toUpperCase();
    const opNchi = (prof?.op_nchi_res || '').trim().toUpperCase();

    const opValuesRaw = [
      opAchri === 'N' ? '' : prof?.op_achi_res,
      opUchi === 'N' ? '' : prof?.op_uchi_res,
      opNchi === 'N' ? '' : prof?.op_nchi_res
    ];
    const opValues = opValuesRaw.filter((val) => val && val.trim() !== '');
    const opVerletztenkatalog = opValues.join(' / ');

    // ITS-Logik
    const itsPlatz = (prof?.icu_place || '').trim().toUpperCase();
    const beatmung = (prof?.ventilation_place || '').trim().toUpperCase();

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
        // Irgendein anderer Wert -> wir nehmen ihn direkt
        itsMitBeatmung = beatmung;
      }
    }

    const arr = [
      {
        id: 't1',
        place: 'Not-OP',
        verletztenkatalog: prof?.emergency_op || '',
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
    setTherapieData(arr);
  };

  // ------------------------------------------------
  // 2.6) Lokales Speichern
  // ------------------------------------------------
  const saveLocalEdits = async (navigateAfter = false) => {
    // Wichtig: Jedes Profil bekommt einen eigenen Speicherschlüssel basierend auf buttonNumber
    const storageKey = `VictimProfileDetail_${buttonNumber}`;
    
    const payload = {
      buttonNumber, // <-- Hinzufügen, damit der Datensatz eindeutig zugeordnet werden kann
      
      // Benutzereingaben
      khInterneNummer,
      isKhNumLocked: khNumLocked,
      ergebnisSichtung,
      isErgebnisSichtungLocked: ergebnisSichtungLocked,
      sichtungData,
      sichtungLocked,
      diagnostikData,
      diagnostikLocked,
      therapieData,
      therapieLocked,
      opTeamList,
      verlaufseintraege,
      
      // Wichtig: Auch die automatisch geladenen Profildaten speichern
      profileId,
      sichtungskategorieSoll,   // SOLL-Daten aus dem Profil
      diagnoseSoll,
      blickdiagnoseSoll,
      befundSoll,
      symptomeSoll,
      
      // Vitalwerte
      vitalGCS,
      vitalSysRR,
      vitalSpO2,
      vitalEKG,
      vitalRekap,
      vitalAF,
      vitalHb,
      
      // Beobachter-Informationen
      observerName,
      observerEmail,
      lastSaved: new Date().toISOString()
    };
    
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
  
      if (navigateAfter) {
        if (!buttonNumber) {
          Alert.alert(
            'Fehler',
            'Profil-ID nicht verfügbar – das Profil wurde wohl noch nicht geladen.'
          );
          return;
        }
        // profileStates laden oder neu anlegen
        let storedStatesStr = await AsyncStorage.getItem('profileStates');
        let storedStates = storedStatesStr ? JSON.parse(storedStatesStr) : {};
  
        // Immer auf "inProgress" setzen
        storedStates[buttonNumber] = 'inProgress';
        await AsyncStorage.setItem('profileStates', JSON.stringify(storedStates));
  
        Alert.alert('Gespeichert', 'Die Eingaben wurden lokal gesichert.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home', { role: role ?? 'Observer' })
          }
        ]);
      }
    } catch (err) {
      Alert.alert('Fehler', `Konnte nicht speichern: ${err.message}`);
    } finally {
      setTimeout(() => setIsSaving(false), 3500);
    }
  };

  // ------------------------------------------------
  // 2.7) Interaktionen (Locks, Zeit-Picker usw.)
  // ------------------------------------------------
  const confirmKhNummer = () => {
    if (!khInterneNummer.trim()) {
      Alert.alert('Fehler', 'KH interne Pat.-Nr. darf nicht leer sein.');
      return;
    }
    setKhNumLocked(true);
  };
  const editKhNummer = () => setKhNumLocked(false);

  // Ergebnis-Sichtung
  const confirmErgebnisSichtung = () => setErgebnisSichtungLocked(true);
  const editErgebnisSichtung = () => setErgebnisSichtungLocked(false);

  // Sichtungs-Tabellen
  const updateSichtungRow = (id, field, val) => {
    setSichtungData((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: val } : row)));
  };
  const toggleSichtungLock = () => setSichtungLocked(!sichtungLocked);

  // Diagnostik-Tabellen
  const updateDiagnostikRow = (id, field, val) => {
    setDiagnostikData((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: val } : row)));
  };
  const toggleDiagnostikLock = () => setDiagnostikLocked(!diagnostikLocked);

  // Therapie-Tabellen
  const updateTherapieRow = (id, field, val) => {
    setTherapieData((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: val } : row)));
  };
  const toggleTherapieLock = () => setTherapieLocked(!therapieLocked);

  // OP-Team
  const addOpTeamEntry = () => {
    setOpTeamList((prev) => {
      // Prüfen ob das Limit von 10 Einträgen erreicht ist
      if (prev.length >= 10) {
        Alert.alert('Limit erreicht', 'Es können maximal 10 OP-Team-Einträge hinzugefügt werden.');
        return prev;
      }
      
      return [
        ...prev,
        {
          id: Date.now().toString(),
          name: '',
          fach: '',
          start: '',
          dauer: '',
          locked: false
        }
      ];
    });
  };
  
  const toggleOpTeamLock = (id) => {
    setOpTeamList((prev) =>
      prev.map((x) => (x.id === id ? { ...x, locked: !x.locked } : x))
    );
  };
  const removeOpTeamEntry = (id) => {
    setOpTeamList((prev) => prev.filter((x) => x.id !== id));
  };
  const updateOpTeamField = (id, field, val) => {
    setOpTeamList((prev) => prev.map((x) => (x.id === id ? { ...x, [field]: val } : x)));
  };

  // Verlauf
  const addVerlaufEntry = () => {
    setVerlaufseintraege((prev) => {
      // Prüfen ob das Limit von 10 Einträgen erreicht ist
      if (prev.length >= 10) {
        Alert.alert('Limit erreicht', 'Es können maximal 10 Verlaufseinträge hinzugefügt werden.');
        return prev;
      }
      
      return [
        ...prev,
        {
          id: Date.now().toString(),
          uhrzeit: '',
          khBereich: '',
          beobachtungen: '',
          locked: false
        }
      ];
    });
  };
  
  const toggleVerlaufLock = (id) => {
    setVerlaufseintraege((prev) =>
      prev.map((x) => (x.id === id ? { ...x, locked: !x.locked } : x))
    );
  };
  const removeVerlauf = (id) => {
    setVerlaufseintraege((prev) => prev.filter((x) => x.id !== id));
  };
  const updateVerlaufField = (id, field, val) => {
    setVerlaufseintraege((prev) =>
      prev.map((x) => (x.id === id ? { ...x, [field]: val } : x))
    );
  };

  // Zeit-Picker
  const openTimePicker = (section, id, field) => {
    // Nur öffnen, wenn nicht locked
    if (section === 'sichtung' && sichtungLocked) return;
    if (section === 'diagnostik' && diagnostikLocked) return;
    if (section === 'therapie' && therapieLocked) return;
    if (section === 'opTeam') {
      const entry = opTeamList.find((x) => x.id === id);
      if (entry && entry.locked) return;
    }
    if (section === 'verlauf') {
      const entry = verlaufseintraege.find((x) => x.id === id);
      if (entry && entry.locked) return;
    }

    setTimePickerTarget({ section, id, field });
    setIsTimePickerVisibleForField(true);
  };

  const handleTimeConfirm = (date) => {
    const val = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    if (timePickerTarget) {
      const { section, id, field } = timePickerTarget;
      if (section === 'sichtung') {
        updateSichtungRow(id, field, val);
      } else if (section === 'diagnostik') {
        updateDiagnostikRow(id, field, val);
      } else if (section === 'therapie') {
        updateTherapieRow(id, field, val);
      } else if (section === 'opTeam') {
        updateOpTeamField(id, field, val);
      } else if (section === 'verlauf') {
        updateVerlaufField(id, field, val);
      }
    }
    setTimePickerTarget(null);
    setIsTimePickerVisibleForField(false);
  };

  const handleTimeCancel = () => {
    setTimePickerTarget(null);
    setIsTimePickerVisibleForField(false);
  };

  // ------------------------------------------------
  // 2.8) Dynamische Anpassungen
  // ------------------------------------------------
  // Wenn sich ergebnisSichtung ändert, passe "verletztenkatalog" bei Sichtung an
  useEffect(() => {
    if (!profile) return;
    setSichtungData((prev) =>
      prev.map((row) => {
        if (row.place === 'Grün') {
          return { ...row, verletztenkatalog: ergebnisSichtung === 'SK III' ? 'Ja' : 'Nein' };
        }
        if (row.place === 'Gelb') {
          return { ...row, verletztenkatalog: ergebnisSichtung === 'SK II' ? 'Ja' : 'Nein' };
        }
        if (row.place === 'Rot') {
          return { ...row, verletztenkatalog: ergebnisSichtung === 'SK I' ? 'Ja' : 'Nein' };
        }
        if (row.place === 'Schockraum') {
          if (ergebnisSichtung === 'SK I') {
            return {
              ...row,
              verletztenkatalog: profile.personal_resources === '1' ? 'Ja' : 'Nein'
            };
          } else {
            return { ...row, verletztenkatalog: 'Nein' };
          }
        }
        return row;
      })
    );
  }, [ergebnisSichtung, profile]);

  // ------------------------------------------------
  // 3) Render
  // ------------------------------------------------
  // Buttonnummer anzeigen
  const buttonNumberToDisplay =
    displayButtonNumber && displayButtonNumber.length > 0
      ? displayButtonNumber
      : buttonNumber && buttonNumber.length < 3
      ? `J${buttonNumber.padStart(2, '0')}`
      : buttonNumber;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Kopfzeile */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Button-Nr.: {buttonNumberToDisplay}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>KH interne Pat.-Nr.:</Text>
          <TextInput
            style={[styles.headerInput, khNumLocked && { backgroundColor: '#bbb' }]}
            value={khInterneNummer}
            onChangeText={setKhInterneNummer}
            editable={!khNumLocked}
            placeholder="Eingeben"
          />
          {khNumLocked ? (
            <TouchableOpacity onPress={editKhNummer} style={styles.confirmBtn}>
              <Icon name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={confirmKhNummer} style={styles.confirmBtn}>
              <Icon name="check" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollInner}>

        {/* Überschrift */}
        <Text style={styles.pageTitle}>Patientenbegleitbogen</Text>

        {/* Sichtungskategorie (SOLL) */}
        {(() => {
          const styleObj = getSichtungBoxStyle(sichtungskategorieSoll) || {};
          return (
            <View
              style={[
                styles.sichtungHighlightBox,
                {
                  backgroundColor: styleObj.backgroundColor || '#616161',
                  borderColor: styleObj.borderColor || '#424242',
                  borderWidth: 1
                }
              ]}
            >
              <Text
                style={[
                  styles.sichtungHighlightTitle,
                  { color: styleObj.textColor || '#fff' }
                ]}
              >
                Sichtungskategorie
              </Text>
              <Text
                style={[
                  styles.sichtungHighlightValue,
                  { color: styleObj.textColor || '#fff' }
                ]}
              >
                {sichtungskategorieSoll || 'Keine Angabe'}
              </Text>
            </View>
          );
        })()}

        {/* Diagnostische Angaben */}
        <View style={styles.diagnosisCard}>
          <View style={styles.sectionHeader}>
            <Icon name="stethoscope" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Diagnostische Angaben</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.labelLine}>
              <Text style={styles.labelBold}>Diagnose:</Text> {diagnoseSoll}
            </Text>
            <Text style={styles.labelLine}>
              <Text style={styles.labelBold}>Blickdiagnose:</Text> {blickdiagnoseSoll}
            </Text>
            <Text style={styles.labelLine}>
              <Text style={styles.labelBold}>Befund:</Text> {befundSoll}
            </Text>
            <Text style={styles.labelLine}>
              <Text style={styles.labelBold}>Symptome:</Text> {symptomeSoll}
            </Text>
          </View>
        </View>

        {/* Vitalparameter */}
        <View style={styles.vitalCard}>
          <View style={styles.sectionHeader}>
            <Icon name="heartbeat" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Vitalparameter</Text>
          </View>

          <View style={styles.vitalRow}>
            <View style={styles.vitalItem}>
              <Icon name="eye" size={14} color="#444" style={{ marginRight: 4 }} />
              <Text style={styles.vitalLabel}>
                GCS: <Text style={styles.vitalValue}>{vitalGCS}</Text>
              </Text>
            </View>
            <View style={styles.vitalItem}>
              <Icon name="tint" size={14} color="#444" style={{ marginRight: 4 }} />
              <Text style={styles.vitalLabel}>
                sys.RR: <Text style={styles.vitalValue}>{vitalSysRR}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.vitalRow}>
            <View style={styles.vitalItem}>
              <Icon name="cloud" size={14} color="#444" style={{ marginRight: 4 }} />
              <Text style={styles.vitalLabel}>
                SpO2: <Text style={styles.vitalValue}>{vitalSpO2}</Text>
              </Text>
            </View>
            <View style={styles.vitalItem}>
              <Icon name="heartbeat" size={14} color="#444" style={{ marginRight: 4 }} />
              <Text style={styles.vitalLabel}>
                EKG: <Text style={styles.vitalValue}>{vitalEKG}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.vitalRow}>
            <View style={styles.vitalItem}>
              <Icon name="clock-o" size={14} color="#444" style={{ marginRight: 4 }} />
              <Text style={styles.vitalLabel}>
                Rekap: <Text style={styles.vitalValue}>{vitalRekap}</Text>
              </Text>
            </View>
            <View style={styles.vitalItem}>
              <Icon name="plus-square" size={14} color="#444" style={{ marginRight: 4 }} />
              <Text style={styles.vitalLabel}>
                AF: <Text style={styles.vitalValue}>{vitalAF}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.vitalRow}>
            <View style={styles.vitalItem}>
              <Icon name="flask" size={14} color="#444" style={{ marginRight: 4 }} />
              <Text style={styles.vitalLabel}>
                Hb: <Text style={styles.vitalValue}>{vitalHb}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Ergebnis-Sichtung (IST) */}
        <View style={[styles.card, getErgebnisSichtungFrame(ergebnisSichtung)]}>
          <Text style={styles.cardTitle}>Ergebnis Sichtung (IST)</Text>
          {ergebnisSichtungLocked ? (
            <View style={styles.lockRow}>
              <Text style={styles.lockedValue}>{ergebnisSichtung}</Text>
              <TouchableOpacity onPress={editErgebnisSichtung} style={styles.confirmBtn}>
                <Icon name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.lockRow}>
              <Picker
                style={[styles.pickerSelect, { flex: 1 }]}
                selectedValue={ergebnisSichtung}
                onValueChange={(val) => setErgebnisSichtung(val)}
              >
                <Picker.Item label="SK I" value="SK I" />
                <Picker.Item label="SK II" value="SK II" />
                <Picker.Item label="SK III" value="SK III" />
              </Picker>
              <TouchableOpacity onPress={confirmErgebnisSichtung} style={styles.confirmBtn}>
                <Icon name="check" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sichtungspunkt */}
        <View style={styles.vitalCard}>
          <View style={styles.sectionHeader}>
            <Icon name="eye" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Sichtungspunkt</Text>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Behandlungsort</Text>
            <Text style={[styles.th, { flex: 4 }]}>Verletztenkatalog</Text>
            <Text style={[styles.th, { flex: 4 }]}>tatsächliche Behandlung</Text>
            <Text style={[styles.th, { flex: 2 }]}>von</Text>
            <Text style={[styles.th, { flex: 2 }]}>bis</Text>
          </View>
          {sichtungData.map((row) => (
            <View key={row.id} style={[styles.tableRow, { alignItems: 'flex-start' }]}>
              <Text style={[styles.tdBefund, { flex: 2 }]}>{row.place}</Text>
              <View style={[styles.tdBefund, { flex: 4 }]}>
                <Text style={{ fontSize: 13 }}>{row.verletztenkatalog}</Text>
              </View>
              <TextInput
                style={[
                  styles.tdInput,
                  { flex: 4, textAlignVertical: 'top' },
                  sichtungLocked && styles.tdLocked
                ]}
                multiline
                numberOfLines={2}
                value={row.tatsaechlicheBehandlung}
                onChangeText={(val) => updateSichtungRow(row.id, 'tatsaechlicheBehandlung', val)}
                editable={!sichtungLocked}
                placeholder="tatsächliche Behandlung"
              />
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 2, justifyContent: 'center' },
                  sichtungLocked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('sichtung', row.id, 'von')}
              >
                <Text>{row.von || 'HH:MM'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 2, justifyContent: 'center' },
                  sichtungLocked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('sichtung', row.id, 'bis')}
              >
                <Text>{row.bis || 'HH:MM'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={toggleSichtungLock} style={styles.lockButton}>
            <Icon name={sichtungLocked ? "lock" : "unlock"} size={16} color="#fff" />
            <Text style={styles.lockButtonText}>
              {sichtungLocked ? "Bearbeitung freischalten" : "Bearbeitung sperren"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Diagnostik */}
        <View style={styles.vitalCard}>
          <View style={styles.sectionHeader}>
            <Icon name="flask" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Diagnostik</Text>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Behandlungsort</Text>
            <Text style={[styles.th, { flex: 4 }]}>Verletztenkatalog</Text>
            <Text style={[styles.th, { flex: 4 }]}>tatsächliche Behandlung</Text>
            <Text style={[styles.th, { flex: 2 }]}>von</Text>
            <Text style={[styles.th, { flex: 2 }]}>bis</Text>
          </View>
          {diagnostikData.map((row) => (
            <View key={row.id} style={[styles.tableRow, { alignItems: 'flex-start' }]}>
              <Text style={[styles.tdBefund, { flex: 2 }]}>{row.place}</Text>
              <View style={[styles.tdBefund, { flex: 4 }]}>
                <Text style={{ fontSize: 13 }}>{row.verletztenkatalog}</Text>
              </View>
              <TextInput
                style={[
                  styles.tdInput,
                  { flex: 4, textAlignVertical: 'top' },
                  diagnostikLocked && styles.tdLocked
                ]}
                multiline
                numberOfLines={2}
                value={row.tatsaechlicheBehandlung}
                onChangeText={(val) => updateDiagnostikRow(row.id, 'tatsaechlicheBehandlung', val)}
                editable={!diagnostikLocked}
                placeholder="tatsächliche Behandlung"
              />
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 2, justifyContent: 'center' },
                  diagnostikLocked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('diagnostik', row.id, 'von')}
              >
                <Text>{row.von || 'HH:MM'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 2, justifyContent: 'center' },
                  diagnostikLocked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('diagnostik', row.id, 'bis')}
              >
                <Text>{row.bis || 'HH:MM'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={toggleDiagnostikLock} style={styles.lockButton}>
            <Icon name={diagnostikLocked ? "lock" : "unlock"} size={16} color="#fff" />
            <Text style={styles.lockButtonText}>
              {diagnostikLocked ? "Bearbeitung freischalten" : "Bearbeitung sperren"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Therapie */}
        <View style={styles.vitalCard}>
          <View style={styles.sectionHeader}>
            <Icon name="medkit" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Therapie</Text>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Behandlungsort</Text>
            <Text style={[styles.th, { flex: 4 }]}>Verletztenkatalog</Text>
            <Text style={[styles.th, { flex: 4 }]}>tatsächliche Behandlung</Text>
            <Text style={[styles.th, { flex: 2 }]}>von</Text>
            <Text style={[styles.th, { flex: 2 }]}>bis</Text>
          </View>
          {therapieData.map((row) => (
            <View key={row.id} style={[styles.tableRow, { alignItems: 'flex-start' }]}>
              <Text style={[styles.tdBefund, { flex: 2 }]}>{row.place}</Text>
              <View style={[styles.tdBefund, { flex: 4 }]}>
                <Text style={{ fontSize: 13 }}>{row.verletztenkatalog}</Text>
              </View>
              <TextInput
                style={[
                  styles.tdInput,
                  { flex: 4, textAlignVertical: 'top' },
                  therapieLocked && styles.tdLocked
                ]}
                multiline
                numberOfLines={2}
                value={row.tatsaechlicheBehandlung}
                onChangeText={(val) => updateTherapieRow(row.id, 'tatsaechlicheBehandlung', val)}
                editable={!therapieLocked}
                placeholder="tatsächliche Behandlung"
              />
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 2, justifyContent: 'center' },
                  therapieLocked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('therapie', row.id, 'von')}
              >
                <Text>{row.von || 'HH:MM'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 2, justifyContent: 'center' },
                  therapieLocked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('therapie', row.id, 'bis')}
              >
                <Text>{row.bis || 'HH:MM'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={toggleTherapieLock} style={styles.lockButton}>
            <Icon name={therapieLocked ? "lock" : "unlock"} size={16} color="#fff" />
            <Text style={styles.lockButtonText}>
              {therapieLocked ? "Bearbeitung freischalten" : "Bearbeitung sperren"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* OP-Team */}
        <View style={styles.vitalCard}>
          <View style={styles.sectionHeader}>
            <Icon name="user-md" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Eingesetztes OP-Team</Text>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 3 }]}>Name</Text>
            <Text style={[styles.th, { flex: 3 }]}>Fachdisziplin</Text>
            <Text style={[styles.th, { flex: 3 }]}>von (Uhrzeit)</Text>
            <Text style={[styles.th, { flex: 2 }]}>Dauer</Text>
            <Text style={[styles.th, { flex: 1 }]} />
          </View>

          {opTeamList.map((row) => (
            <View key={row.id} style={[styles.tableRow, { alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.tdInput, { flex: 3 }, row.locked && styles.tdLocked]}
                value={row.name}
                onChangeText={(val) => updateOpTeamField(row.id, 'name', val)}
                editable={!row.locked}
                placeholder="Name"
              />
              <TextInput
                style={[styles.tdInput, { flex: 3 }, row.locked && styles.tdLocked]}
                value={row.fach}
                onChangeText={(val) => updateOpTeamField(row.id, 'fach', val)}
                editable={!row.locked}
                placeholder="Fachdisziplin"
              />
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 3, justifyContent: 'center' },
                  row.locked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('opTeam', row.id, 'start')}
              >
                <Text>{row.start || '08:30'}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.tdInput, { flex: 2 }, row.locked && styles.tdLocked]}
                value={row.dauer}
                onChangeText={(val) => updateOpTeamField(row.id, 'dauer', val)}
                editable={!row.locked}
                placeholder="1h"
              />
              <View style={[styles.actionButtonsCell, { flex: 1 }]}>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => toggleOpTeamLock(row.id)}>
                  <Icon name={row.locked ? 'pencil' : 'check'} size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.largeRemoveButton}
                  onPress={() => removeOpTeamEntry(row.id)}
                >
                  <Icon name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addOpTeamEntry}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.addRowText}> Eintrag hinzufügen</Text>
          </TouchableOpacity>
          {opTeamList.length >= 10 && (
            <Text style={styles.limitWarning}>
              Maximal 10 OP-Team-Einträge möglich
            </Text>
          )}
        </View>

        {/* Verlauf */}
        <View style={styles.vitalCard}>
          <View style={styles.sectionHeader}>
            <Icon name="clipboard" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeaderText}>Bemerkungen zum Verlauf</Text>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 3 }]}>Uhrzeit</Text>
            <Text style={[styles.th, { flex: 3 }]}>KH-Bereich</Text>
            <Text style={[styles.th, { flex: 5 }]}>Beobachtungen</Text>
            <Text style={[styles.th, { flex: 1 }]} />
          </View>

          {verlaufseintraege.map((row) => (
            <View key={row.id} style={[styles.tableRow, { alignItems: 'flex-start' }]}>
              <TouchableOpacity
                style={[
                  styles.tdInput,
                  { flex: 3, justifyContent: 'center' },
                  row.locked && styles.tdLocked
                ]}
                onPress={() => openTimePicker('verlauf', row.id, 'uhrzeit')}
              >
                <Text>{row.uhrzeit || 'HH:MM'}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.tdInput, { flex: 3 }, row.locked && styles.tdLocked]}
                value={row.khBereich}
                onChangeText={(val) => updateVerlaufField(row.id, 'khBereich', val)}
                editable={!row.locked}
                placeholder="z.B. OP, ITS..."
              />
              <TextInput
                style={[styles.tdInput, { flex: 5 }, row.locked && styles.tdLocked]}
                value={row.beobachtungen}
                onChangeText={(val) => updateVerlaufField(row.id, 'beobachtungen', val)}
                editable={!row.locked}
                placeholder="Bemerkungen"
              />
              <View style={[styles.actionButtonsCell, { flex: 1 }]}>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => toggleVerlaufLock(row.id)}>
                  <Icon name={row.locked ? 'pencil' : 'check'} size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.largeRemoveButton}
                  onPress={() => removeVerlauf(row.id)}
                >
                  <Icon name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addVerlaufEntry}>
            <Icon name="plus" size={16} color="#fff" />
            <Text style={styles.addRowText}> Eintrag hinzufügen</Text>
          </TouchableOpacity>
          {verlaufseintraege.length >= 10 && (
            <Text style={styles.limitWarning}>
              Maximal 10 Verlaufseinträge möglich
            </Text>
          )}
        </View>

        {/* Abstand unterhalb */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Speichern & Verlassen */}
      <TouchableOpacity style={styles.saveButton} onPress={() => saveLocalEdits(true)}>
        <Icon name="save" size={20} color="#fff" />
        <Text style={[styles.saveButtonText, { fontSize: 14 }]}>speichern &amp; verlassen</Text>
      </TouchableOpacity>

      {/* Overlay beim Auto-Speichern */}
      {isSaving && (
        <View style={styles.savingContainer}>
          <Icon name="save" size={20} color="white" />
          <Text style={styles.savingText}>Automatisch gespeichert</Text>
        </View>
      )}

      <DateTimePickerModal
        isVisible={isTimePickerVisibleForField}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={handleTimeCancel}
        locale="de-DE"
        headerTextIOS="Uhrzeit auswählen"
        confirmTextIOS="Bestätigen"
        cancelTextIOS="Abbrechen"
        textColor="black"
        date={new Date()}
      />
    </KeyboardAvoidingView>
  );
};

export default VictimProfileDetailScreen;

















































