/**
 * DynamicFormQuickSearch.js
 * 
 * Diese Komponente implementiert eine modale Suchfunktion für Patientenprofile innerhalb der DÜB-Anwendung.
 * Sie ermöglicht den Zugriff auf Patientenprofile über eine Suchfunktion oder direkte Auswahl und
 * bietet eine detaillierte Ansicht der Profile mit Kategorisierung nach Bearbeitungsstatus
 * (normal, in Bearbeitung, fertig).
 */

// ------------------------------------------------
// 1) IMPORTE UND BASISKONFIGURATION
// ------------------------------------------------
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

/**
 * Profile-Zustände: "none" (normal), "inProgress" (in Bearbeitung), "done" (fertig).
 * Gespeichert in profileStates[item.id].
 *
 * Sortierung: inProgress (0), done (1), none (2).
 * Filter: kann optional nur inProgress/done anzeigen.
 */

// ------------------------------------------------
// 2) HILFSFUNKTIONEN FÜR UI-DARSTELLUNG
// ------------------------------------------------

/**
 * Bestimmt die Hintergrundfarbe basierend auf der Sichtungskategorie (SK)
 * @param {string} category - Kategorie des Patienten (SK 1, SK 2, SK 3)
 * @returns {string} - Der Farbcode für die entsprechende Kategorie
 */
function getSKColor(category) {
  if (!category) return '#6c757d';
  const cat = category.toLowerCase();
  if (cat.includes('sk 1')) {
    return '#b71c1c'; // Rot
  } else if (cat.includes('sk 2')) {
    return '#f9a825'; // Gelb
  } else if (cat.includes('sk 3')) {
    return '#2e7d32'; // Grün
  }
  return '#6c757d'; // Grau als Default
}

/**
 * Bestimmt die Textfarbe basierend auf der Hintergrundfarbe
 * @param {string} bgColor - Hintergrundfarbe
 * @returns {string} - Weiß für dunkle Hintergründe, Schwarz für helle
 */
function getSKTextColor(bgColor) {
  const darkBackgrounds = ['#b71c1c', '#2e7d32', '#6c757d', '#007bff', '#0056b3'];
  return darkBackgrounds.includes(bgColor) ? '#fff' : '#000';
}

/**
 * Bestimmt den Rahmenstil basierend auf dem Profilstatus
 * @param {string} profileState - Status des Profils (none, inProgress, done)
 * @returns {Object} - Style-Objekt für den Rahmen
 */
function getBorderStyle(profileState) {
  if (profileState === 'inProgress') {
    return { borderColor: 'orange', borderWidth: 4 };
  }
  if (profileState === 'done') {
    return { borderColor: '#28a745', borderWidth: 4 };
  }
  // none = normal
  return { borderColor: '#ddd', borderWidth: 4 };
}

