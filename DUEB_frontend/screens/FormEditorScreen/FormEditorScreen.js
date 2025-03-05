/**
 * FormEditorScreen.js
 * 
 * Diese Komponente ermöglicht das Erstellen und Bearbeiten von Formularen in der DÜB-Anwendung.
 * Sie stellt eine Benutzeroberfläche bereit, mit der Administratoren neue Fragen erstellen
 * und verschiedene Antworttypen (Checkboxen, Dropdown-Listen, Skalen, Eingabefelder und Bildupload)
 * hinzufügen können.
 */

// ------------------------------------------------
// 1) IMPORTE UND BASISKONFIGURATION
// ------------------------------------------------
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';

// Importiere die Styles
import styles from './FormEditorScreenStyle';

// Import der Konfigurationswerte
import { BASE_URL } from './../../config';

// Erstellen der API-URL basierend auf BASE_URL
const API_URL = `${BASE_URL}/api/forms/`;

// ------------------------------------------------
// 2) HILFSKOMPONENTEN FÜR ANTWORTTYPEN
// ------------------------------------------------

/**
 * OptionComponent - Stellt eine einzelne Option für Checkbox oder Dropdown dar
 * Ermöglicht die Bearbeitung des Labels und das Löschen der Option
 */
const OptionComponent = ({ label, onLabelChange, onDelete, placeholder, symbol }) => (
  <View style={styles.optionComponentContainer}>
    <Text style={styles.optionSymbol}>{symbol}</Text>
    <TextInput
      style={styles.optionInput}
      onChangeText={onLabelChange}
      value={label}
      placeholder={placeholder}
    />
    <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
      <Icon name="trash" size={20} color="#ff5c5c" />
    </TouchableOpacity>
  </View>
);

/**
 * StaticInputComponent - Zeigt ein nicht-editierbares Eingabefeld an
 * Dient als Platzhalter für das endgültige Eingabefeld im Formular
 */
const StaticInputComponent = ({ onRemoveInputField }) => (
  <View style={styles.optionComponentContainer}>
    <TextInput
      style={[styles.optionInput, { flex: 1 }]}
      editable={false}
      placeholder="Eingabefeld für den Nutzer"
    />
    <TouchableOpacity onPress={onRemoveInputField} style={styles.deleteButton}>
      <Icon name="trash" size={20} color="#ff5c5c" />
    </TouchableOpacity>
  </View>
);

/**
 * ScaleComponent - Stellt eine numerische Skala von 1-10 dar
 * Wird für Bewertungsfragen verwendet
 */
