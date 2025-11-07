# 🎤 Asistente de Voz con IA para ERP

Sistema de asistente virtual con inteligencia artificial que permite a los usuarios del ERP realizar consultas, obtener reportes y análisis mediante comandos de voz o texto en lenguaje natural (español).

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Configuración de Supabase](#configuración-de-supabase)
- [Uso](#uso)
- [Comandos Disponibles](#comandos-disponibles)
- [API y Servicios](#api-y-servicios)
- [Integración](#integración)
- [Configuración de STT](#configuración-de-stt)
- [Seguridad y Permisos](#seguridad-y-permisos)
- [Troubleshooting](#troubleshooting)

---

## ✨ Características

### Funcionalidades Principales

- **🎙️ Reconocimiento de Voz**: Convierte voz a texto (requiere configuración de servicio STT)
- **🗣️ Síntesis de Voz**: Responde con voz en español mexicano
- **🧠 Procesamiento de Lenguaje Natural**: Interpreta comandos en español coloquial
- **📊 Consultas Inteligentes**: Acceso a datos del ERP mediante preguntas naturales
- **📈 Reportes y Análisis**: Generación de reportes ejecutivos y análisis de desempeño
- **🔐 Control de Acceso**: Integrado con el sistema de roles y permisos existente
- **📝 Auditoría Completa**: Registro de todas las interacciones para análisis

### Módulos Soportados

- ✅ **Órdenes de Mantenimiento**
- ✅ **Inventario y Stock**
- ✅ **Bitácoras y Mediciones**
- ✅ **Solicitudes de Compra**
- ✅ **Reportes Ejecutivos**
- ✅ **Análisis de Desempeño**

---

## 🏗️ Arquitectura

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (App Móvil)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   INTERFAZ DE VOZ (UI)                      │
│  • VoiceAssistant.tsx (Componente principal)                │
│  • VoiceAssistantScreen.tsx (Pantalla dedicada)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                        │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Speech Service  │  │  Voice Assistant │               │
│  │  • STT (Speech   │  │    Service       │               │
│  │    to Text)      │  │  • Orquestador   │               │
│  │  • TTS (Text     │  │  • Validación    │               │
│  │    to Speech)    │  │  • Auditoría     │               │
│  └──────────────────┘  └──────────────────┘               │
│           │                     │                           │
│           └──────────┬──────────┘                           │
│                      ▼                                       │
│           ┌──────────────────┐                              │
│           │   NLP Service    │                              │
│           │  • Detección de  │                              │
│           │    intenciones   │                              │
│           │  • Extracción de │                              │
│           │    entidades     │                              │
│           │  • Parámetros    │                              │
│           └──────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICIOS DEL ERP                         │
│  • ordersService (Órdenes de Mantenimiento)                 │
│  • inventoryService (Inventario)                            │
│  • bitacoraService (Bitácoras)                              │
│  • userService (Usuarios)                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (Backend)                         │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │            Tablas Principales                │          │
│  │  • ordenesmtto                               │          │
│  │  • existencias_pos / productos_pos           │          │
│  │  • bitacoras / bitacora_conceptos            │          │
│  │  • solped (solicitudes)                      │          │
│  │  • usuarios                                  │          │
│  │  • voice_interactions (auditoría)            │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │          Funciones RPC (Stored Proc)         │          │
│  │  • asistente_reporte_mantenimiento()         │          │
│  │  • asistente_reporte_inventario()            │          │
│  │  • asistente_analizar_desempeno_mtto()       │          │
│  │  • asistente_analizar_ejecutores()           │          │
│  │  • asistente_buscar_producto()               │          │
│  │  • asistente_estadisticas_generales()        │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Procesamiento

```
1. Usuario → Habla o escribe consulta
         ↓
2. Speech Service → Convierte voz a texto (si aplica)
         ↓
3. NLP Service → Detecta intención y extrae parámetros
         ↓
4. Voice Assistant Service → Valida permisos y ejecuta consulta
         ↓
5. Servicios ERP / Supabase RPC → Obtiene datos
         ↓
6. Voice Assistant Service → Estructura respuesta
         ↓
7. UI → Muestra datos visuales
         ↓
8. TTS → Responde con voz (opcional)
         ↓
9. Auditoría → Registra interacción en voice_interactions
```

---

## 📦 Instalación

### 1. Dependencias ya instaladas

```bash
# Ya instaladas en este proyecto:
npm install uuid @types/uuid
npm install expo-speech expo-av
```

### 2. Configurar Supabase

Ejecuta el script SQL en el panel de Supabase:

```bash
# El archivo está en: database/voice_assistant_setup.sql
```

**Pasos:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido de `database/voice_assistant_setup.sql`
5. Ejecuta el script (Run)
6. Verifica que se crearon:
   - Tabla `voice_interactions`
   - Funciones RPC (`asistente_*`)
   - Vistas y políticas RLS

---

## ⚙️ Configuración de Supabase

### Ejecutar Script de Base de Datos

El archivo `database/voice_assistant_setup.sql` contiene:

- ✅ Tabla de auditoría `voice_interactions`
- ✅ Funciones RPC para reportes y análisis
- ✅ Políticas de seguridad (Row Level Security)
- ✅ Vistas para estadísticas de uso

### Verificar Instalación

```sql
-- Verificar tabla
SELECT * FROM voice_interactions LIMIT 1;

-- Verificar funciones
SELECT asistente_estadisticas_generales();

-- Verificar reporte de mantenimiento
SELECT * FROM asistente_reporte_mantenimiento(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

---

## 🚀 Uso

### Integración en la Navegación

#### Opción 1: Como pantalla en el drawer/tabs

```typescript
// En navigation/DrawerNavigator.tsx o MainTabs.tsx
import { VoiceAssistantScreen } from '../screens/VoiceAssistantScreen';

// Agregar en el Drawer
<Drawer.Screen
  name="VoiceAssistant"
  component={VoiceAssistantScreen}
  options={{
    drawerLabel: 'Asistente de Voz',
    drawerIcon: ({ color }) => (
      <Icon name="microphone" size={24} color={color} />
    ),
  }}
/>
```

#### Opción 2: Como modal flotante (FAB)

```typescript
// En HomeScreen.tsx o cualquier pantalla principal
import { useState } from 'react';
import { VoiceAssistant, VoiceAssistantFAB } from '../components/VoiceAssistant';

export const HomeScreen = () => {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Tu contenido normal */}

      {/* FAB para abrir asistente */}
      <VoiceAssistantFAB onPress={() => setShowAssistant(true)} />

      {/* Modal del asistente */}
      {showAssistant && (
        <VoiceAssistant onClose={() => setShowAssistant(false)} />
      )}
    </View>
  );
};
```

#### Opción 3: Integración directa

```typescript
import { VoiceAssistant } from '../components/VoiceAssistant';

export const MiPantalla = () => {
  return (
    <View style={{ flex: 1 }}>
      <VoiceAssistant />
    </View>
  );
};
```

---

## 💬 Comandos Disponibles

### Órdenes de Mantenimiento

```
✅ "Muestra las órdenes de mantenimiento"
✅ "Dame las órdenes pendientes"
✅ "Mis órdenes asignadas"
✅ "Órdenes de tipo correctiva"
✅ "Trabajos del técnico Juan Pérez"
✅ "Órdenes de esta semana"
```

### Inventario

```
✅ "Muestra el inventario"
✅ "Productos con stock bajo"
✅ "Stock del producto ABC-123"
✅ "Inventario del almacén Monterrey"
✅ "Cuánto hay de tornillos"
```

### Bitácoras

```
✅ "Muestra las bitácoras"
✅ "Últimas mediciones"
✅ "Registros de hoy"
✅ "Historial de temperatura"
✅ "Mediciones de este mes"
```

### Solicitudes de Compra

```
✅ "Muestra las solicitudes"
✅ "Solicitudes por aprobar"
✅ "Mis solicitudes de compra"
✅ "Requisiciones pendientes"
```

### Reportes

```
✅ "Reporte de ventas de octubre"
✅ "Resumen de mantenimiento del mes"
✅ "Estado del inventario"
✅ "Resumen financiero"
✅ "Mejores clientes del trimestre"
```

### Análisis

```
✅ "Analiza el desempeño de mantenimiento"
✅ "Eficiencia de los ejecutores"
✅ "Rendimiento del técnico María"
✅ "Rotación de inventario"
```

### Búsquedas

```
✅ "Buscar producto tornillo"
✅ "Encontrar orden 1234"
✅ "Buscar usuario Juan"
```

---

## 🔌 API y Servicios

### Voice Assistant Service

```typescript
import { voiceAssistantService } from '../services/voice-assistant.service';

// Procesar una consulta
const response = await voiceAssistantService.processVoiceInput(
  "Dame las órdenes pendientes",
  userContext
);

// Obtener sugerencias
const suggestions = voiceAssistantService.getSuggestions("orden");
```

### NLP Service

```typescript
import { nlpService } from '../services/nlp.service';

// Detectar intención
const intent = await nlpService.processInput(
  "Muestra las órdenes de esta semana"
);

console.log(intent.action);      // "query_orders"
console.log(intent.parameters);  // { time: { range: "this_week" } }
```

### Speech Services

```typescript
import {
  speechSynthesisService,
  speechRecognitionService,
} from '../services/speech.service';

// Text-to-Speech
await speechSynthesisService.speak("Hola, ¿en qué puedo ayudarte?");

// Speech-to-Text (requiere configuración)
await speechRecognitionService.startRecording();
// ... usuario habla ...
const audioUri = await speechRecognitionService.stopRecording();
const text = await speechRecognitionService.transcribeAudio(audioUri);
```

---

## 🔧 Configuración de STT

### ⚠️ IMPORTANTE: Speech-to-Text

El reconocimiento de voz (STT) **NO** está implementado de manera nativa. Se requiere configurar un servicio externo.

### Servicios Recomendados

#### 1. Google Cloud Speech-to-Text (Recomendado)

**Ventajas:**
- ✅ Excelente precisión en español
- ✅ Reconocimiento en tiempo real
- ✅ Precios competitivos
- ✅ 60 minutos gratis al mes

**Configuración:**

```typescript
// En src/services/speech.service.ts

public async transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as any);

  const response = await fetch(
    'https://speech.googleapis.com/v1/speech:recognize?key=YOUR_API_KEY',
    {
      method: 'POST',
      body: formData,
    }
  );

  const result = await response.json();
  return result.results[0].alternatives[0].transcript;
}
```

#### 2. Azure Speech Services

```typescript
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const speechConfig = sdk.SpeechConfig.fromSubscription(
  'YOUR_AZURE_KEY',
  'YOUR_REGION'
);
speechConfig.speechRecognitionLanguage = 'es-MX';
```

#### 3. AWS Transcribe

```typescript
import AWS from 'aws-sdk';

const transcribe = new AWS.TranscribeService({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  region: 'us-east-1',
});
```

#### 4. AssemblyAI (Más simple)

```typescript
public async transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as any);

  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'authorization': 'YOUR_ASSEMBLYAI_KEY',
    },
    body: formData,
  });

  const { upload_url } = await uploadResponse.json();

  const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': 'YOUR_ASSEMBLYAI_KEY',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: 'es',
    }),
  });

  const { id } = await transcribeResponse.json();

  // Polling para obtener resultado
  let result;
  do {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusResponse = await fetch(
      `https://api.assemblyai.com/v2/transcript/${id}`,
      {
        headers: { 'authorization': 'YOUR_ASSEMBLYAI_KEY' },
      }
    );
    result = await statusResponse.json();
  } while (result.status !== 'completed');

  return result.text;
}
```

### Configurar Variables de Entorno

```bash
# .env
EXPO_PUBLIC_STT_SERVICE=assemblyai  # o google, azure, aws
EXPO_PUBLIC_STT_API_KEY=tu_api_key_aqui
EXPO_PUBLIC_STT_REGION=us-east-1  # Para AWS/Azure
```

---

## 🔐 Seguridad y Permisos

### Sistema de Permisos

El asistente respeta el sistema de permisos existente:

```typescript
// src/constants/roles.ts
export const PERMISSIONS = {
  VIEW_ALL_ORDERS: ['superadmin', 'administrador', 'supervisor'],
  VIEW_INVENTORY: ['superadmin', 'administrador', 'supervisor', 'empleado'],
  VIEW_PURCHASE_ORDERS: ['superadmin', 'administrador', 'supervisor'],
  // ...
};
```

### Row Level Security (RLS)

Las políticas de Supabase garantizan que:

- ✅ Los usuarios solo ven sus propias interacciones de voz
- ✅ Los administradores pueden auditar todas las interacciones
- ✅ Las funciones RPC validan permisos antes de retornar datos

### Auditoría

Todas las interacciones se registran en `voice_interactions`:

```sql
SELECT
  user_name,
  transcription,
  intent,
  success,
  created_at