// ------------------------------------------------
// 3) HAUPTKOMPONENTE
// ------------------------------------------------
const DynamicFormQuickSearch = ({ visible, onClose, searchEndpoint, onProfileSelect }) => {
  // ------------------------------------------------
  // 3.1) STATE-VARIABLEN
  // ------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // profileState: 'none' | 'inProgress' | 'done'
  const [profileStates, setProfileStates] = useState({});

  // Filter: nur inProgress/done
  const [filterActive, setFilterActive] = useState(false);

  const { width } = Dimensions.get('window');

  // ------------------------------------------------
  // 3.2) LIFECYCLE UND INITIALISIERUNG
  // ------------------------------------------------
  
  // Beim Öffnen initialisieren
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      fetchDefaultProfiles();
      loadProfileStates();
    } else {
      setSearchQuery('');
      setResults([]);
      setSelectedProfile(null);
      setLoading(false);
    }
  }, [visible]);

  // ------------------------------------------------
  // 3.3) PROFILSTATUS-MANAGEMENT
  // ------------------------------------------------
  
  /**
   * Lädt die gespeicherten Profilstatus aus dem AsyncStorage
   */
  const loadProfileStates = async () => {
    try {
      const stored = await AsyncStorage.getItem('profileStates');
      if (stored) {
        setProfileStates(JSON.parse(stored));
      } else {
        setProfileStates({});
      }
    } catch (err) {
      console.error('Fehler beim Laden von profileStates:', err);
    }
  };

  /**
   * Speichert geänderte Profilstatus im AsyncStorage
   * @param {Object} newStates - Aktualisierte Profilstatus
   */
  const saveProfileStates = async (newStates) => {
    setProfileStates(newStates);
    try {
      await AsyncStorage.setItem('profileStates', JSON.stringify(newStates));
    } catch (err) {
      console.error('Fehler beim Speichern von profileStates:', err);
    }
  };

  // ------------------------------------------------
  // 3.4) DATENABRUF UND SUCHE
  // ------------------------------------------------
  
  /**
   * Lädt Standardprofile (entweder vom Server oder offline)
   */
  const fetchDefaultProfiles = async () => {
    setLoading(true);
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(searchEndpoint, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = await response.json();
        setResults(data);
      } else {
        // Offline mode - use the stored test scenario victims data directly
        const scenarioVictimsStr = await AsyncStorage.getItem('testScenarioVictims');
        
        if (scenarioVictimsStr) {
          // We have stored scenario victims - use them directly
          const scenarioVictims = JSON.parse(scenarioVictimsStr);
          console.log('[QuickSearch] Offline: Loaded', scenarioVictims.length, 'scenario victims');
          setResults(scenarioVictims);
        } else {
          // Fallback to old method if no stored scenario victims
          console.log('[QuickSearch] Warning: No stored testScenarioVictims found, using fallback');
          
          const storedProfilesStr = await AsyncStorage.getItem('victimProfiles');
          if (storedProfilesStr) {
            const victimProfiles = JSON.parse(storedProfilesStr);
            const mapped = victimProfiles.map((vp) => ({
              id: vp.id,
              button_number: vp.profile_number ? `P${vp.profile_number}` : '',
              victim_profile: vp.id,
              victim_profile_data: vp,
            }));
            setResults(mapped);
          } else {
            setResults([]);
          }
        }
      }
    } catch (err) {
      console.error('[QuickSearch] Fehler beim Laden Default-Profile:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Führt eine Suche basierend auf der Sucheingabe durch
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDefaultProfiles();
      return;
    }
    setLoading(true);
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(
          `${searchEndpoint}?search=${encodeURIComponent(searchQuery.trim())}`,
          { headers: { Authorization: `Token ${token}` } }
        );
        const data = await response.json();
        setResults(data);
      } else {
        // Offline search - use stored test scenario victims
        const scenarioVictimsStr = await AsyncStorage.getItem('testScenarioVictims');
        
        if (scenarioVictimsStr) {
          const scenarioVictims = JSON.parse(scenarioVictimsStr);
          const query = searchQuery.trim().toLowerCase();
          
          // Filter the stored scenario victims by the search query
          const filtered = scenarioVictims.filter(item => {
            // Search by button number first
            const buttonNum = (item.button_number || '').toLowerCase();
            if (buttonNum.includes(query)) return true;
            
            // Then search in victim profile data
            const vp = item.victim_profile_data;
            if (!vp) return false;
            
            return (
              (vp.profile_number && vp.profile_number.toLowerCase().includes(query)) ||
              (vp.category && vp.category.toLowerCase().includes(query)) ||
              (vp.diagnosis && vp.diagnosis.toLowerCase().includes(query))
            );
          });
          
          setResults(filtered);
        } else {
          // Old fallback search in victimProfiles
          const storedProfilesStr = await AsyncStorage.getItem('victimProfiles');
          if (storedProfilesStr) {
            const victimProfiles = JSON.parse(storedProfilesStr);
            const query = searchQuery.trim().toLowerCase();
            const mapped = victimProfiles.map((vp) => ({
              id: vp.id,
              button_number: vp.profile_number ? `P${vp.profile_number}` : '',
              victim_profile: vp.id,
              victim_profile_data: vp,
            }));
            const filtered = mapped.filter((item) => {
              const vp = item.victim_profile_data;
              if (!vp) return false;
              return (
                (vp.profile_number && vp.profile_number.toLowerCase().includes(query)) ||
                (vp.category && vp.category.toLowerCase().includes(query)) ||
                (vp.diagnosis && vp.diagnosis.toLowerCase().includes(query))
              );
            });
            setResults(filtered);
          } else {
            setResults([]);
          }
        }
      }
    } catch (err) {
      console.error('[QuickSearch] Fehler bei Suche:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // 3.5) PROFIL-INTERAKTIONEN
  // ------------------------------------------------
  
  /**
   * Verarbeitet die Auswahl eines Profils
   * Navigiert entweder zum Detailscreen oder zeigt Details im Modal an
   * @param {Object} item - Das ausgewählte Profilobjekt
   */
  const handleSelectProfile = (item) => {
    if (typeof onProfileSelect === 'function') {
      onProfileSelect(item.button_number, item.id);
      onClose();
    } else {
      setSelectedProfile({
        ...item.victim_profile_data,
        button_number: item.button_number,
        scenarioVictimId: item.id,
      });
    }
  };

  /**
   * Ändert den Status eines Profils
   * @param {string} uniqueId - Eindeutige ID des Profils (button_number)
   * @param {string} newState - Neuer Status ('none', 'inProgress', 'done')
   */
  const setProfileState = async (uniqueId, newState) => {
    const newStates = { ...profileStates };
    newStates[uniqueId] = newState;
    await saveProfileStates(newStates);
  };

  // ------------------------------------------------
  // 3.6) DARSTELLUNG: ERGEBNISLISTE
  // ------------------------------------------------
  
  /**
   * Rendert ein einzelnes Element in der Ergebnisliste
   * @param {Object} param0 - Item-Objekt aus der renderItem-Funktion
   */
  const renderResultItem = ({ item }) => {
    const vp = item.victim_profile_data || {};
    const currentState = profileStates[item.button_number] || 'none';

    // Rahmenfarbe
    const borderStyle = getBorderStyle(currentState);

    return (
      <View style={[styles.resultItem, borderStyle]}>
        <TouchableOpacity
          style={styles.resultItemContent}
          onPress={() => handleSelectProfile(item)}
        >
          <View style={styles.resultItemHeader}>
            <Icon name="user" size={20} color="#4E4E4E" style={{ marginRight: 8 }} />
            <Text style={styles.resultItemHeaderText}>Button-Nr.: {item.button_number}</Text>
          </View>

          <Text style={styles.resultItemSubText}>Profilnr: {vp.profile_number || '-'}</Text>
          <Text style={styles.resultItemSubText}>Kategorie: {vp.category || '-'}</Text>
          <Text style={styles.resultItemSubText}>Diagnose: {vp.diagnosis || '-'}</Text>
        </TouchableOpacity>

        {/* Drei Buttons für den Status */}
        <View style={styles.triStateContainer}>
          <TouchableOpacity
            onPress={() => setProfileState(item.button_number, 'none')}
            style={[
              styles.triStateButton,
              currentState === 'none' && styles.triStateButtonActiveNone,
            ]}
          >
            <Text style={styles.triStateButtonText}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setProfileState(item.button_number, 'inProgress')}
            style={[
              styles.triStateButton,
              currentState === 'inProgress' && styles.triStateButtonActiveInProgress,
            ]}
          >
            <Text style={styles.triStateButtonText}>in Bearb.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setProfileState(item.button_number, 'done')}
            style={[
              styles.triStateButton,
              currentState === 'done' && styles.triStateButtonActiveDone,
            ]}
          >
            <Text style={styles.triStateButtonText}>Fertig</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  // ------------------------------------------------
  // 3.7) DARSTELLUNG: DETAILANSICHT
  // ------------------------------------------------
  
  /**
   * Rendert die Detailansicht eines ausgewählten Profils
   */
  const renderDetailView = () => {
    if (!selectedProfile) return null;
    const skBg = getSKColor(selectedProfile.category);
    const skTx = getSKTextColor(skBg);

    return (
      <View style={styles.detailContainer}>
        <LinearGradient colors={['#007bff', '#0056b3']} style={styles.detailHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerButtonNumber}>
                {selectedProfile.button_number || '---'}
              </Text>
            </View>
            <View style={styles.headerMiddle}>
              <Text style={styles.headerPCZ}>
                PCZ-IVENA: {selectedProfile.pcz_ivena || '-'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.skBox, { backgroundColor: skBg }]}>
                <Text style={[styles.skBoxText, { color: skTx }]}>
                  {selectedProfile.category || 'S-Kat.'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.detailScroll}>
          {/* Diagnose */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="stethoscope" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Diagnose</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>
                {selectedProfile.diagnosis || '-'}
              </Text>
            </View>
          </View>

          {/* Erwartete Behandlung */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="medkit" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Erwartete Behandlung</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>
                {selectedProfile.expected_med_action || '-'}
              </Text>
            </View>
          </View>

          {/* Blickdiagnose */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="eye" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Blickdiagnose</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>
                {selectedProfile.visual_diagnosis || '-'}
              </Text>
            </View>
          </View>

          {/* Befund */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="file-text-o" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Befund</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>
                {selectedProfile.findings || '-'}
              </Text>
            </View>
          </View>

          {/* Symptome */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="exclamation-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Symptome</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>
                {selectedProfile.symptoms || '-'}
              </Text>
            </View>
          </View>

          {/* Darstellerhinweise */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="user-secret" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Darstellerhinweise</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>
                {selectedProfile.actor_hints || '-'}
              </Text>
            </View>
          </View>

          {/* Vitalparameter */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="heartbeat" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Vitalparameter</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>GCS: {selectedProfile.gcs || '-'}</Text>
              <Text style={styles.infoLine}>SpO2: {selectedProfile.spo2 || '-'}</Text>
              <Text style={styles.infoLine}>Rekap: {selectedProfile.rekap || '-'}</Text>
              <Text style={styles.infoLine}>AF/min: {selectedProfile.resp_rate || '-'}</Text>
              <Text style={styles.infoLine}>sys. RR: {selectedProfile.sys_rr || '-'}</Text>
            </View>
          </View>

          {/* Befunde */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="clipboard" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.infoHeaderText}>Befunde</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLine}>
                EKG Monitoring: {selectedProfile.ekg_monitor || '-'}
              </Text>
              <Text style={styles.infoLine}>
                Röntgen Thorax: {selectedProfile.ro_thorax || '-'}
              </Text>
              <Text style={styles.infoLine}>
                Fast Sono: {selectedProfile.fast_sono || '-'}
              </Text>
              <Text style={styles.infoLine}>
                E-Fast: {selectedProfile.e_fast || '-'}
              </Text>
              <Text style={styles.infoLine}>
                CT: {selectedProfile.radiology_finds || '-'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.footerButton} onPress={() => setSelectedProfile(null)}>
            <Icon name="arrow-left" size={16} color="#fff" />
            <Text style={styles.footerButtonText}>Zur Suche</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={onClose}>
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.footerButtonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ------------------------------------------------
  // 3.8) SORTIERUNG UND FILTERUNG
  // ------------------------------------------------
  
  /**
   * Bestimmt die Sortierpriorität basierend auf dem Profilstatus
   * @param {string} state - Profilstatus ('none', 'inProgress', 'done')
   * @returns {number} - Prioritätswert: inProgress(0), done(1), none(2)
   */
  const getSortPriority = (state) => {
    if (state === 'inProgress') return 0;
    if (state === 'done') return 1;
    return 2; // none
  };

  /**
   * Rendert die Suchansicht mit Ergebnisliste
   */
  const renderSearchView = () => {
    // Sortiere Ergebnisse nach Status und Button-Nummer
    const sortedResults = [...results].sort((a, b) => {
      const stA = profileStates[a.button_number] || 'none';
      const stB = profileStates[b.button_number] || 'none';

      const diff = getSortPriority(stA) - getSortPriority(stB);
      if (diff !== 0) return diff;

      // Fallback: button_number parse
      const parseNum = (btn) => {
        if (!btn) return 9999;
        const match = btn.match(/\d+$/);
        if (!match) return 9999;
        return parseInt(match[0], 10) || 9999;
      };
      const numA = parseNum(a.button_number);
      const numB = parseNum(b.button_number);
      return numA - numB;
    });

    // Filtere nach Status, wenn Filter aktiv
    const finalData = filterActive
      ? sortedResults.filter((x) => {
        const st = profileStates[x.button_number] || 'none';

          return st === 'inProgress' || st === 'done';
        })
      : sortedResults;

    return (
      <View style={styles.searchWrapper}>
        <LinearGradient colors={['#007bff', '#0056b3']} style={styles.headerLarge}>
          <Text style={styles.headerLargeText}>Patientenprofil-Suche</Text>
        </LinearGradient>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color="#007bff" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Suchbegriff eingeben..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Suchen</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter-Checkbox */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilterActive(!filterActive)}
            style={styles.filterCheckboxTouchable}
          >
            <View
              style={[
                styles.checkboxOutline,
                filterActive && styles.checkboxFilledGreen,
              ]}
            />
            <Text style={styles.filterLabel}>Nur "in Bearbeitung" oder "fertig"</Text>
          </TouchableOpacity>
        </View>

        {/* Ergebnisse */}
        <View style={styles.resultsWrapper}>
          {finalData.length > 0 ? (
            <FlatList
              data={finalData}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderResultItem}
              style={styles.resultsList}
            />
          ) : (
            !loading && (
              <Text style={styles.noResultsText}>Keine Ergebnisse gefunden.</Text>
            )
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <TouchableOpacity style={styles.footerButton} onPress={onClose}>
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.footerButtonText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ------------------------------------------------
  // 3.9) HAUPTRENDERING DER KOMPONENTE
  // ------------------------------------------------
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {selectedProfile ? renderDetailView() : renderSearchView()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DynamicFormQuickSearch;

// ------------------------------------------------
// 4) STYLING
// ------------------------------------------------
const styles = StyleSheet.create({
  container: {
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
  searchWrapper: {
    flex: 1,
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

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 25,
    marginBottom: 10,
    marginRight: 20,
  },
  filterCheckboxTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxOutline: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#28a745',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxFilledGreen: {
    backgroundColor: '#28a745',
  },
  filterLabel: {
    fontSize: 14,
    color: '#333',
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

  // List items
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    elevation: 2,
    position: 'relative',
  },
  resultItemContent: {
    // Klick => Detail
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
  resultItemSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Tri-state Buttons
  triStateContainer: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  triStateButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginLeft: 5,
  },
  triStateButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  triStateButtonActiveNone: {
    backgroundColor: '#bbb',
  },
  triStateButtonActiveInProgress: {
    backgroundColor: 'orange',
  },
  triStateButtonActiveDone: {
    backgroundColor: '#28a745',
  },

  // Detailansicht
  detailContainer: {
    flex: 1,
    backgroundColor: '#f1f3f6',
  },
  detailHeader: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: {
    flex: 2,
    alignItems: 'flex-start',
  },
  headerButtonNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerMiddle: {
    flex: 3,
    alignItems: 'center',
  },
  headerPCZ: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flex: 2,
    alignItems: 'flex-end',
  },
  skBox: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  skBoxText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailScroll: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    marginBottom: 70,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    overflow: 'hidden',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoHeaderText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoBody: {
    padding: 10,
  },
  infoLine: {
    fontSize: 14,
    color: '#333',
    marginVertical: 3,
    lineHeight: 20,
  },

  // Footer
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
});