const ScaleComponent = ({ onRemoveScale }) => (
  <View style={styles.scaleContainer}>
    <View style={styles.scaleNumbersContainer}>
      {[...Array(10).keys()].map((number) => (
        <View key={number} style={styles.scaleNumberContainer}>
          <Text style={styles.scaleNumber}>{number + 1}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity onPress={onRemoveScale} style={styles.scaleDeleteButton}>
      <Icon name="trash" size={20} color="#ff5c5c" />
      <Text style={styles.scaleDeleteButtonText}>Skala entfernen</Text>
    </TouchableOpacity>
  </View>
);

/**
 * ImageComponent - Stellt ein Bild-Upload-Feld dar
 * Ermöglicht dem Benutzer das Hochladen von Bildern im Formular
 */
const ImageComponent = ({ onRemoveImage }) => (
  <View style={styles.imageContainer}>
    <Icon name="picture-o" size={30} color="#000" />
    <TouchableOpacity onPress={onRemoveImage} style={styles.imageDeleteButton}>
      <Icon name="trash" size={20} color="#ff5c5c" />
      <Text style={styles.imageDeleteButtonText}>Bild entfernen</Text>
    </TouchableOpacity>
  </View>
);

// ------------------------------------------------
// 3) HAUPTKOMPONENTE FÜR FRAGEN
// ------------------------------------------------

/**
 * QuestionComponent - Hauptkomponente für die Bearbeitung einer einzelnen Frage
 * Ermöglicht die Eingabe von Fragetexten, Zusatzinfos und Hinweisen
 * Bietet Schaltflächen zum Hinzufügen verschiedener Antworttypen
 */
const QuestionComponent = ({
  id,
  question,
  onChangeQuestion,
  additionalInfo,
  onChangeAdditionalInfo,
  hint,
  onChangeHint, 
  onDelete,
  options,
  onAddOption,
  onLabelChange,
  onDeleteOption,
  onAddScale,
  scaleAdded,
  onRemoveScale,
  questionNumber,
  optionType,
  inputFieldAdded,
  onAddInputField,
  onRemoveInputField,
  imageAdded,
  onAddImageField,
  onRemoveImageField,
}) => {
  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionHeader}>Frage {questionNumber}:</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => onChangeQuestion(id, text)}
        value={question}
        placeholder="Frage eingeben (Pflichtfeld)"
      />
      <TextInput
        style={styles.additionalInfoInput}
        onChangeText={(text) => onChangeAdditionalInfo(id, text)}
        value={additionalInfo}
        placeholder="Weitere Informationen (optional)"
      />
      {/* Eingabefeld für Hinweise aus dem KAP */}
      <TextInput
        style={styles.hintInput}
        onChangeText={(text) => onChangeHint(id, text)}
        value={hint}
        placeholder="Hinweise aus dem KAP eingeben (optional)"
      />
      
      {/* Bestehende Optionen anzeigen */}
      {options.map((option, index) => (
        <OptionComponent
          key={option.id || index}
          label={option.label}
          onLabelChange={(text) => onLabelChange(id, option.id, text)}
          onDelete={() => onDeleteOption(id, option.id)}
          placeholder={optionType === 'checkbox' ? 'Checkbox-Beschriftung (Pflichtfeld)' : 'Auswahlantwort (Pflichtfeld)'}
          symbol={optionType === 'checkbox' ? '🔲' : '⬇️'}
        />
      ))}
      
      {/* Eingabefeld anzeigen, falls aktiviert */}
      {inputFieldAdded && (
        <StaticInputComponent onRemoveInputField={() => onRemoveInputField(id)} />
      )}
      
      {/* Steuerelemente für Antworttypen */}
      <View style={styles.buttonsContainer}>
        {!inputFieldAdded && (
          <TouchableOpacity onPress={() => onAddInputField(id)} style={styles.addButton}>
            <Icon name="keyboard-o" size={20} color="white" />
            <Text style={styles.addButtonText}>Texteingabefeld</Text>
          </TouchableOpacity>
        )}
        {(optionType === 'none' || optionType === 'checkbox') && !scaleAdded && (
          <TouchableOpacity onPress={() => onAddOption(id, 'checkbox')} style={styles.addButton}>
            <Icon name="check-square-o" size={20} color="white" />
            <Text style={styles.addButtonText}>Checkbox</Text>
          </TouchableOpacity>
        )}
        {(optionType === 'none' || optionType === 'dropdown') && !scaleAdded && (
          <TouchableOpacity onPress={() => onAddOption(id, 'dropdown')} style={styles.addButton}>
            <Icon name="caret-square-o-down" size={20} color="white" />
            <Text style={styles.addButtonText}>Auswahlantwort</Text>
          </TouchableOpacity>
        )}
        {!scaleAdded && optionType === 'none' && (
          <TouchableOpacity onPress={() => onAddScale(id)} style={styles.addButton}>
            <Icon name="signal" size={20} color="white" />
            <Text style={styles.addButtonText}>Skala</Text>
          </TouchableOpacity>
        )}
        {!imageAdded && (
          <TouchableOpacity onPress={() => onAddImageField(id)} style={styles.addButton}>
            <Icon name="picture-o" size={20} color="white" />
            <Text style={styles.addButtonText}>Bildeingabefeld</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Skala anzeigen, falls aktiviert */}
      {scaleAdded && <ScaleComponent onRemoveScale={() => onRemoveScale(id)} />}
      
      {/* Bild-Upload anzeigen, falls aktiviert */}
      {imageAdded && <ImageComponent onRemoveImage={() => onRemoveImageField(id)} />}
      
      {/* Löschen-Button für die gesamte Frage */}
      <TouchableOpacity onPress={() => onDelete(id)} style={styles.rightAlignDeleteButton}>
        <Icon name="trash" size={20} color="white" />
        <Text style={styles.fullQuestionDeleteButtonText}>Frage löschen</Text>
      </TouchableOpacity>
    </View>
  );
};

// ------------------------------------------------
// 4) HAUPTKOMPONENTE: FORMULAR-EDITOR
// ------------------------------------------------
const FormEditorScreen = ({ route, navigation }) => {
  // ------------------------------------------------
  // 4.1) STATE-VARIABLEN UND INITIALISIERUNG
  // ------------------------------------------------
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  // Hinweis: Der Zugangscode-Bereich wurde entfernt (kein access_code mehr)
  const { role } = route.params;

  // Standardwerte für formId und mode, falls keine Parameter übergeben wurden
  const formId = route.params?.formId ?? null;
  const mode = route.params?.mode ?? 'create';

  // Zusätzlicher State für die Patientenprofil-Suche
  const [showPatientProfileSearch, setShowPatientProfileSearch] = useState(false);

  // Initialer State für Fragen - beginnt mit einer leeren Frage
  const [questions, setQuestions] = useState([
    {
      id: Math.random().toString(),
      question: '',
      additionalInfo: '',
      hint: '',
      options: [],
      scaleAdded: false,
      optionType: 'none',
      inputFieldAdded: false,
      imageAdded: false,
    },
  ]);

  // ------------------------------------------------
  // 4.2) DATEN LADEN (BEI BEARBEITUNG)
  // ------------------------------------------------
  useEffect(() => {
    if (mode === 'edit' && formId) {
      loadFormData(formId);
    }
  }, [formId, mode]);

  /**
   * Lädt die Formulardaten vom Server für die Bearbeitung
   */
  const loadFormData = async (formId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}${formId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorInfo = '';
        try {
          const errorResponse = await response.json();
          errorInfo = JSON.stringify(errorResponse);
        } catch (jsonError) {
          errorInfo = response.statusText;
        }
        throw new Error(`Network response was not ok: ${response.status} ${errorInfo}`);
      }

      const formData = await response.json();

      // Basisdaten des Formulars setzen
      setFormName(formData.name);
      setFormDescription(formData.description_form);
      setShowPatientProfileSearch(formData.show_patient_profile_search);
      
      // Fragen konvertieren und in den State setzen
      const convertedQuestions = formData.questions.map((question) => ({
        id: question.id.toString(),
        question: question.question_text,
        additionalInfo: question.description_question || '',
        hint: question.hint || '',
        options: question.options || [],
        scaleAdded: question.option_type === 'scale',
        optionType: question.option_type,
        inputFieldAdded: question.input_field_added,
        imageAdded: question.image_upload_desired,
      }));

      setQuestions(convertedQuestions);
    } catch (error) {
      console.error('Failed to load form data:', error);
      Alert.alert('Fehler', `Fehler beim Laden des Formulars: ${error.message}`);
    }
  };

  // ------------------------------------------------
  // 4.3) FUNKTIONEN ZUR FRAGENBEARBEITUNG
  // ------------------------------------------------
  
  /**
   * Fügt eine neue leere Frage hinzu
   */
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(),
        question: '',
        additionalInfo: '',
        hint: '',
        options: [],
        scaleAdded: false,
        optionType: 'none',
        inputFieldAdded: false,
        imageAdded: false,
      },
    ]);
  };

  /**
   * Aktualisiert den Text einer Frage
   */
  const handleQuestionChange = (id, text) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, question: text } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Aktualisiert den Hinweis-Text einer Frage
   */
  const handleHintChange = (questionId, newText) => {
    const updatedQuestions = questions.map((question) =>
      question.id === questionId ? { ...question, hint: newText } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Fügt eine neue Option zu einer Frage hinzu (Checkbox oder Dropdown)
   */
  const handleAddOption = (questionId, type) => {
    const updatedQuestions = questions.map((question) => {
      if (question.id === questionId) {
        const newOption = {
          id: Math.random().toString(),
          type: type,
          label: '',
        };
        return { ...question, options: [...question.options, newOption], optionType: type };
      }
      return question;
    });
    setQuestions(updatedQuestions);
  };

  /**
   * Fügt ein Texteingabefeld zu einer Frage hinzu
   */
  const handleAddInputField = (id) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, inputFieldAdded: true } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Aktualisiert die Beschriftung einer Option
   */
  const handleLabelChange = (questionId, optionId, text) => {
    const updatedQuestions = questions.map((question) => {
      if (question.id === questionId) {
        const updatedOptions = question.options.map((option) =>
          option.id === optionId ? { ...option, label: text } : option
        );
        return { ...question, options: updatedOptions };
      }
      return question;
    });
    setQuestions(updatedQuestions);
  };

  /**
   * Löscht eine Option aus einer Frage
   */
  const handleDeleteOption = (questionId, optionId) => {
    const updatedQuestions = questions.map((question) => {
      if (question.id === questionId) {
        const filteredOptions = question.options.filter((option) => option.id !== optionId);
        return {
          ...question,
          options: filteredOptions,
          optionType: filteredOptions.length > 0 ? question.optionType : 'none',
        };
      }
      return question;
    });
    setQuestions(updatedQuestions);
  };

  /**
   * Fügt eine Bewertungsskala zu einer Frage hinzu
   */
  const handleAddScale = (id) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, scaleAdded: true, optionType: 'scale' } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Entfernt eine Bewertungsskala von einer Frage
   */
  const handleRemoveScale = (id) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, scaleAdded: false, optionType: 'none' } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Löscht eine komplette Frage
   */
  const handleDeleteQuestion = (id) => {
    const filteredQuestions = questions.filter((question) => question.id !== id);
    setQuestions(filteredQuestions);
  };

  /**
   * Entfernt ein Texteingabefeld von einer Frage
   */
  const handleRemoveInputField = (id) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, inputFieldAdded: false } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Fügt ein Bild-Upload-Feld zu einer Frage hinzu
   */
  const handleAddImageField = (id) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, imageAdded: true } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Entfernt ein Bild-Upload-Feld von einer Frage
   */
  const handleRemoveImageField = (id) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, imageAdded: false } : question
    );
    setQuestions(updatedQuestions);
  };

  /**
   * Aktualisiert die Zusatzinformationen einer Frage
   */
  const handleAdditionalInfoChange = (questionId, newText) => {
    const updatedQuestions = questions.map((question) =>
      question.id === questionId ? { ...question, additionalInfo: newText } : question
    );
    setQuestions(updatedQuestions);
  };

  // ------------------------------------------------
  // 4.4) FORMULAR-VALIDIERUNG UND ABSENDEN
  // ------------------------------------------------
  
  /**
   * Hauptfunktion zum Absenden des Formulars
   * Bei Bearbeitung: Löscht zuerst das bestehende Formular und erstellt ein neues
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Beim Bearbeiten: Lösche zuerst das existierende Formular
    if (mode === 'edit' && formId) {
      try {
        await deleteExistingForm(formId);
      } catch (error) {
        Alert.alert('Fehler', `Fehler beim Löschen des existierenden Formulars: ${error.message}`);
        return;
      }
    }

    // Erstelle das Formular (neu oder aktualisiert)
    try {
      await createOrUpdateForm({
        name: formName,
        description_form: formDescription,
        // Hinweis: access_code wird nicht mehr benötigt
        show_patient_profile_search: showPatientProfileSearch,
        questions: questions.map((question) => ({
          question_text: question.question,
          description_question: question.additionalInfo,
          hint: question.hint,
          option_type: question.optionType,
          input_field_added: question.inputFieldAdded,
          image_upload_desired: question.imageAdded,
          options: question.options.map((option) => ({ label: option.label })),
        })),
      });
    } catch (error) {
      Alert.alert('Fehler', `Fehler beim Senden des Formulars: ${error.message}`);
    }
  };

  /**
   * Löscht ein bestehendes Formular vom Server
   */
  const deleteExistingForm = async (formId) => {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}${formId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete existing form.');
    }
    console.log('Existing form deleted successfully.');
  };

  /**
   * Erstellt oder aktualisiert ein Formular auf dem Server
   */
  const createOrUpdateForm = async (formData) => {
    console.log('Sending formData:', formData);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Network response was not ok: ${JSON.stringify(errorResponse)}`);
      }

      const responseData = await response.json();
      console.log('Form successfully submitted', responseData);
      Alert.alert('Erfolg', 'Formulardaten erfolgreich hochgeladen.', [
        { text: 'OK', onPress: () => navigation.navigate('Home', { role: role }) },
      ]);
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Fehler', `Daten konnten nicht hochgeladen werden: ${error.message}`);
    }
  };

  /**
   * Überprüft, ob das Formular gültig ist
   */
  const validateForm = () => {
    if (!formName.trim()) {
      Alert.alert('Fehler', 'Formularname ist erforderlich.');
      return false;
    }
    // Hinweis: Die access_code-Prüfung entfällt

    // Prüfen, ob alle Fragen ausgefüllt sind
    for (const question of questions) {
      if (!question.question.trim()) {
        Alert.alert('Fehler', 'Jede Frage muss ausgefüllt sein.');
        return false;
      }
      // Prüfen, ob alle Optionen ausgefüllt sind
      if (
        question.optionType !== 'none' &&
        question.options.some((option) => !option.label.trim())
      ) {
        Alert.alert('Fehler', 'Alle Optionen müssen ausgefüllt sein.');
        return false;
      }
    }
    return true;
  };

  /**
   * Zeigt einen Hilfetext zu den Funktionen des Formulareditors an
   */
  const showInfoAlert = () => {
    Alert.alert(
      'Hilfe & Hinweise',
      'In diesem Formular kannst du ein individuelles Formular für Umfragen erstellen. Hier findest du eine Übersicht über die Funktionen und Regeln:\n\n' +
        'Funktionen:\n' +
        '- "Eingabefeld hinzufügen": Ermöglicht es dem Nutzer, Textantworten einzugeben.\n\n' +
        '- "Checkbox hinzufügen": Ermöglicht das Hinzufügen von Checkboxen für Mehrfachauswahl-Optionen.\n\n' +
        '- "Auswahlantwort hinzufügen": Fügt im Formular ein Auswahlmenü ein. Die möglichen Antworten des Nutzers werden durch die Eingaben definiert.\n\n' +
        '- "Skala hinzufügen": Fügt eine Bewertungsskala von 1 bis 10 hinzu.\n\n' +
        '- "Bild hinzufügen": Ermöglicht es, dass der Nutzer bei der Beantwortung der Frage Bilder hochladen kann.\n\n' +
        'Einschränkungen:\n' +
        '- Eine Frage kann nur einen dieser Antworttypen enthalten.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Prüft, ob ein Formularname bereits existiert
   */
  const checkFormNameExists = async (name) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}?name=${encodeURIComponent(name)}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Netzwerkantwort war nicht ok.');
      }
      const forms = await response.json();
      return forms.length > 0;
    } catch (error) {
      console.error('Fehler beim Überprüfen des Formularnamens:', error);
      throw error;
    }
  };

  // ------------------------------------------------
  // 4.5) UI-RENDERING
  // ------------------------------------------------
  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Formularname */}
        <View style={styles.inputContainer}>
          <Text style={styles.formLabel}>Formularname:</Text>
          <TextInput
            style={styles.input}
            onChangeText={setFormName}
            value={formName}
            placeholder="Name des Formulars eingeben (Pflichtfeld)"
          />
        </View>
        
        {/* Formularbeschreibung */}
        <View style={styles.inputContainer}>
          <Text style={styles.formLabel}>Formularbeschreibung:</Text>
          <TextInput
            style={styles.input}
            onChangeText={setFormDescription}
            value={formDescription}
            placeholder="Weitere Informationen zum Formular (optional)"
            multiline
          />
        </View>
        
        {/* Checkbox für Patientenprofil-Suche */}
        <View style={styles.inputContainer}>
          <View style={styles.checkboxRow}>
            <Checkbox
              value={showPatientProfileSearch}
              onValueChange={setShowPatientProfileSearch}
              color={showPatientProfileSearch ? '#007bff' : undefined}
            />
            <Text style={styles.checkboxLabel}>Patientenprofil‑Suche anzeigen</Text>
          </View>
        </View>
        
        {/* Fragenkomponenten rendern */}
        {questions.map((q) => (
          <QuestionComponent
            key={q.id}
            id={q.id}
            question={q.question}
            additionalInfo={q.additionalInfo}
            hint={q.hint}
            onChangeQuestion={handleQuestionChange}
            onChangeAdditionalInfo={handleAdditionalInfoChange}
            onChangeHint={handleHintChange}
            onDelete={handleDeleteQuestion}
            options={q.options}
            onAddOption={handleAddOption}
            onLabelChange={handleLabelChange}
            onDeleteOption={handleDeleteOption}
            onAddScale={handleAddScale}
            scaleAdded={q.scaleAdded}
            onRemoveScale={handleRemoveScale}
            questionNumber={questions.findIndex((question) => question.id === q.id) + 1}
            optionType={q.optionType}
            inputFieldAdded={q.inputFieldAdded}
            onAddInputField={handleAddInputField}
            onRemoveInputField={handleRemoveInputField}
            onAddImageField={handleAddImageField}
            onRemoveImageField={handleRemoveImageField}
            imageAdded={q.imageAdded}
          />
        ))}
        
        {/* Button zum Hinzufügen einer neuen Frage */}
        <TouchableOpacity onPress={handleAddQuestion} style={styles.addQuestionButton}>
          <Text style={styles.addQuestionButtonText}>Frage hinzufügen</Text>
        </TouchableOpacity>
        
        {/* Extraplatz für Scrolling */}
        <View style={{ height: 500 }}></View>
      </ScrollView>
      
      {/* Hilfe-Button und Absenden-Button */}
      <View style={styles.infoIconContainer}>
        <TouchableOpacity onPress={showInfoAlert}>
          <Icon name="info-circle" size={40} color="green" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Formular senden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FormEditorScreen;




