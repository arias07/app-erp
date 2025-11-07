/**
 * Servicios de Voz (Speech-to-Text y Text-to-Speech)
 * Utiliza Expo Speech para reconocimiento y síntesis de voz
 */

import * as Speech from 'expo-speech';
import type {
  SpeechRecognitionConfig,
  SpeechSynthesisConfig,
} from '../types/voice-assistant.types';

// ============================================================================
// CONFIGURACIÓN POR DEFECTO
// ============================================================================

const DEFAULT_SPEECH_CONFIG: SpeechSynthesisConfig = {
  language: 'es-MX',
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
};

// ============================================================================
// SERVICIO DE SÍNTESIS DE VOZ (TEXT-TO-SPEECH)
// ============================================================================

class SpeechSynthesisService {
  private config: SpeechSynthesisConfig = DEFAULT_SPEECH_CONFIG;
  private isSpeaking: boolean = false;

  /**
   * Configura los parámetros de síntesis de voz
   */
  public setConfig(config: Partial<SpeechSynthesisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): SpeechSynthesisConfig {
    return { ...this.config };
  }

  /**
   * Convierte texto a voz y lo reproduce
   */
  public async speak(text: string, options?: Partial<SpeechSynthesisConfig>): Promise<void> {
    if (this.isSpeaking) {
      await this.stop();
    }

    const finalConfig = { ...this.config, ...options };

    return new Promise((resolve, reject) => {
      this.isSpeaking = true;

      Speech.speak(text, {
        language: finalConfig.language,
        pitch: finalConfig.pitch,
        rate: finalConfig.rate,
        volume: finalConfig.volume,
        voice: finalConfig.voice,
        onStart: () => {
          console.log('[SpeechSynthesis] Started speaking');
        },
        onDone: () => {
          console.log('[SpeechSynthesis] Finished speaking');
          this.isSpeaking = false;
          resolve();
        },
        onStopped: () => {
          console.log('[SpeechSynthesis] Stopped');
          this.isSpeaking = false;
          resolve();
        },
        onError: (error) => {
          console.error('[SpeechSynthesis] Error:', error);
          this.isSpeaking = false;
          reject(error);
        },
      });
    });
  }

