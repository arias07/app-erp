/**
 * Componente de Interfaz del Asistente de Voz con IA
 * Permite interacciones por voz y texto con el ERP
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  IconButton,
  ActivityIndicator,
  Portal,
  Modal,
  Surface,
  Chip,
  DataTable,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { voiceAssistantService } from '../services/voice-assistant.service';
import {
  speechSynthesisService,
  speechRecognitionService,
} from '../services/speech.service';
import type {
  VoiceAssistantResponse,
  ResponseData,
  UserContext,
} from '../types/voice-assistant.types';
import { COLORS } from '../constants/theme';

// ============================================================================
// TIPOS
// ============================================================================

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  data?: ResponseData;
  timestamp: Date;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const VoiceAssistant: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  // Estado
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(true);

  // Referencias
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingAnimation = useRef(new Animated.Value(0)).current;

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    // Mensaje de bienvenida
    if (messages.length === 0) {
      addAssistantMessage(
        '¡Hola! Soy tu asistente de voz. Puedes preguntarme sobre órdenes de mantenimiento, inventario, bitácoras y más. ¿En qué puedo ayudarte?'
      );
    }
  }, []);

  useEffect(() => {
    // Animar el botón de grabación
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingAnimation.setValue(0);
    }
  }, [isRecording]);

  // ============================================================================
  // FUNCIONES DE MENSAJES
  // ============================================================================

  const addUserMessage = (text: string): void => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  };

  const addAssistantMessage = (text: string, data?: ResponseData): void => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      text,
      data,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // ============================================================================
  // FUNCIONES DE VOZ
  // ============================================================================

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await speechRecognitionService.startRecording();
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      alert('Error al iniciar la grabación. Verifica los permisos del micrófono.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioUri = await speechRecognitionService.stopRecording();
      setIsRecording(false);

      if (!audioUri) {
        alert('No se pudo grabar el audio');
        return;
      }

      // NOTA: Aquí debería transcribir el audio
      // Por ahora, mostrar un placeholder
      alert(
        'Grabación completada. La transcripción automática requiere ' +
        'configurar un servicio de Speech-to-Text. Por favor, escribe tu pregunta.'
      );

      // TODO: Implementar transcripción
      // const transcription = await speechRecognitionService.transcribeAudio(audioUri);
      // handleSendMessage(transcription);
    } catch (error) {
      console.error('Error al detener grabación:', error);
      setIsRecording(false);
    }
  };

  const handleSpeak = async (text: string) => {
    try {
      setIsSpeaking(true);
      await speechSynthesisService.speakAssistantResponse(text);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error al hablar:', error);
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = async () => {
    try {
      await speechSynthesisService.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error al detener voz:', error);
    }
  };

  // ============================================================================
  // FUNCIONES DE PROCESAMIENTO
  // ============================================================================

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || !user) return;

    // Agregar mensaje del usuario
    addUserMessage(messageText);
    setInputText('');
    setIsProcessing(true);

    try {
      // Crear contexto del usuario
      const userContext: UserContext = {
        userId: user.idauth || user.id?.toString() || '',
        userName: `${user.nombres} ${user.last_name || ''}`.trim(),
        role: user.tipouser || 'empleado',
        permissions: [],
        language: 'es',
      };

      // Procesar con el asistente
      const response: VoiceAssistantResponse = await voiceAssistantService.processVoiceInput(
        messageText,
        userContext
      );

      // Agregar respuesta del asistente
      addAssistantMessage(response.message, response.data);

      // Hablar la respuesta (opcional)
      // await handleSpeak(response.message);

      // Actualizar sugerencias
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error: any) {
      console.error('Error al procesar mensaje:', error);
      addAssistantMessage(
        'Lo siento, ocurrió un error al procesar tu solicitud. ' +
        'Por favor, intenta de nuevo.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Obtener sugerencias mientras escribe
    if (text.length > 3) {
      const newSuggestions = voiceAssistantService.getSuggestions(text);
      setSuggestions(newSuggestions.slice(0, 3));
    } else {
      setSuggestions([]);
    }
  };

  // ============================================================================
  // RENDERIZADO DE COMPONENTES
  // ============================================================================

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <Surface
          style={[
            styles.messageBubble,
            isUser ? styles.userMessage : styles.assistantMessage,
          ]}
          elevation={1}
        >
          <Text style={isUser ? styles.userMessageText : styles.assistantMessageText}>
            {message.text}
          </Text>

          {!isUser && message.data && renderResponseData(message.data)}

          {!isUser && (
            <IconButton
              icon="volume-high"
              size={16}
              onPress={() => handleSpeak(message.text)}
              style={styles.speakButton}
            />
          )}
        </Surface>
      </View>
    );
  };

  const renderResponseData = (data: ResponseData) => {
    switch (data.type) {
      case 'table':
        return renderTable(data.table!);
      case 'metric':
        return renderMetrics(data.metrics!);
      case 'text':
        return <Text style={styles.dataText}>{data.text}</Text>;
      default:
        return null;
    }
  };

  const renderTable = (table: NonNullable<ResponseData['table']>) => {
    if (!table.rows || table.rows.length === 0) {
      return <Text style={styles.noDataText}>No hay datos disponibles</Text>;
    }

    return (
      <ScrollView horizontal style={styles.tableContainer}>
        <DataTable>
          <DataTable.Header>
            {table.columns.map(col => (
              <DataTable.Title key={col.key}>{col.label}</DataTable.Title>
            ))}
          </DataTable.Header>

          {table.rows.slice(0, 5).map((row, idx) => (
            <DataTable.Row key={idx}>
              {table.columns.map(col => (
                <DataTable.Cell key={col.key}>
                  {row[col.key]?.toString() || '-'}
                </DataTable.Cell>
              ))}
            </DataTable.Row>
          ))}
        </DataTable>

        {table.rows.length > 5 && (
          <Text style={styles.moreDataText}>
            +{table.rows.length - 5} más...
          </Text>
        )}
      </ScrollView>
    );
  };

  const renderMetrics = (metrics: NonNullable<ResponseData['metrics']>) => {
    return (
      <View style={styles.metricsContainer}>
        {metrics.map((metric, idx) => (
          <Card key={idx} style={styles.metricCard}>
            <Card.Content>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>
                {metric.value} {metric.unit || ''}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <ScrollView
        horizontal
        style={styles.suggestionsContainer}
        showsHorizontalScrollIndicator={false}
      >
        {suggestions.map((suggestion, idx) => (
          <Chip
            key={idx}
            onPress={() => {
              setInputText(suggestion);
              setSuggestions([]);
            }}
            style={styles.suggestionChip}
          >
            {suggestion}
          </Chip>
        ))}
      </ScrollView>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const recordingScale = recordingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Portal>
      <Modal
        visible={showModal}
        onDismiss={() => setShowModal(false)}
        contentContainerStyle={styles.modal}
      >
        <Surface style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Asistente de Voz IA</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowModal(false)}
            />
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map(renderMessage)}

            {isProcessing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Procesando...</Text>
              </View>
            )}
          </ScrollView>

          {/* Suggestions */}
          {renderSuggestions()}

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
          >
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Escribe tu pregunta o usa el micrófono..."
                value={inputText}
                onChangeText={handleInputChange}
                onSubmitEditing={() => handleSendMessage()}
                multiline
                maxLength={500}
                style={styles.input}
                disabled={isProcessing || isRecording}
                right={
                  <TextInput.Icon
                    icon="send"
                    onPress={() => handleSendMessage()}
                    disabled={!inputText.trim() || isProcessing}
                  />
                }
              />

              <Animated.View style={{ transform: [{ scale: recordingScale }] }}>
                <IconButton
                  icon={isRecording ? 'stop' : 'microphone'}
                  size={32}
                  iconColor={isRecording ? COLORS.error : COLORS.primary}
                  containerColor={isRecording ? '#ffebee' : '#e3f2fd'}
                  onPress={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isProcessing}
                  style={styles.micButton}
                />
              </Animated.View>

              {isSpeaking && (
                <IconButton
                  icon="volume-off"
                  size={32}
                  iconColor={COLORS.error}
                  onPress={handleStopSpeaking}
                  style={styles.stopSpeakButton}
                />
              )}
            </View>
          </KeyboardAvoidingView>

          {/* Info */}
          <Text style={styles.infoText}>
            {isRecording
              ? '🎤 Grabando... Toca el botón para detener'
              : 'Haz preguntas sobre órdenes, inventario, bitácoras y más'}
          </Text>
        </Surface>
      </Modal>
    </Portal>
  );
};

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: COLORS.primary,
  },
  assistantMessage: {
    backgroundColor: '#fff',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
  },
  assistantMessageText: {
    color: '#000',
    fontSize: 16,
  },
  speakButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  suggestionChip: {
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  micButton: {
    margin: 0,
  },
  stopSpeakButton: {
    marginLeft: 8,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tableContainer: {
    marginTop: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  metricCard: {
    minWidth: 100,
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  dataText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
  noDataText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  moreDataText: {
    textAlign: 'center',
    padding: 8,
    fontSize: 12,
    color: '#666',
  },
});

// ============================================================================
// COMPONENTE FLOATING ACTION BUTTON (para abrir el asistente)
// ============================================================================

export const VoiceAssistantFAB: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <IconButton
      icon="microphone"
      size={32}
      iconColor="#fff"
      containerColor={COLORS.primary}
      onPress={onPress}
      style={styles.fab}
    />
  );
};

// Estilos adicionales para el FAB
StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    elevation: 4,
  },
});
