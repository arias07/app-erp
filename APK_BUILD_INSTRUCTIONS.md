# Instrucciones para Generar APK de ERPHYX GO

Este documento contiene todas las opciones disponibles para generar el APK de la aplicación ERPHYX GO.

## Estado Actual del Proyecto

✅ **Configuración completada:**
- EAS CLI instalado globalmente
- Archivo `eas.json` configurado con perfiles de build
- Proyecto nativo Android generado con `expo prebuild`
- Permisos de Android configurados en `app.json`

⚠️ **Problema detectado:**
- **Java 8** está instalado (versión 1.8.0_201)
- **Se requiere Java 11 o superior** para compilar con Gradle

---

## Opción 1: EAS Build (Recomendado - Más Fácil)

**Ventajas:**
- No requiere configuración local de Java o Android SDK
- Build en la nube (servidores de Expo)
- Proceso automatizado y confiable
- Genera APK firmado y optimizado

**Desventajas:**
- Requiere cuenta de Expo (gratis)
- Necesita conexión a internet

### Pasos para EAS Build:

1. **Iniciar sesión en tu cuenta Expo:**
   ```bash
   cd "E:\Proyectos React Js\AppERP\app-erp"
   eas login
   ```

   Si no tienes cuenta, créala en: https://expo.dev/signup

2. **Construir el APK:**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Esperar a que termine el build** (5-15 minutos)
   - El progreso se mostrará en la terminal
   - También puedes ver el progreso en: https://expo.dev/accounts/[tu-usuario]/projects/erphyx-go/builds

4. **Descargar el APK:**
   - Se generará un link de descarga cuando termine
   - También disponible en el dashboard de Expo

### Perfiles de Build Disponibles:

- **preview**: Genera APK para pruebas internas (recomendado)
  ```bash
  eas build --platform android --profile preview
  ```

- **production**: Genera APK optimizado para producción
  ```bash
  eas build --platform android --profile production
  ```

---

## Opción 2: Build Local (Requiere Java 11+)

**Ventajas:**
- No requiere cuenta de Expo
- Control total del proceso de build
- Más rápido si ya tienes el entorno configurado

**Desventajas:**
- Requiere instalar y configurar Java 11+
- Proceso más complejo
- Más espacio en disco

### Prerequisitos:

#### 1. Actualizar Java a versión 11 o superior

**Versión actual:** Java 8 (1.8.0_201) ❌
**Versión requerida:** Java 11 o superior ✅

**Opciones de descarga:**

a) **OpenJDK 17 (Recomendado):**
   - Descargar desde: https://adoptium.net/
   - Selecciona: JDK 17 LTS, Windows x64, .msi installer
   - Instala y marca la opción "Set JAVA_HOME variable"

b) **Oracle JDK:**
   - Descargar desde: https://www.oracle.com/java/technologies/downloads/

**Verificar instalación:**
```bash
java -version
# Debe mostrar: java version "17.x.x" o superior
```

**Configurar JAVA_HOME (si no se configuró automáticamente):**
1. Abre "Variables de entorno" en Windows
2. En "Variables del sistema", crea/edita `JAVA_HOME`
3. Valor: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
4. Agrega a `Path`: `%JAVA_HOME%\bin`

#### 2. Verificar Gradle (ya está instalado automáticamente)

El proyecto ya descargó Gradle 8.14.3 automáticamente.

### Pasos para Build Local:

Una vez que Java 11+ esté instalado:

1. **Navegar al directorio del proyecto:**
   ```bash
   cd "E:\Proyectos React Js\AppERP\app-erp"
   ```

2. **Generar proyecto nativo (ya hecho):**
   ```bash
   npx expo prebuild --clean --platform android
   ```

3. **Compilar el APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Ubicación del APK generado:**
   ```
   E:\Proyectos React Js\AppERP\app-erp\android\app\build\outputs\apk\release\app-release.apk
   ```

---

## Opción 3: Expo Development Build (Para Testing)

Si solo quieres probar la app en desarrollo:

```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
npx expo start
```

Luego escanea el QR con la app Expo Go desde tu teléfono Android.

**Nota:** Esta opción NO genera un APK instalable, solo permite testing en desarrollo.

---

## Solución de Problemas

### Error: "Dependency requires at least JVM runtime version 11"

**Causa:** Java 8 está instalado, pero se requiere Java 11+

**Solución:**
1. Instalar Java 17 LTS desde https://adoptium.net/
2. Configurar JAVA_HOME correctamente
3. Reiniciar la terminal
4. Verificar con `java -version`
5. Intentar build nuevamente

### Error: "BUILD FAILED in Gradle"

**Posibles causas:**
- Java version incorrecta
- Falta Android SDK
- Problemas de permisos

**Solución:**
Usar **Opción 1: EAS Build** que evita todos estos problemas.

### Error: "An Expo user account is required"

**Causa:** Intentando usar EAS Build sin estar autenticado

**Solución:**
```bash
eas login
```

---

## Recomendación Final

### ✅ Usa **Opción 1: EAS Build** si:
- Quieres el método más sencillo y rápido
- No quieres configurar Java/Android SDK
- No te importa crear una cuenta gratuita de Expo

### ✅ Usa **Opción 2: Build Local** si:
- Prefieres no usar servicios en la nube
- Ya tienes Java 11+ y Android SDK configurados
- Necesitas control total del proceso de build

---

## Comandos Rápidos (Una vez resueltos los prerequisitos)

### EAS Build:
```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
eas login
eas build --platform android --profile preview
```

### Build Local:
```bash
cd "E:\Proyectos React Js\AppERP\app-erp"
cd android
./gradlew assembleRelease
```

### APK generado estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Información del Proyecto

- **Nombre:** ERPHYX GO
- **Package:** com.erphyx.go
- **Versión:** 1.0.0
- **Bundle ID iOS:** com.erphyx.go
- **Colores de marca:**
  - Verde Lima: #A3C400
  - Verde Oscuro: #1E3B33

---

## Siguientes Pasos Después de Generar el APK

1. **Instalar en dispositivo Android:**
   - Habilitar "Instalar desde fuentes desconocidas"
   - Transferir el APK al teléfono
   - Abrir el archivo APK y seleccionar "Instalar"

2. **Probar la app:**
   - Verificar que el branding ERPHYX se vea correctamente
   - Probar login y funcionalidades principales
   - Verificar permisos (cámara, notificaciones, almacenamiento)

3. **Firmar el APK para producción (opcional):**
   - Si vas a publicar en Google Play Store
   - EAS Build puede manejar esto automáticamente

---

**Última actualización:** 3 de noviembre de 2025
**Estado:** Proyecto configurado - Requiere Java 11+ para build local