  /**
   * Detiene la síntesis de voz actual
   */
  public async stop(): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
      this.isSpeaking = false;
    }
  }

  /**
   * Pausa la síntesis de voz (solo iOS)
   */
  public async pause(): Promise<void> {
    if (this.isSpeaking && Speech.pause) {
      await Speech.pause();
    }
  }

  /**
   * Reanuda la síntesis de voz (solo iOS)
   */
  public async resume(): Promise<void> {
    if (Speech.resume) {
      await Speech.resume();
    }
  }

  /**
   * Verifica si está hablando actualmente
   */
  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Obtiene las voces disponibles (solo iOS)
   */
  public async getAvailableVoices(): Promise<Speech.Voice[]> {
    if (Speech.getAvailableVoicesAsync) {
      const voices = await Speech.getAvailableVoicesAsync();
      // Filtrar voces en español
      return voices.filter(voice =>
        voice.language.startsWith('es')
      );
    }
    return [];
  }

  /**
   * Obtiene la voz preferida en español
   */
  public async getPreferredSpanishVoice(): Promise<string | undefined> {
    const voices = await this.getAvailableVoices();

    // Preferir voces mexicanas
    const mxVoice = voices.find(v => v.language === 'es-MX');
    if (mxVoice) return mxVoice.identifier;

    // Luego voces latinoamericanas
    const laVoice = voices.find(v =>
      ['es-AR', 'es-CO', 'es-CL'].includes(v.language)
    );
    if (laVoice) return laVoice.identifier;

    // Cualquier voz en español
    return voices[0]?.identifier;
  }

  /**
   * Habla un mensaje de respuesta del asistente
   * Limpia el texto de caracteres especiales y formatos
   */
  public async speakAssistantResponse(message: string): Promise<void> {
    // Limpiar el texto para una mejor pronunciación
    const cleanText = this.cleanTextForSpeech(message);
    await this.speak(cleanText);
  }

  /**
   * Limpia el texto para mejorar la pronunciación
   */
  private cleanTextForSpeech(text: string): string {
    return text
      // Remover URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remover emojis
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      // Remover caracteres especiales innecesarios
      .replace(/[*_~`#]/g, '')
      // Limpiar espacios múltiples
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// ============================================================================
// SERVICIO DE RECONOCIMIENTO DE VOZ (SPEECH-TO-TEXT)
// ============================================================================

/**
 * NOTA IMPORTANTE:
 * Expo no incluye un módulo nativo para Speech-to-Text (reconocimiento de voz).
 * Para implementar STT en React Native/Expo, se recomienda usar una de estas opciones:
 *
 * OPCIÓN 1 (Recomendada): Usar expo-av con una API externa
 * - Grabar audio con expo-av
 * - Enviar a API de reconocimiento (Google Speech-to-Text, Azure, AWS, etc.)
 *
 * OPCIÓN 2: Usar react-native-voice (requiere expo prebuild)
 * - npm install @react-native-voice/voice
 * - npx expo prebuild
 * - Usar APIs nativas de iOS/Android
 *
 * OPCIÓN 3: Integración con Web Speech API (solo en WebView)
 * - Usar para versión web
 *
 * A continuación se proporciona una implementación de referencia usando grabación
 * de audio que puede ser conectada a cualquier servicio de STT
 */

import { Audio } from 'expo-av';

interface RecordingState {
  isRecording: boolean;
  recording: Audio.Recording | null;
  uri: string | null;
  duration: number;
}

class SpeechRecognitionService {
  private config: SpeechRecognitionConfig = {
    language: 'es-MX',
    continuous: false,
    interimResults: false,
    maxAlternatives: 1,
  };

  private recordingState: RecordingState = {
    isRecording: false,
    recording: null,
    uri: null,
    duration: 0,
  };

  /**
   * Configura los parámetros de reconocimiento
   */
  public setConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): SpeechRecognitionConfig {
    return { ...this.config };
  }

  /**
   * Solicita permisos de micrófono
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[SpeechRecognition] Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Verifica si tiene permisos de micrófono
   */
  public async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[SpeechRecognition] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Inicia la grabación de audio
   */
  public async startRecording(): Promise<void> {
    try {
      // Verificar permisos
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Permisos de micrófono no concedidos');
        }
      }

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Crear grabación
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recordingState.recording = recording;
      this.recordingState.isRecording = true;

      console.log('[SpeechRecognition] Recording started');
    } catch (error) {
      console.error('[SpeechRecognition] Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Detiene la grabación y retorna la URI del archivo
   */
  public async stopRecording(): Promise<string | null> {
    try {
      if (!this.recordingState.recording) {
        console.warn('[SpeechRecognition] No active recording');
        return null;
      }

      await this.recordingState.recording.stopAndUnloadAsync();
      const uri = this.recordingState.recording.getURI();

      // Obtener duración
      const status = await this.recordingState.recording.getStatusAsync();
      this.recordingState.duration = status.durationMillis || 0;

      this.recordingState.uri = uri;
      this.recordingState.isRecording = false;
      this.recordingState.recording = null;

      console.log('[SpeechRecognition] Recording stopped:', uri);

      return uri;
    } catch (error) {
      console.error('[SpeechRecognition] Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * Cancela la grabación actual
   */
  public async cancelRecording(): Promise<void> {
    try {
      if (this.recordingState.recording) {
        await this.recordingState.recording.stopAndUnloadAsync();
        this.recordingState.recording = null;
        this.recordingState.isRecording = false;
        this.recordingState.uri = null;
      }
    } catch (error) {
      console.error('[SpeechRecognition] Error canceling recording:', error);
    }
  }

  /**
   * Verifica si está grabando actualmente
   */
  public getIsRecording(): boolean {
    return this.recordingState.isRecording;
  }

  /**
   * Obtiene la URI de la última grabación
   */
  public getLastRecordingUri(): string | null {
    return this.recordingState.uri;
  }

  /**
   * Obtiene la duración de la última grabación
   */
  public getLastRecordingDuration(): number {
    return this.recordingState.duration;
  }

  /**
   * PLACEHOLDER: Transcribir audio a texto
   * Esta función debe ser implementada con un servicio externo de STT
   *
   * Servicios recomendados:
   * - Google Cloud Speech-to-Text
   * - Azure Speech Services
   * - AWS Transcribe
   * - AssemblyAI
   */
  public async transcribeAudio(audioUri: string): Promise<string> {
    // TODO: Implementar integración con servicio de STT
    console.warn('[SpeechRecognition] transcribeAudio no implementado');
    console.log('[SpeechRecognition] Audio URI:', audioUri);

    throw new Error(
      'Servicio de transcripción no configurado. ' +
      'Por favor, implementa la integración con un proveedor de STT.'
    );

    /* EJEMPLO DE IMPLEMENTACIÓN CON GOOGLE CLOUD:

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    });

    const response = await fetch('YOUR_STT_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
      },
      body: formData,
    });

    const result = await response.json();
    return result.transcription;
    */
  }

  /**
   * Graba y transcribe audio en un solo paso
   */
  public async recordAndTranscribe(): Promise<string> {
    await this.startRecording();

    // Esperar a que el usuario termine (esto debería ser manejado por la UI)
    // En la práctica, se llamaría a stopRecording() desde un botón

    throw new Error(
      'Este método requiere intervención del usuario. ' +
      'Usa startRecording() y stopRecording() desde la UI.'
    );
  }
}

// ============================================================================
// EXPORTAR INSTANCIAS SINGLETON
// ============================================================================

export const speechSynthesisService = new SpeechSynthesisService();
export const speechRecognitionService = new SpeechRecognitionService();

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Inicializa los servicios de voz
 */
export async function initializeSpeechServices(): Promise<void> {
  try {
    // Configurar audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Obtener voz preferida en español
    const voice = await speechSynthesisService.getPreferredSpanishVoice();
    if (voice) {
      speechSynthesisService.setConfig({ voice });
      console.log('[SpeechServices] Voz en español configurada:', voice);
    }

    console.log('[SpeechServices] Servicios de voz inicializados');
  } catch (error) {
    console.error('[SpeechServices] Error inicializando servicios:', error);
  }
}

/**
 * Limpia los recursos de los servicios de voz
 */
export async function cleanupSpeechServices(): Promise<void> {
  try {
    await speechSynthesisService.stop();
    await speechRecognitionService.cancelRecording();
    console.log('[SpeechServices] Servicios de voz limpiados');
  } catch (error) {
    console.error('[SpeechServices] Error limpiando servicios:', error);
  }
}
