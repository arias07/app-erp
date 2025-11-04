# Instrucciones para Generar Build de iOS - ERPHYX GO

## Importante: Diferencias entre Android e iOS

Para **Android**: Se genera un **APK** que puedes instalar directamente en cualquier dispositivo.

Para **iOS**: Se genera un archivo **.IPA** que tiene restricciones:
- **No se puede instalar directamente** en dispositivos iOS sin certificados de Apple
- Requiere una **cuenta de Apple Developer** ($99/año) para distribución oficial
- Para pruebas sin cuenta: Se puede usar **Simulator** o **TestFlight**

---

## Opción 1: Build con EAS para iOS Simulator (GRATIS - Recomendado para Pruebas)

Esta opción genera un build que solo funciona en el **iOS Simulator** en Mac, pero es completamente **gratuito** y no requiere cuenta de Apple Developer.

### Comando:

```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas build --platform ios --profile preview
```

Cuando te pregunte:
- **"Would you like to build for iOS Simulator?"** → Responde **Yes**

### Resultado:
- Se genera un archivo `.tar.gz` con la app para el simulador
- Puedes probarlo en un Mac con Xcode instalado
- **NO funciona en dispositivos iOS reales**

---

## Opción 2: Build para Dispositivos iOS Reales (Requiere Apple Developer Account)

Para instalar en un iPhone o iPad real, necesitas:

### Prerequisitos:

1. **Apple Developer Account** ($99 USD/año)
   - Crear cuenta en: https://developer.apple.com/programs/

2. **Certificados y Provisioning Profiles**
   - EAS puede generarlos automáticamente por ti

### Comando:

```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas build --platform ios --profile preview
```

Cuando te pregunte:
- **"Would you like to build for iOS Simulator?"** → Responde **No**
- **"Set up push notifications?"** → Responde según necesites (probablemente **Yes**)

EAS te guiará para:
1. Autenticarte con tu Apple ID
2. Generar certificados automáticamente
3. Crear provisioning profiles

### Resultado:
- Se genera un archivo `.ipa`
- Puedes instalarlo vía TestFlight o directamente en dispositivos registrados

---

## Opción 3: TestFlight Distribution (Recomendado para Beta Testing)

TestFlight permite distribuir la app a testers sin publicarla en la App Store.

### Pasos:

1. **Generar el build con perfil de producción:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Subir a TestFlight automáticamente:**
   ```bash
   eas submit --platform ios
   ```

3. **Agregar testers en App Store Connect:**
   - Ir a https://appstoreconnect.apple.com
   - Seleccionar tu app
   - Ir a "TestFlight"
   - Agregar emails de testers (hasta 10,000 testers externos)

4. **Los testers reciben un email:**
   - Instalan la app TestFlight
   - Descargan ERPHYX GO desde TestFlight

---

## Configuración del Proyecto para iOS

### Actualizar `eas.json` para iOS

El archivo `eas.json` ya está configurado para Android. Voy a actualizarlo para incluir opciones de iOS:

```json
{
  "cli": {
    "version": ">= 13.2.2"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "distribution": "store"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "tu-email@ejemplo.com",
        "ascAppId": "TU_APP_STORE_CONNECT_APP_ID"
      }
    }
  }
}
```

### Información del Bundle ID

