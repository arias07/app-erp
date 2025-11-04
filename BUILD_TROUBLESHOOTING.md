# Solución de Problemas - Build de ERPHYX GO

## Error Actual

**Build ID:** b4361292-07c7-4eda-8180-939a20917e08
**Error:** Gradle build failed with unknown error

**Link a logs:** https://expo.dev/accounts/isra07/projects/erphyx-go/builds/b4361292-07c7-4eda-8180-939a20917e08

---

## Soluciones Aplicadas

### 1. ✅ Configuración de expo-build-properties

Agregado en `app.json`:
```json
"plugins": [
  "expo-font",
  [
    "expo-build-properties",
    {
      "android": {
        "compileSdkVersion": 34,
        "targetSdkVersion": 34,
        "buildToolsVersion": "34.0.0"
      }
    }
  ]
]
```

Esto asegura que EAS Build use las versiones correctas del Android SDK.

---

## Cómo Revisar los Logs Detallados

1. **Abre el link del build:**
   https://expo.dev/accounts/isra07/projects/erphyx-go/builds/b4361292-07c7-4eda-8180-939a20917e08

2. **Busca la sección "Run gradlew"** en los logs

3. **Identifica el error específico:**
   - Busca líneas que digan `FAILURE:` o `ERROR:`
   - Lee el stacktrace para identificar el módulo problemático

---

## Errores Comunes y Soluciones

### Error: "Execution failed for task ':app:mergeReleaseResources'"

**Causa:** Problemas con archivos de recursos duplicados o inválidos

**Solución:**
```json
// En app.json, agregar:
"android": {
  "package": "com.erphyx.go",
  "versionCode": 1
}
```

### Error: "Could not find com.android.tools.build:gradle"

**Causa:** Versiones incompatibles de Gradle o plugins

**Solución:** Ya configurado con expo-build-properties

### Error: "Duplicate resources"

**Causa:** Assets duplicados (ej: icon.png con mismo nombre en diferentes lugares)

**Solución:** Asegurarse que todos los assets estén únicamente en `assets/`

### Error: "AAPT: error: resource drawable/xxx not found"

**Causa:** Referencia a un drawable que no existe

**Solución:** Verificar que todos los iconos referenciados existan

---

## Reintentar el Build

Después de aplicar las soluciones, ejecuta:

```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas build --platform android --profile preview
```

---

## Verificar Estado de los Assets

Asegúrate que estos archivos existan:

```bash
ls -la assets/
```

Archivos requeridos:
- ✅ `icon.png` (1024x1024)
- ✅ `splash-icon.png` (1024x1024)
- ✅ `adaptive-icon.png` (1024x1024)
- ✅ `favicon.png` (48x48 o cualquier tamaño)

---

## Configuración Actual del Proyecto

### app.json
- **Package:** com.erphyx.go
- **Version:** 1.0.0
- **Plugins:** expo-font, expo-build-properties
- **Permissions:** CAMERA, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE, NOTIFICATIONS

### eas.json
- **Preview profile:** APK, internal distribution
- **Production profile:** APK, optimizado

---

## Si el Error Persiste

### Opción 1: Build con --clear-cache

```bash
eas build --platform android --profile preview --clear-cache
```

Esto fuerza a EAS a limpiar el cache y empezar desde cero.

### Opción 2: Verificar que todas las dependencias sean compatibles

```bash
npx expo-doctor
```

Este comando verifica problemas de compatibilidad en el proyecto.

### Opción 3: Actualizar dependencias de Expo

Como vimos warnings sobre versiones, actualizar:

```bash
npx expo install expo@latest expo-camera@latest
```

---

## Pasos para Debugging

1. **Revisar logs en dashboard de EAS**
   - Link: https://expo.dev/accounts/isra07/projects/erphyx-go/builds

2. **Identificar el error específico**
   - Buscar línea `FAILURE:` en la sección "Run gradlew"

3. **Aplicar solución correspondiente**

4. **Reintentar build**

5. **Si falla de nuevo, compartir el stacktrace específico**

---

## Información de Soporte

**EAS Project ID:** 4a29775b-dcc6-4da6-b436-7ebd828e1a31
**Account:** @isra07
**Project:** erphyx-go

**Dashboard:** https://expo.dev/accounts/isra07/projects/erphyx-go

---

## Comando para Reintentar

Una vez que hayas revisado los logs y aplicado las correcciones necesarias:

```bash
cd "E:\Proyectos React Js\AppERP\app-erp"

# Reintentar build de Android
eas build --platform android --profile preview

# O con cache limpio
eas build --platform android --profile preview --clear-cache
```

---

**Última actualización:** 3 de noviembre de 2025
**Estado:** Esperando reintento después de aplicar expo-build-properties
