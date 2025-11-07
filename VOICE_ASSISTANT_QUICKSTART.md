# 🚀 Guía Rápida: Asistente de Voz

Esta guía te ayudará a poner en marcha el asistente de voz en 5 minutos.

---

## ⚡ Inicio Rápido

### Paso 1: Configurar Base de Datos (5 min)

1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Crea una nueva query
5. Copia el contenido de `database/voice_assistant_setup.sql`
6. Ejecuta (botón Run)

✅ **Verificación:**
```sql
SELECT COUNT(*) FROM voice_interactions;
-- Debe retornar 0 (tabla vacía pero existente)
```

### Paso 2: Agregar a la Navegación (2 min)

**Opción A: Como pantalla en el Drawer**

```typescript
// src/navigation/DrawerNavigator.tsx
import { VoiceAssistantScreen } from '../screens/VoiceAssistantScreen';

<Drawer.Screen
  name="VoiceAssistant"
  component={VoiceAssistantScreen}
  options={{
    drawerLabel: 'Asistente IA',
    drawerIcon: ({ color }) => (
      <MaterialCommunityIcons name="microphone" size={24} color={color} />
    ),
  }}
/>
```

**Opción B: Como FAB flotante (Recomendado)**

```typescript
// src/screens/HomeScreen.tsx
import { VoiceAssistant } from '../components/VoiceAssistant';
import { FAB } from 'react-native-paper';

export const HomeScreen = () => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Tu contenido existente */}

      <FAB
        icon="microphone"
        style={styles.fab}
        onPress={() => setVisible(true)}
      />

      {visible && <VoiceAssistant />}
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
```

### Paso 3: ¡Probar! (1 min)

1. Ejecuta la app: `npx expo start`
2. Abre el asistente desde el Drawer o FAB
3. Escribe: **"Muestra las órdenes pendientes"**
4. ¡Listo! 🎉

---

## 📝 Ejemplos Prácticos

### Ejemplo 1: Consultar Órdenes Pendientes

**Usuario escribe/dice:**
```
"Dame las órdenes pendientes"
```

**Asistente responde:**
```
Hay 12 órdenes pendientes.

[TABLA]
Folio | Tipo        | Título              | Prioridad
------|-------------|---------------------|----------
1001  | Correctiva  | Reparar compresor   | Alta
1002  | Preventiva  | Mantenimiento motor | Media
...
```

**Métricas mostradas:**
- Total: 12
- Pendientes: 12
- En proceso: 0
- Completadas: 0

---

### Ejemplo 2: Stock Bajo

**Usuario escribe/dice:**
```
"Productos con stock bajo"
```

**Asistente responde:**
```
Hay 5 productos con stock bajo.

[TABLA]
Producto           | Ubicación  | Stock | Mínimo
-------------------|------------|-------|-------
Tornillo M8       | Almacén A  | 15    | 50
Aceite SAE 10W-40 | Almacén B  | 8     | 20
...
```

---

### Ejemplo 3: Reporte de Mantenimiento

**Usuario escribe/dice:**
```
"Resumen de mantenimiento de este mes"
```

**Asistente responde:**
```
Aquí está el resumen de mantenimiento para este mes.

[TABLA]
Tipo        | Total | Pendientes | En Proceso | Completadas | Tiempo Prom.
------------|-------|------------|------------|-------------|-------------
Correctiva  | 45    | 5          | 8          | 32          | 4.5 hrs
Preventiva  | 28    | 2          | 3          | 23          | 2.3 hrs
Mejora      | 12    | 1          | 2          | 9           | 6.7 hrs
```

---

### Ejemplo 4: Análisis de Desempeño

**Usuario escribe/dice:**
```
"Analiza el desempeño de mantenimiento"
```

**Asistente responde:**
```
Análisis de desempeño de mantenimiento para este mes.

[MÉTRICAS]
📊 Total de órdenes: 85
✅ Órdenes completadas: 64
📈 Tasa de completado: 75.29%
⏱️ Tiempo promedio: 4.2 horas
⭐ Calificación promedio: 4.5
🚨 Órdenes urgentes: 18
```

---

### Ejemplo 5: Mis Órdenes Asignadas

**Usuario escribe/dice:**
```
"Mis órdenes asignadas"
```

**Asistente responde:**
```
Tienes 3 órdenes asignadas.

[TABLA]
Folio | Tipo       | Título                    | Estado     | Fecha
------|------------|---------------------------|------------|------------
1015  | Correctiva | Reparar bomba hidráulica  | En proceso | 2025-11-05
1018  | Preventiva | Cambio de filtros         | Pendiente  | 2025-11-08
1020  | Mejora     | Instalar sensor           | Pendiente  | 2025-11-10
```

---

## 🎤 Comandos por Categoría

### 📋 Órdenes de Mantenimiento

```bash
✅ "Muestra las órdenes"
✅ "Órdenes pendientes"
✅ "Mis órdenes"
✅ "Órdenes de tipo correctiva"
✅ "Trabajos del técnico Juan"
✅ "Órdenes de esta semana"
✅ "Órdenes de alta prioridad"
```

### 📦 Inventario

```bash
✅ "Muestra el inventario"
✅ "Productos con stock bajo"
✅ "Stock de tornillos"
✅ "Cuánto hay de aceite"
✅ "Inventario del almacén Monterrey"
✅ "Productos en la sucursal norte"
```

### 📊 Bitácoras

