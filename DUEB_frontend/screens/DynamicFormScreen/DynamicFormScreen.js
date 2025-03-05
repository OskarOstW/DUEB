/**
 * DynamicFormScreen.js - Dynamische Formularansicht für die DÜB-Anwendung
 * 
 * Diese Komponente ist verantwortlich für das Anzeigen und Ausfüllen verschiedener 
 * Formularttypen. Sie bietet umfangreiche Funktionen wie Offline-Speicherung, 
 * Antworterfassung mit verschiedenen Eingabetypen (Checkboxen, Dropdown, Skalen), 
 * Bildupload, Zeitstempelerfassung und Formularsuchfunktionen.
 * 
 * Die Komponente lädt Formulare aus dem lokalen Speicher, zeigt sie an und 
 * speichert die Benutzereingaben in regelmäßigen Abständen, um Datenverlust zu verhindern.
 */

// ------------------------------------------------
// 1) Importe und Initialisierung
// ------------------------------------------------
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ScrollView,
  View,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import CheckBox from 'expo-checkbox';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useInterval from '@use-it/interval';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import QuickSearchModal from './DynamicFormQuickSearch';

import styles from './DynamicFormScreenStyle';
import { BASE_URL } from './../../config';

const DynamicFormScreen = ({ route, navigation }) => {
  const { formName } = route.params;

  // -----------------------------
  // 2) State-Variablen
  // -----------------------------
  // Hauptformulardaten
  const [formData, setFormData] = useState(null);

  // Antworten und Auswahlmöglichkeiten
  const [responses, setResponses] = useState({});
  const [scaleValues, setScaleValues] = useState({});
  const [pickerSelections, setPickerSelections] = useState({});

  // Bild-Upload
  const [images, setImages] = useState({});

  // Zeitstempel und UI-Status
  const [timestamps, setTimestamps] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [questionLayouts, setQuestionLayouts] = useState({});

  // Scrollposition und Frage-IDs
  const [currentScrollPosition, setCurrentScrollPosition] = useState(0);
  const [questionIds, setQuestionIds] = useState([]);

  // Notizen und deren Sichtbarkeit
  const [note, setNote] = useState('');
  const [noteTimestamps, setNoteTimestamps] = useState([]);
  const [noteVisible, setNoteVisible] = useState(false);

  // Beobachterdaten (Name/E-Mail für den Formulareinsender)
  const [observerName, setObserverName] = useState('');
  const [observerEmail, setObserverEmail] = useState('');

  // Modale Dialoge und Suche
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickSearchVisible, setQuickSearchVisible] = useState(false);

  // Datumsauswahl
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [editingTimestampQuestionId, setEditingTimestampQuestionId] = useState(null);
  const [editingTimestampId, setEditingTimestampId] = useState(null);

  // Bildanzeige (Großformat)
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  // Autospeichern und Aktionsmenü
  const [isSaving, setIsSaving] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // Referenzen
  const scrollViewRef = useRef(null);
  const flatListRef = useRef(null);

  // Bildschirmbreite für Bildanzeige
  const { width } = Dimensions.get('window');

  // -----------------------------
  // 3) Formulardaten aus AsyncStorage laden
  // -----------------------------
  useEffect(() => {
    const loadFormDataFromStorage = async () => {
      const storedFormsData = await AsyncStorage.getItem('detailedFormsData');
      if (storedFormsData) {
        const formsData = JSON.parse(storedFormsData);
        const specificFormData = formsData.find((form) => form.name === formName);
        if (specificFormData) {
          setFormData(specificFormData);
        } else {
          Alert.alert('Fehler', `Formulardaten nicht verfügbar für: ${formName}`);
        }
      } else {
        Alert.alert(
          'Fehler',
          'Keine Formulardaten verfügbar. Bitte synchronisiere mit dem Server, wenn du online bist.'
        );
      }
    };
    loadFormDataFromStorage();
  }, [formName]);

  // -----------------------------
  // 4) Antworten und Benutzerdaten laden
  // -----------------------------
  useEffect(() => {
    const loadUserInputs = async () => {
      try {
        // Lade evtl. bereits vorhandene (lokale) Antworten
        const savedResponses = await AsyncStorage.getItem(`responses_${formName}`);
        if (savedResponses) setResponses(JSON.parse(savedResponses));

        const savedImages = await AsyncStorage.getItem(`images_${formName}`);
        if (savedImages) setImages(JSON.parse(savedImages));

        const savedPickerSelections = await AsyncStorage.getItem(`pickerSelections_${formName}`);
        if (savedPickerSelections) setPickerSelections(JSON.parse(savedPickerSelections));

        const savedScaleValues = await AsyncStorage.getItem(`scaleValues_${formName}`);
        if (savedScaleValues) setScaleValues(JSON.parse(savedScaleValues));

        const savedTimestamps = await AsyncStorage.getItem(`timestamps_${formName}`);
        if (savedTimestamps) setTimestamps(JSON.parse(savedTimestamps));

        const savedCollapsed = await AsyncStorage.getItem(`collapsed_${formName}`);
        if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));

        const savedNote = await AsyncStorage.getItem(`note_${formName}`);
        if (savedNote) setNote(savedNote);

        const savedNoteTimestamps = await AsyncStorage.getItem(`noteTimestamps_${formName}`);
        if (savedNoteTimestamps) setNoteTimestamps(JSON.parse(savedNoteTimestamps));

        // Name/E-Mail aus Admin- oder Observer-Account
        await loadUserNameEmail();
      } catch (error) {
        console.error("[ERROR][DynamicFormScreen] Failed to load user inputs:", error);
      }
    };

    // Lädt Name und E-Mail des angemeldeten Benutzers
    const loadUserNameEmail = async () => {
      try {
        // 1) Schauen, ob wir Admin-Daten haben
        const adminUsername = await AsyncStorage.getItem('currentAdminUsername');
        if (adminUsername) {
          // Admin – Name = adminUsername, E-Mail ggf. separat speicherbar
          // Oder wir hatten "currentAdminEmail" in AsyncStorage, wenn gewünscht
          // Hier vereinfachend: E-Mail = stored 'currentAdminEmail', fallback
          const adminEmail = await AsyncStorage.getItem('currentAdminEmail');
          setObserverName(adminUsername);
          setObserverEmail(adminEmail || 'admin@domain.tld');
          return;
        }

        // 2) Andernfalls Observer-Account laden
        const observerStr = await AsyncStorage.getItem('currentObserverAccount');
        if (observerStr) {
          const observerObj = JSON.parse(observerStr);
          const fullName = `${observerObj.first_name} ${observerObj.last_name}`.trim();
          setObserverName(fullName || observerObj.username || 'Beobachter');
          setObserverEmail(observerObj.email || 'unknown@observer');
        }
      } catch (err) {
        console.log('[DEBUG] loadUserNameEmail error:', err);
      }
    };

    if (formData) {
      loadUserInputs();
      setQuestionIds(formData.questions.map((q) => q.id));
    }
  }, [formData, formName]);

  // -----------------------------
  // 5) Automatisches Speichern
  // -----------------------------
  // Auto-Save Interval (alle 30 Sekunden)
  useInterval(() => {
    saveResponsesToStorage();
  }, 30000);

  // Speichert alle Antworten und Einstellungen im AsyncStorage
  const saveResponsesToStorage = async (navigateAfter = false) => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(`responses_${formName}`, JSON.stringify(responses));
      await AsyncStorage.setItem(`images_${formName}`, JSON.stringify(images));
      await AsyncStorage.setItem(`pickerSelections_${formName}`, JSON.stringify(pickerSelections));
      await AsyncStorage.setItem(`scaleValues_${formName}`, JSON.stringify(scaleValues));
      await AsyncStorage.setItem(`timestamps_${formName}`, JSON.stringify(timestamps));
      await AsyncStorage.setItem(`collapsed_${formName}`, JSON.stringify(collapsed));
      await AsyncStorage.setItem(`note_${formName}`, note);
      await AsyncStorage.setItem(`noteTimestamps_${formName}`, JSON.stringify(noteTimestamps));

      if (navigateAfter) {
        Alert.alert('Gespeichert', 'Die Eingaben wurden lokal gesichert.', [
          { text: 'OK', onPress: () => navigation.navigate('Home', { role: route.params?.role ?? 'Observer' }) }
        ]);
      }
    } catch (err) {
      console.error("[ERROR][DynamicFormScreen] Save failed:", err);
      Alert.alert('Fehler', 'Konnte nicht speichern: ' + err.message);
    } finally {
      setTimeout(() => setIsSaving(false), 4000);
    }
  };

  // -----------------------------
  // 6) Frage/Antwort – Eingaben
  // -----------------------------
  // Aktualisiert eine Textantwort für eine Frage
  const onAnswerChange = (questionId, newValue) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: newValue,
    }));
  };

  // Aktualisiert eine Dropdown-Auswahl für eine Frage
  const onPickerSelectionChange = (questionId, newValue) => {
    setPickerSelections((prev) => ({
      ...prev,
      [questionId]: newValue,
    }));
  };

  // Aktualisiert einen Skalenwert für eine Frage
  const onScaleChange = (questionId, newValue) => {
    setScaleValues((prev) => ({
      ...prev,
      [questionId]: newValue,
    }));
  };

  // -----------------------------
  // 7) Zeitstempel-Verwaltung
  // -----------------------------
  // Fügt einen neuen Zeitstempel zu einer Frage hinzu
  const addTimestamp = (questionId) => {
    const newTimestamp = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      note: '',
    };
    setTimestamps((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), newTimestamp],
    }));
  };

  // Aktualisiert die Notiz eines Zeitstempels
  const onTimestampNoteChange = (questionId, timestampId, newNote) => {
    setTimestamps((prev) => {
      const list = prev[questionId] || [];
      const updated = list.map((ts) => (ts.id === timestampId ? { ...ts, note: newNote } : ts));
      return { ...prev, [questionId]: updated };
    });
  };

  // Entfernt einen Zeitstempel
  const removeTimestamp = (questionId, timestampId) => {
    setTimestamps((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter((ts) => ts.id !== timestampId),
    }));
  };

  // Zeigt DatePicker zur Bearbeitung eines Zeitstempels
  const showDatePicker = (questionId, timestampId) => {
    setEditingTimestampQuestionId(questionId);
    setEditingTimestampId(timestampId);
    setIsDatePickerVisible(true);
  };

  // Verarbeitet die Datumsauswahl im DatePicker
  const handleDateConfirm = (date) => {
    const formatted = date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    if (editingTimestampQuestionId === 'note') {
      setNoteTimestamps((prev) =>
        prev.map((ts) => (ts.id === editingTimestampId ? { ...ts, timestamp: formatted } : ts))
      );
    } else {
      setTimestamps((prev) => {
        const list = prev[editingTimestampQuestionId] || [];
        const updated = list.map((ts) => (ts.id === editingTimestampId ? { ...ts, timestamp: formatted } : ts));
        return { ...prev, [editingTimestampQuestionId]: updated };
      });
    }
    setIsDatePickerVisible(false);
    setEditingTimestampQuestionId(null);
    setEditingTimestampId(null);
  };

  // Bricht die Datumsauswahl ab
  const handleTimeCancel = () => {
    setIsDatePickerVisible(false);
    setEditingTimestampQuestionId(null);
    setEditingTimestampId(null);
  };

  // -----------------------------
  // 8) Bild-Upload und -Verwaltung
  // -----------------------------
  // Zählt die Anzahl der hochgeladenen Bilder
  const getTotalImageCount = () => {
    let total = 0;
    Object.values(images).forEach((arr) => {
      total += arr.length;
    });
    return total;
  };

  // Lädt ein Bild aus der Medienbibliothek hoch
  const onImageUpload = async (questionId) => {
    const totalImagesCount = getTotalImageCount();
    if (totalImagesCount >= 15) {
      Alert.alert('Limit erreicht', 'Es können insgesamt maximal 15 Bilder hochgeladen werden.');
      return;
    }
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permResult.status !== 'granted') {
      Alert.alert('Berechtigung erforderlich', 'Zugriff auf die Medienbibliothek ist erforderlich!');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: false,
    });
    if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
      const uri = pickerResult.assets[0].uri;
      const name = '';
      setImages((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), { uri, name }],
      }));
    }
  };

  // Nimmt ein Foto mit der Kamera auf
  const onTakePhoto = async (questionId) => {
    const totalImagesCount = getTotalImageCount();
    if (totalImagesCount >= 15) {
      Alert.alert('Limit erreicht', 'Es können insgesamt maximal 15 Bilder hochgeladen werden.');
      return;
    }
    const permResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permResult.status !== 'granted') {
      Alert.alert('Berechtigung erforderlich', 'Zugriff auf die Kamera ist erforderlich!');
      return;
    }
    const cameraResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!cameraResult.canceled && cameraResult.assets?.length > 0) {
      const uri = cameraResult.assets[0].uri;
      const name = '';
      setImages((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), { uri, name }],
      }));
    }
  };

  // Bereinigt einen Dateinamen von unerlaubten Zeichen
  const sanitizeFilename = (name) => name.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 50);

  // Aktualisiert den Namen eines hochgeladenen Bildes
  const updateImageName = (questionId, index, newName) => {
    setImages((prev) => {
      const arr = prev[questionId] || [];
      const updated = [...arr];
      updated[index] = { ...updated[index], name: newName };
      return { ...prev, [questionId]: updated };
    });
  };

  // Entfernt ein hochgeladenes Bild
  const removeImage = (questionId, index) => {
    setImages((prev) => {
      const arr = [...(prev[questionId] || [])];
      arr.splice(index, 1);
      return { ...prev, [questionId]: arr };
    });
  };

  // -----------------------------
  // 9) UI-Interaktionen und Rendering
  // -----------------------------
  // Klappt eine Frage ein oder aus
  const toggleCollapse = (questionId) => {
    setCollapsed((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Rendert die Bilder für eine Frage
  const renderImages = (questionId) => {
    const dataArr = images[questionId] || [];
    return (
      <View style={styles.imageContainer}>
        {dataArr.map((imgObj, index) => (
          <View key={index} style={styles.imagePreviewWrapper}>
            {imgObj.uri ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedQuestionId(questionId);
                  setSelectedImageIndex(index);
                  setImageModalVisible(true);
                }}
              >
                <Image source={{ uri: imgObj.uri }} style={styles.imagePreview} />
              </TouchableOpacity>
            ) : null}
            <TextInput
              style={styles.imageNameInput}
              onChangeText={(txt) => updateImageName(questionId, index, txt)}
              value={imgObj.name}
              placeholder="Bildname eingeben"
            />
            <TouchableOpacity
              onPress={() => removeImage(questionId, index)}
              style={styles.imageDeleteButton}
            >
              <Icon name="trash" size={20} color="#ff5c5c" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  // Rendert die Zeitstempel für eine Frage
  const renderTimestamps = (questionId) => {
    const qTimestamps = timestamps[questionId];
    if (!Array.isArray(qTimestamps)) return null;
    return (
      <View style={styles.timestampDisplayContainer}>
        {qTimestamps.map((ts, idx) => (
          <View key={ts.id} style={styles.timestampItem}>
            <Text style={styles.timestampText}>{`Zeitstempel ${idx + 1}: ${ts.timestamp}`}</Text>
            <TextInput
              style={styles.timestampNoteInput}
              value={ts.note}
              placeholder="Notiz hinzufügen"
              onChangeText={(txt) => onTimestampNoteChange(questionId, ts.id, txt)}
            />
            <View style={styles.timestampButtonsContainer}>
              <TouchableOpacity
                onPress={() => showDatePicker(questionId, ts.id)}
                style={styles.timestampEditButton}
              >
                <Icon name="edit" size={20} color="white" />
                <Text style={styles.timestampEditButtonText}>Bearbeiten</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeTimestamp(questionId, ts.id)}
                style={styles.timestampRemoveButton}
              >
                <Icon name="trash" size={20} color="white" />
                <Text style={styles.timestampRemoveButtonText}>Entfernen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Rendert das Eingabefeld für eine Frage basierend auf dem Typ
  const renderQuestionInput = (question, index) => {
    const isCollapsed = collapsed[question.id];
    let optionElements = null;

    if (!isCollapsed) {
      // Je nach Antworttyp
      if (question.option_type === 'checkbox') {
        const groupedOptions = [];
        for (let i = 0; i < question.options.length; i += 2) {
          groupedOptions.push(question.options.slice(i, i + 2));
        }
        optionElements = groupedOptions.map((group, gIdx) => (
          <View key={`group_${gIdx}`} style={styles.checkboxGroup}>
            {group.map((option, idx) => (
              <View key={`${question.id}_checkbox_${idx}`} style={styles.checkboxContainer}>
                <CheckBox
                  value={!!responses[`${question.id}_${option.id}`]}
                  onValueChange={(val) => onAnswerChange(`${question.id}_${option.id}`, val)}
                />
                <View style={styles.labelContainer}>
                  <Text style={styles.checkboxLabel}>{option.label}</Text>
                </View>
              </View>
            ))}
          </View>
        ));
      } else if (question.option_type === 'scale') {
        optionElements = (
          <View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={scaleValues[question.id] || 5}
              onValueChange={(val) => onScaleChange(question.id, val)}
              minimumTrackTintColor="#1fb28a"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#b9e4c9"
            />
            <View style={styles.scaleMarksContainer}>
              {[...Array(11).keys()].map((number) => (
                <Text key={number} style={styles.scaleMarkLabel}>
                  {number}
                </Text>
              ))}
            </View>
            <Text>{'Skalenwert: ' + (scaleValues[question.id] || 5)}</Text>
          </View>
        );
      } else if (question.option_type === 'dropdown') {
        optionElements = (
          <Picker
            selectedValue={pickerSelections[question.id]}
            onValueChange={(itemValue) => onPickerSelectionChange(question.id, itemValue)}
            style={styles.picker}
          >
            {question.options.map((option) => (
              <Picker.Item
                key={`${question.id}_picker_${option.id}`}
                label={option.label}
                value={option.label}
              />
            ))}
          </Picker>
        );
      }
    }

    // Zusätzliche Beschreibung (falls vorhanden)
    const descriptionElement =
      !isCollapsed && question.description_question ? (
        <Text style={styles.questionDescription}>{question.description_question}</Text>
      ) : null;

    // Hinweis aus KAP (falls vorhanden)
    const hintElement =
      !isCollapsed && question.hint ? (
        <Text style={styles.hintText}>
          <Text style={styles.hintPrefix}>Hinweis aus dem KAP:</Text> {question.hint}
        </Text>
      ) : null;

    // Eingabefeld für Freitext (falls aktiviert)
    const inputFieldElement =
      !isCollapsed && question.input_field_added ? (
        <TextInput
          style={[styles.input, question.image_upload_desired && { flex: 1 }]}
          onChangeText={(txt) => onAnswerChange(question.id, txt)}
          value={responses[question.id] ? responses[question.id].toString() : ''}
          placeholder="Antwort hier eingeben"
          multiline
          numberOfLines={4}
        />
      ) : null;

    // Bild-Upload-Button (falls aktiviert)
    const imageUploadElement =
      !isCollapsed && question.image_upload_desired ? (
        <TouchableOpacity onPress={() => onImageUpload(question.id)} style={styles.imageUploadButton}>
          <View style={styles.iconWithText}>
            <Icon name="picture-o" size={30} color="#000" />
            <Text style={styles.imageUploadText}>Bild hochladen</Text>
          </View>
        </TouchableOpacity>
      ) : null;

    // Foto-Button (falls Bild-Upload aktiviert)
    const takePhotoElement =
      !isCollapsed && question.image_upload_desired ? (
        <TouchableOpacity onPress={() => onTakePhoto(question.id)} style={styles.imageUploadButton}>
          <View style={styles.iconWithText}>
            <Icon name="camera" size={30} color="#000" />
            <Text style={styles.imageUploadText}>Foto aufnehmen</Text>
          </View>
        </TouchableOpacity>
      ) : null;

    // Zeitstempel-Button (immer sichtbar)
    const timestampButtonElement = !isCollapsed && (
      <TouchableOpacity onPress={() => addTimestamp(question.id)} style={styles.timestampButton}>
        <Icon name="clock-o" size={20} color="white" />
        <Text style={styles.timestampButtonText}>Zeitstempel hinzufügen</Text>
      </TouchableOpacity>
    );

    return (
      <View
        key={`question_${question.id}`}
        style={styles.questionContainer}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          setQuestionLayouts((prev) => ({ ...prev, [question.id]: layout }));
        }}
      >
        <Text style={styles.questionText}>{`Frage ${index + 1}: ${question.question_text}`}</Text>
        {descriptionElement}
        {hintElement}
        {!isCollapsed && <View style={styles.separator} />}
        {!isCollapsed && optionElements}
        {!isCollapsed && <View style={styles.separator} />}
        <View style={styles.inputRow}>
          {inputFieldElement}
          {imageUploadElement}
          {takePhotoElement}
          {timestampButtonElement}
        </View>
        {!isCollapsed && renderImages(question.id)}
        {!isCollapsed && renderTimestamps(question.id)}
        <View style={styles.collapseSwitchContainer}>
          <Text style={styles.collapseSwitchLabel}>Einklappen</Text>
          <Switch
            value={!!collapsed[question.id]}
            onValueChange={() => toggleCollapse(question.id)}
          />
        </View>
      </View>
    );
  };

  // -----------------------------
  // 10) Formular absenden
  // -----------------------------
  // Sendet das ausgefüllte Formular an den Server
  const handleSubmit = async () => {
    Alert.alert('Bestätigung', 'Möchtest du das Formular absenden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Absenden',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            if (!formData?.id) {
              throw new Error('Formulardaten nicht geladen (id fehlt).');
            }

            console.log("[DEBUG][DynamicFormScreen] Submit, using observerName=", observerName, " / observerEmail=", observerEmail);

            // Payload
            const formDataToSend = {
              form: formData.id,
              observer_name: observerName || 'Unbekannt',
              observer_email: observerEmail || 'keineMail@domain.tld',
              responses: responses,
              picker_selections: pickerSelections,
              scale_values: scaleValues,
              timestamps: timestamps,
              note: note,
              note_timestamps: noteTimestamps,
            };

            const response = await fetch(`${BASE_URL}/api/form-responses/`, {
              method: 'POST',
              headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formDataToSend),
            });

            if (response.status === 201) {
              const result = await response.json();
              console.log("[DEBUG][DynamicFormScreen] Form submission successful, ID:", result.id);
              await uploadImages(result.id);
              Alert.alert('Erfolg', 'Formular und Bilder erfolgreich gesendet.');
            } else {
              const errorText = await response.text();
              console.error(
                "[ERROR][DynamicFormScreen] Form submission error, status:",
                response.status,
                errorText
              );
              throw new Error('Fehler beim Senden der Daten.');
            }
          } catch (error) {
            console.error("[ERROR][DynamicFormScreen] Submission catch error:", error);
            Alert.alert('Fehler', 'Beim Senden des Formulars ist ein Fehler aufgetreten: ' + error.message);
          }
        },
      },
    ]);
  };

  // Lädt die Bilder zum Formular hoch
  const uploadImages = async (formResponseId) => {
    const totalImageCount = getTotalImageCount();
    if (totalImageCount === 0) {
      console.log("[DEBUG][DynamicFormScreen] Keine Bilder zum Hochladen");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      const formDataObj = new FormData();

      let imageCounter = 1;
      for (const [qId, imgArray] of Object.entries(images)) {
        if (!Array.isArray(imgArray)) continue;
        for (const imageData of imgArray) {
          if (imageCounter > 15) break;
          const uri = imageData.uri;
          if (!uri) {
            console.warn("[DEBUG][DynamicFormScreen] Bild ohne gültige URI übersprungen", imageData);
            continue;
          }
          const filenameFromUri = uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filenameFromUri);
          const extension = match ? match[1] : 'jpg';
          const type = match ? `image/${match[1]}` : `image`;
          const sanitizedUserName = sanitizeFilename(imageData.name);
          const uniqueIdentifier = Date.now() + imageCounter;
          const filename = `${sanitizedUserName}_${uniqueIdentifier}.${extension}`;

          formDataObj.append(`image_${imageCounter}`, {
            uri,
            name: filename,
            type,
          });
          imageCounter++;
        }
      }

      const resp = await fetch(`${BASE_URL}/api/form-responses/${formResponseId}/upload_images/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
        body: formDataObj,
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("[ERROR][DynamicFormScreen] Fehler beim Hochladen der Bilder:", errorText);
        throw new Error('Fehler beim Hochladen der Bilder.');
      } else {
        const result = await resp.json();
        console.log("[DEBUG][DynamicFormScreen] Bilder erfolgreich hochgeladen:", result);
      }
    } catch (err) {
      console.error("[ERROR][DynamicFormScreen] Fehler beim Hochladen der Bilder:", err);
      Alert.alert('Fehler', 'Beim Hochladen der Bilder ist ein Fehler aufgetreten.');
    }
  };

  // -----------------------------
  // 11) Formular zurücksetzen
  // -----------------------------
  // Löscht alle Eingaben im Formular
  const clearForm = async () => {
    Alert.alert('Bestätigung', 'Möchtest du das Formular wirklich leeren?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Leeren',
        onPress: async () => {
          setResponses({});
          setImages({});
          setPickerSelections({});
          setScaleValues({});
          setTimestamps({});
          setCollapsed({});
          setNote('');
          setNoteTimestamps([]);

          await AsyncStorage.removeItem(`responses_${formName}`);
          await AsyncStorage.removeItem(`images_${formName}`);
          await AsyncStorage.removeItem(`pickerSelections_${formName}`);
          await AsyncStorage.removeItem(`scaleValues_${formName}`);
          await AsyncStorage.removeItem(`timestamps_${formName}`);
          await AsyncStorage.removeItem(`collapsed_${formName}`);
          await AsyncStorage.removeItem(`note_${formName}`);
          await AsyncStorage.removeItem(`noteTimestamps_${formName}`);

          Alert.alert('Erfolg', 'Formular erfolgreich geleert.');
        },
      },
    ]);
  };

  // -----------------------------
  // 12) Navigation in Fragen
  // -----------------------------
  // Scrollt zur nächsten Frage
  const scrollToNextQuestion = () => {
    if (!scrollViewRef.current || !questionIds.length) return;
    const currentPos = currentScrollPosition;
    for (let i = 0; i < questionIds.length; i++) {
      const qId = questionIds[i];
      const layout = questionLayouts[qId];
      if (layout && layout.y > currentPos && !collapsed[qId]) {
        scrollViewRef.current.scrollTo({ y: layout.y, animated: true });
        break;
      }
    }
  };

  // Scrollt zur vorherigen Frage
  const scrollToPreviousQuestion = () => {
    if (!scrollViewRef.current || !questionIds.length) return;
    const currentPos = currentScrollPosition;
    for (let i = questionIds.length - 1; i >= 0; i--) {
      const qId = questionIds[i];
      const layout = questionLayouts[qId];
      if (layout && layout.y < currentPos && !collapsed[qId]) {
        scrollViewRef.current.scrollTo({ y: layout.y, animated: true });
        break;
      }
    }
  };

  // -----------------------------
  // 13) Fragensuchfunktion
  // -----------------------------
  // Sucht nach Fragen basierend auf dem Suchbegriff
  const handleSearch = () => {
    if (!searchQuery) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Suchbegriff ein.');
      return;
    }
    const lower = searchQuery.toLowerCase();
    let questionIndex = null;
    const numberMatch = lower.match(/\d+/);
    if (numberMatch) {
      const idx = parseInt(numberMatch[0], 10) - 1;
      if (idx >= 0 && idx < formData.questions.length) questionIndex = idx;
    }
    if (questionIndex === null) {
      questionIndex = formData.questions.findIndex((q) =>
        q.question_text.toLowerCase().includes(lower)
      );
    }
    if (questionIndex !== -1 && questionIndex !== null) {
      const questionId = formData.questions[questionIndex].id;
      const layout = questionLayouts[questionId];
      setCollapsed((prev) => ({ ...prev, [questionId]: false }));
      if (layout && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: layout.y, animated: true });
        setSearchVisible(false);
      } else {
        Alert.alert('Fehler', 'Frage nicht gefunden oder nicht verfügbar.');
      }
    } else {
      Alert.alert('Fehler', 'Frage nicht gefunden.');
    }
  };

  // -----------------------------
  // 14) Notizverwaltung
  // -----------------------------
  // Fügt einen Zeitstempel zur allgemeinen Notiz hinzu
  const addNoteTimestamp = () => {
    const newTimestamp = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      note: '',
    };
    setNoteTimestamps((prev) => [...prev, newTimestamp]);
  };

  // Aktualisiert die Notiz eines Zeitstempels
  const onNoteTimestampChange = (tsId, newNote) => {
    setNoteTimestamps((prev) =>
      prev.map((ts) => (ts.id === tsId ? { ...ts, note: newNote } : ts))
    );
  };

  // Entfernt einen Zeitstempel von der Notiz
  const removeNoteTimestamp = (tsId) => {
    setNoteTimestamps((prev) => prev.filter((ts) => ts.id !== tsId));
  };

  // Zeigt den DatePicker für einen Notiz-Zeitstempel
  const showNoteDatePicker = (tsId) => {
    setEditingTimestampQuestionId('note');
    setEditingTimestampId(tsId);
    setIsDatePickerVisible(true);
  };

  // Rendert die Zeitstempel für die allgemeine Notiz
  const renderNoteTimestamps = () => {
    if (!Array.isArray(noteTimestamps)) return null;
    return (
      <View style={styles.timestampDisplayContainer}>
        {noteTimestamps.map((ts, idx) => (
          <View key={ts.id} style={styles.timestampItem}>
            <Text style={styles.timestampText}>{`Zeitstempel ${idx + 1}: ${ts.timestamp}`}</Text>
            <TextInput
              style={styles.timestampNoteInput}
              value={ts.note}
              placeholder="Notiz hinzufügen"
              onChangeText={(text) => onNoteTimestampChange(ts.id, text)}
            />
            <View style={styles.timestampButtonsContainer}>
              <TouchableOpacity
                onPress={() => showNoteDatePicker(ts.id)}
                style={styles.timestampEditButton}
              >
                <Icon name="edit" size={20} color="white" />
                <Text style={styles.timestampEditButtonText}>Bearbeiten</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeNoteTimestamp(ts.id)}
                style={styles.timestampRemoveButton}
              >
                <Icon name="trash" size={20} color="white" />
                <Text style={styles.timestampRemoveButtonText}>Entfernen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // -----------------------------
  // 15) Bildanzeige-Modal
  // -----------------------------
  // Rendert das Modal zur Vollbildanzeige von Bildern
  const renderImageModal = () => {
    if (!selectedQuestionId) return null;
    const arr = images[selectedQuestionId] || [];
    return (
      <Modal visible={isImageModalVisible} transparent={true}>
        <View style={styles.modalBackground}>
          <FlatList
            data={arr}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedImageIndex}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.fullscreenImageContainer}>
                {item.name ? (
                  <Text style={styles.fullscreenImageDescription}>{item.name}</Text>
                ) : null}
                <Image source={{ uri: item.uri }} style={styles.fullscreenImage} />
              </View>
            )}
            getItemLayout={(data, idx) => ({
              length: width,
              offset: width * idx,
              index: idx,
            })}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise((resolve) => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            ref={flatListRef}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setImageModalVisible(false)}>
            <Text style={styles.closeButtonText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // -----------------------------
  // 16) Hauptkomponenten-Rendering
  // -----------------------------
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        onScroll={(event) => setCurrentScrollPosition(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {formData ? (
          <>
            {/* Header */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{formName}</Text>
              <View style={styles.formDescriptionContainer}>
                <Text style={styles.formDescriptionText}>{formData.description_form}</Text>
              </View>
            </View>

            {/* Haupt-Fragen */}
            {formData.questions.map((question, idx) => renderQuestionInput(question, idx))}

            <View style={{ height: 100 }} />

            {/* Buttons unten */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={clearForm} style={styles.clearButton}>
                <Icon name="trash" size={20} color="#fff" />
                <Text style={styles.clearButtonText}>Formular leeren</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                <Icon name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Formular absenden</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 50 }} />
          </>
        ) : (
          <Text>Loading...</Text>
        )}
      </ScrollView>

      {/* Scroll-Navigation */}
      <View style={styles.navigationButtonsContainer}>
        <TouchableOpacity onPress={scrollToPreviousQuestion} style={styles.navigationButton}>
          <Icon name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={scrollToNextQuestion} style={styles.navigationButton}>
          <Icon name="arrow-down" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Aktionen (FAB) */}
      {isActionMenuOpen && (
        <View style={styles.actionMenuContainer}>
          <TouchableOpacity
            onPress={() => {
              setIsActionMenuOpen(false);
              saveResponsesToStorage(true);
            }}
            style={styles.actionMenuButton}
          >
            <Icon name="save" size={20} color="white" />
            <Text style={styles.actionMenuButtonText}>Speichern & verlassen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setIsActionMenuOpen(false);
              setNoteVisible(true);
            }}
            style={styles.actionMenuButton}
          >
            <Icon name="sticky-note" size={20} color="white" />
            <Text style={styles.actionMenuButtonText}>Notiz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setIsActionMenuOpen(false);
              setSearchVisible(true);
            }}
            style={styles.actionMenuButton}
          >
            <Icon name="search" size={20} color="white" />
            <Text style={styles.actionMenuButtonText}>Fragen‑Suche</Text>
          </TouchableOpacity>
          {formData && formData.show_patient_profile_search && (
            <TouchableOpacity
              onPress={() => {
                setIsActionMenuOpen(false);
                setQuickSearchVisible(true);
              }}
              style={styles.actionMenuButton}
            >
              <Icon name="search" size={20} color="white" />
              <Text style={styles.actionMenuButtonText}>Patientenprofil‑Suche</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={() => setIsActionMenuOpen(!isActionMenuOpen)}
        style={styles.fabButton}
      >
        <Icon name="bars" size={24} color="white" />
      </TouchableOpacity>

      {/* Notiz-Popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={noteVisible}
        onRequestClose={() => setNoteVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTextHeader}>
              Hier können Sie Notizen zum Formular machen.
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              onChangeText={setNote}
              value={note}
              placeholder="Notiz hier eingeben"
              style={styles.modalTextInput}
            />
            <TouchableOpacity onPress={addNoteTimestamp} style={styles.timestampButton}>
              <Icon name="clock-o" size={20} color="white" />
              <Text style={styles.timestampButtonText}>Zeitstempel hinzufügen</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 300 }}>
              {renderNoteTimestamps()}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setNoteVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fragen-Suche Popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={searchVisible}
        onRequestClose={() => setSearchVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredView}
        >
          <View style={styles.searchModalView}>
            <Text style={styles.searchModalHeader}>Fragensuche</Text>
            <Text style={styles.searchModalHint}>
              Sie können nach der Fragennummer oder nach einzelnen Wörtern aus einer Frage suchen.
            </Text>
            <TextInput
              onChangeText={setSearchQuery}
              value={searchQuery}
              placeholder="Frage oder Nummer eingeben"
              style={styles.searchModalInput}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.searchModalButton} onPress={handleSearch}>
              <Text style={styles.searchModalButtonText}>Suchen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSearchVisible(false)}
              style={styles.searchModalCloseButton}
            >
              <Text style={styles.searchModalCloseButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DateTimePicker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleDateConfirm}
        onCancel={handleTimeCancel}
        locale="de_DE"
        headerTextIOS="Datum und Uhrzeit auswählen"
        themeVariant="light"
        textColor="black"
      />

      {/* Bild-Vollanzeige */}
      {isImageModalVisible && renderImageModal()}

      {/* Automatisches Speichern-Indikator */}
      {isSaving && (
        <View style={styles.savingContainer}>
          <Icon name="save" size={20} color="white" />
          <Text style={styles.savingText}>Automatisch gespeichert</Text>
        </View>
      )}

      {/* Patientenprofil-Suche */}
      <QuickSearchModal
        visible={quickSearchVisible}
        onClose={() => setQuickSearchVisible(false)}
        onSelectProfile={(profile) => {
          console.log('Profil ausgewählt:', profile);
          // Hier ggf. Logik zum Einfügen der Profildaten in die Form-Antwort
        }}
        searchEndpoint={`${BASE_URL}/api/test-scenario-victims/`}
      />
    </View>
  );
};

export default DynamicFormScreen;




