Ya configurado en `app.json`:
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.erphyx.go"
}
```

---

## Comandos Rápidos

### Para iOS Simulator (GRATIS):
```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas build --platform ios --profile preview
# Responde "Yes" cuando pregunte por simulator
```

### Para iOS Device (Requiere Apple Developer):
```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas build --platform ios --profile production
```

### Para Android APK (ya configurado):
```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas build --platform android --profile preview
```

### Para Ambas Plataformas al mismo tiempo:
```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas build --platform all --profile preview
```

---

## Alternativas SIN Apple Developer Account

Si no tienes cuenta de Apple Developer ($99/año), tienes estas opciones:

### 1. **Expo Go** (Solo para desarrollo)
```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
npm start
```
Escanea el QR con la app Expo Go en tu iPhone.

**Limitación:** Solo funciona con módulos nativos compatibles con Expo Go.

### 2. **iOS Simulator en Mac**
- Requiere una Mac con Xcode
- Genera build con `--profile preview` y responde "Yes" al simulator
- Gratis, pero no prueba en dispositivo real

### 3. **Expo Dev Client**
```bash
eas build --platform ios --profile development
```
Genera una app de desarrollo que puedes instalar vía USB en tu iPhone (requiere Mac y Xcode).

---

## Comparación de Opciones

| Opción | Costo | Dispositivo Real | Distribución | Mejor Para |
|--------|-------|-----------------|--------------|------------|
| **iOS Simulator** | Gratis | ❌ No | N/A | Testing básico |
| **Expo Go** | Gratis | ✅ Sí | Solo tú | Desarrollo |
| **Dev Build (USB)** | Gratis | ✅ Sí | Solo tú | Testing en tu iPhone |
| **TestFlight** | $99/año | ✅ Sí | Hasta 10k testers | Beta testing |
| **App Store** | $99/año | ✅ Sí | Pública | Producción |

---

## Proceso Recomendado para tu Caso

### Si NO tienes Apple Developer Account:

1. **Generar build para iOS Simulator:**
   ```bash
   eas build --platform ios --profile preview
   ```
   Responde **Yes** a simulator.

2. **Probar en un Mac** con Xcode (si tienes acceso a uno)

3. **Usar Expo Go** para testing en tu iPhone:
   ```bash
   npm start
   ```

### Si SÍ tienes Apple Developer Account:

1. **Generar build de producción:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Subir a TestFlight:**
   ```bash
   eas submit --platform ios
   ```

3. **Agregar testers en App Store Connect**

4. **Distribuir a testers vía TestFlight**

---

## Solución de Problemas

### Error: "You need to be a member of an Apple Developer team"

**Solución:** Necesitas una cuenta de Apple Developer ($99/año).

**Alternativa:** Usa `--profile preview` y responde "Yes" al simulator para build gratuito.

### Error: "No valid signing identity found"

**Solución:** Deja que EAS genere los certificados automáticamente cuando ejecutes el build.

### ¿Puedo probar en mi iPhone sin pagar?

**Sí, opciones:**
1. Usar **Expo Go** app (limitado)
2. Build via Xcode en Mac y instalar vía USB (requiere Mac)
3. Usar **iOS Simulator** en Mac (no es dispositivo real)

---

## Monitorear el Progreso del Build

Una vez que ejecutes `eas build`, puedes:

1. **Ver progreso en terminal** - Se actualiza automáticamente

2. **Ver en dashboard web:**
   https://expo.dev/accounts/isra07/projects/erphyx-go/builds

3. **Recibir notificación** cuando termine (vía email si lo configuraste)

---

## Descargar el Build

Cuando el build termine:

1. **Link directo en terminal** - Se mostrará un URL de descarga

2. **Dashboard web:**
   - Ir a: https://expo.dev/accounts/isra07/projects/erphyx-go/builds
   - Click en el build completado
   - Botón "Download"

3. **CLI:**
   ```bash
   eas build:list
   ```

---

## Información del Proyecto

- **Nombre:** ERPHYX GO
- **Bundle ID iOS:** com.erphyx.go
- **Bundle ID Android:** com.erphyx.go
- **Versión:** 1.0.0
- **Owner:** @isra07
- **Project ID:** 4a29775b-dcc6-4da6-b436-7ebd828e1a31

---

## Próximos Pasos

1. **Decide qué tipo de build necesitas:**
   - Simulator (gratis)
   - Device (requiere Apple Developer)

2. **Ejecuta el comando apropiado** (ver sección "Comandos Rápidos")

3. **Espera el build** (5-15 minutos)

4. **Descarga y prueba**

---

**Última actualización:** 3 de noviembre de 2025
**Estado:** Proyecto EAS configurado para iOS y Android
**EAS Project:** https://expo.dev/accounts/isra07/projects/erphyx-go