```bash
✅ "Muestra las bitácoras"
✅ "Últimas mediciones"
✅ "Registros de hoy"
✅ "Mediciones de esta semana"
✅ "Historial de temperatura"
```

### 💰 Solicitudes/Compras

```bash
✅ "Muestra las solicitudes"
✅ "Solicitudes por aprobar"
✅ "Mis solicitudes"
✅ "Requisiciones pendientes"
```

### 📈 Reportes

```bash
✅ "Reporte de ventas de octubre"
✅ "Resumen de mantenimiento del mes"
✅ "Estado del inventario"
✅ "Resumen financiero"
✅ "Mejores clientes del trimestre"
```

### 🔍 Análisis

```bash
✅ "Analiza el desempeño de mantenimiento"
✅ "Eficiencia de los ejecutores"
✅ "Rendimiento del técnico María"
✅ "Análisis de inventario"
```

---

## 🎯 Consejos para Mejores Resultados

### ✅ Usar palabras clave

**Bueno:**
```
"Dame las órdenes pendientes de esta semana"
```

**Malo:**
```
"Quisiera ver si hay algo que hacer"
```

### ✅ Ser específico con fechas

**Bueno:**
```
"Ventas de octubre"
"Órdenes de esta semana"
"Mediciones de hoy"
```

**Malo:**
```
"Ventas recientes"
"Órdenes de hace poco"
```

### ✅ Incluir el módulo

**Bueno:**
```
"Productos con stock bajo"
"Órdenes de mantenimiento completadas"
```

**Malo:**
```
"Muéstrame lo que está bajo"
"Las que ya se hicieron"
```

---

## 🔧 Personalización Básica

### Cambiar colores del asistente

```typescript
// src/components/VoiceAssistant.tsx

const styles = StyleSheet.create({
  // Cambiar color de mensajes del usuario
  userMessage: {
    backgroundColor: '#2196F3',  // Cambia este color
  },

  // Cambiar color de mensajes del asistente
  assistantMessage: {
    backgroundColor: '#E8F5E9',  // Cambia este color
  },
});
```

### Personalizar mensaje de bienvenida

```typescript
// src/components/VoiceAssistant.tsx

useEffect(() => {
  if (messages.length === 0) {
    addAssistantMessage(
      '¡Bienvenido! Soy ERPHY, tu asistente inteligente. ' +
      'Puedo ayudarte con órdenes, inventario, reportes y más. ' +
      '¿Qué necesitas?'
    );
  }
}, []);
```

### Agregar nuevos comandos

```typescript
// src/services/nlp.service.ts

const INTENT_PATTERNS: IntentPattern[] = [
  // ... patrones existentes ...

  // Nuevo patrón personalizado
  {
    action: 'mi_nuevo_comando',
    category: 'query',
    keywords: ['palabra', 'clave'],
    patterns: [
      /mi\s+patrón\s+regex/i,
    ],
    examples: [
      'Ejemplo de comando',
    ],
  },
];
```

---

## ⚠️ Limitaciones Actuales

### Speech-to-Text (STT)

❌ **No implementado por defecto**

Para habilitar reconocimiento de voz:
1. Elige un proveedor (Google, Azure, AWS, AssemblyAI)
2. Obtén API Key
3. Implementa en `src/services/speech.service.ts`

Ver: [VOICE_ASSISTANT_README.md - Configuración de STT](./VOICE_ASSISTANT_README.md#configuración-de-stt)

### Funciones RPC Pendientes

Algunas funciones requieren ajustes según tu esquema:

- `asistente_reporte_ventas()` - Requiere tabla de ventas
- Funciones financieras - Dependen de tu módulo de finanzas

**Solución:** Edita `database/voice_assistant_setup.sql` y ajusta las queries.

---

## 📱 Integración con Otras Pantallas

### Abrir desde cualquier pantalla

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

<Button onPress={() => navigation.navigate('VoiceAssistant')}>
  Abrir Asistente IA
</Button>
```

### Pasar contexto inicial

```typescript
<VoiceAssistant
  initialQuery="Muestra las órdenes pendientes"
  autoExecute={true}
/>
```

---

## 🐛 Problemas Comunes

### "No entiendo tu solicitud"

**Causa:** Comando no reconocido por el NLP

**Solución:**
- Usa comandos de los ejemplos
- Incluye palabras clave ("muestra", "dame", "órdenes")
- Sé más específico

### "No tienes permisos"

**Causa:** Tu rol no tiene acceso a esa acción

**Solución:**
- Verifica tu rol en el perfil
- Consulta `src/constants/roles.ts` para permisos
- Contacta al administrador

### No aparece el botón de micrófono

**Causa:** Permisos no concedidos

**Solución:**
```bash
# iOS
Ajustes → TuApp → Micrófono → Activar

# Android
Ajustes → Aplicaciones → TuApp → Permisos → Micrófono → Permitir
```

---

## 📞 Siguientes Pasos

1. ✅ Configura Supabase
2. ✅ Integra el componente
3. ✅ Prueba comandos básicos
4. 📖 Lee [VOICE_ASSISTANT_README.md](./VOICE_ASSISTANT_README.md) completo
5. 🔧 Configura STT (opcional pero recomendado)
6. 🎨 Personaliza según tus necesidades
7. 📊 Revisa analytics de uso

---

**¡Listo para empezar! 🎉**

Si tienes dudas, consulta el README completo o contacta al equipo de desarrollo.
