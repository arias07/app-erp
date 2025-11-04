# Instrucciones para Generar Iconos de la App ERPHYX

## Iconos Necesarios

Los siguientes iconos deben generarse a partir de los archivos SVG de branding:

### 1. App Icon (icon.png)
- **Tamaño**: 1024x1024 px
- **Fuente**: `src/components/branding/ErphyxLogo.tsx` (solo el logo)
- **Fondo**: Blanco (#FFFFFF)
- **Descripción**: Logo del chevron "<" en verde lima con borde redondeado

### 2. Splash Icon (splash-icon.png)
- **Tamaño**: 1024x1024 px
- **Fuente**: `src/components/branding/ErphyxLogo.tsx` (solo el logo)
- **Fondo**: Transparente o verde oscuro (#1E3B33)
- **Descripción**: Mismo logo que el icon.png, se mostrará sobre fondo verde oscuro

### 3. Adaptive Icon (adaptive-icon.png) - Android
- **Tamaño**: 1024x1024 px
- **Fuente**: `src/components/branding/ErphyxLogo.tsx` (solo el logo)
- **Fondo**: Configurado en app.json como #A3C400 (verde lima)
- **Descripción**: Logo centrado para Android adaptive icons

### 4. Favicon (favicon.png) - Web
- **Tamaño**: 48x48 px o 32x32 px
- **Fuente**: `src/components/branding/ErphyxLogo.tsx` (solo el logo)
- **Fondo**: Blanco o transparente

## Métodos para Generar los Iconos

### Opción 1: Usando un Convertidor SVG a PNG en Línea

1. Crea un archivo SVG temporal con el contenido del logo:
   - Copia el código de `ErphyxLogo.tsx` y crea un archivo `erphyx-logo.svg`
   - Usa sitios como:
     - https://cloudconvert.com/svg-to-png
     - https://svgtopng.com/
     - https://convertio.co/svg-png/

2. Configura el tamaño apropiado para cada imagen
3. Descarga y coloca en la carpeta `assets/`

### Opción 2: Usando Figma/Adobe Illustrator

1. Importa el SVG en Figma o Illustrator
2. Exporta como PNG en los tamaños requeridos
3. Asegúrate de mantener los colores ERPHYX:
   - Verde lima: #A3C400
   - Verde oscuro: #1E3B33

### Opción 3: Usando Expo Icon Generator (Recomendado)

Expo proporciona herramientas para generar iconos automáticamente:

```bash
npx expo prebuild --clean
```

Luego usa el comando de Expo para generar iconos:
```bash
npx expo-icon-generator
```

### Opción 4: Usando ImageMagick o Inkscape (Línea de Comandos)

Si tienes Inkscape instalado:

```bash
# Para icon.png (1024x1024)
inkscape erphyx-logo.svg --export-filename=assets/icon.png --export-width=1024 --export-height=1024

# Para splash-icon.png (1024x1024)
inkscape erphyx-logo.svg --export-filename=assets/splash-icon.png --export-width=1024 --export-height=1024

# Para adaptive-icon.png (1024x1024)
inkscape erphyx-logo.svg --export-filename=assets/adaptive-icon.png --export-width=1024 --export-height=1024

# Para favicon.png (48x48)
inkscape erphyx-logo.svg --export-filename=assets/favicon.png --export-width=48 --export-height=48
```

## Verificación

Después de generar los iconos:

1. Coloca todos los archivos PNG en la carpeta `assets/`
2. Verifica que las dimensiones sean correctas
3. Ejecuta el proyecto para verificar que los iconos se vean correctamente:
   ```bash
   npm start
   ```

## Notas Importantes

- El archivo `app.json` ya está configurado con los colores de fondo correctos
- El splash screen usa fondo verde oscuro (#1E3B33)
- El adaptive icon de Android usa fondo verde lima (#A3C400)
- Los iconos deben mantener la proporción y calidad en todas las plataformas

## Estado Actual

✅ SVG Components creados en `src/components/branding/`
✅ Logo integrado en LoginScreen
✅ Tema ERPHYX aplicado globalmente
⚠️ **PENDIENTE**: Generar archivos PNG de iconos para assets/