FROM voice_interactions
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### El asistente no entiende mis comandos

**Solución:**
- Verifica que estés usando comandos similares a los ejemplos
- Los comandos deben estar en español
- Asegúrate de incluir palabras clave como "muestra", "dame", "órdenes", etc.

### Error: "Función RPC no encontrada"

**Solución:**
```sql
-- Verificar que las funciones existen
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE 'asistente_%';

-- Si no existen, ejecuta database/voice_assistant_setup.sql
```

### No se puede grabar audio

**Solución:**
1. Verifica permisos de micrófono en el dispositivo
2. En iOS: Settings → Your App → Microphone → On
3. En Android: Settings → Apps → Your App → Permissions → Microphone → Allow

### Error de permisos al consultar datos

**Solución:**
- Verifica que el usuario tenga el rol correcto
- Revisa las políticas RLS en Supabase
- Consulta los permisos en `src/constants/roles.ts`

### El TTS no funciona

**Solución:**
```typescript
// Verificar que expo-speech esté instalado
import * as Speech from 'expo-speech';

// Probar manualmente
Speech.speak('Hola mundo', { language: 'es-MX' });

// Verificar volumen del dispositivo
```

---

## 📊 Métricas y Análisis

### Ver estadísticas de uso

```typescript
// En Supabase SQL Editor
SELECT * FROM vista_uso_asistente_por_usuario;
SELECT * FROM vista_intenciones_populares;
```

### Consultar interacciones fallidas

```sql
SELECT
  user_name,
  transcription,
  intent,
  response->>'message' as error_message,
  created_at
FROM voice_interactions
WHERE success = false
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎯 Roadmap

### Funcionalidades Futuras

- [ ] Integración con Anthropic Claude API para NLP avanzado
- [ ] Soporte multiidioma (inglés)
- [ ] Comandos personalizados por empresa
- [ ] Integración con notificaciones push
- [ ] Dashboard de analytics del asistente
- [ ] Exportación de reportes a PDF/Excel
- [ ] Comandos de voz para crear/editar registros
- [ ] Integración con calendario (programar órdenes)
- [ ] Modo offline con caché

---

## 👥 Soporte

Para problemas o preguntas:

1. Revisa este documento completo
2. Consulta los logs en la consola
3. Verifica la configuración de Supabase
4. Contacta al equipo de desarrollo

---

## 📄 Licencia

Este módulo es parte del sistema ERP propietario de ERPHYX.

---

**¡El asistente de voz está listo para usarse! 🎉**

Recuerda configurar un servicio de STT para habilitar el reconocimiento de voz completo.
