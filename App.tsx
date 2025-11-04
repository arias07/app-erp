import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/store/store';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { checkEnumValues } from './src/utils/checkEnums';
import * as Notifications from 'expo-notifications';
import { BRAND_COLORS } from './src/constants/theme';

// Configurar cómo se comportan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Tema personalizado ERPHYX
const erphyxTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Botones y elementos principales en verde lima
    primary: BRAND_COLORS.primary,
    primaryContainer: '#E8F5CD', // Fondo claro verde lima para contraste
    onPrimary: BRAND_COLORS.secondary, // Texto en verde oscuro sobre botones
    onPrimaryContainer: BRAND_COLORS.secondary,

    // Elementos secundarios - NUNCA usar verde oscuro como fondo
    secondary: BRAND_COLORS.primary, // Cambiar a verde lima
    secondaryContainer: '#E8F5CD', // Fondo claro
    onSecondary: BRAND_COLORS.secondary,
    onSecondaryContainer: BRAND_COLORS.secondary,

    // Fondos y superficies - siempre claros
    background: BRAND_COLORS.background,
    surface: BRAND_COLORS.surface,
    surfaceVariant: '#FAFAFA',

    // Estados
    error: BRAND_COLORS.error,
    success: BRAND_COLORS.success,
    warning: BRAND_COLORS.warning,

    // Textos - siempre oscuros sobre fondos claros
    onBackground: BRAND_COLORS.secondary,
    onSurface: BRAND_COLORS.secondary,
    onSurfaceVariant: BRAND_COLORS.textSecondary,

    // Bordes y divisores
    outline: BRAND_COLORS.border,
    outlineVariant: '#E0E0E0',
  },
};

export default function App() {
  useEffect(() => {
    // Solo en desarrollo - verificar valores del enum
    if (__DEV__) {
      checkEnumValues();
    }

    // Solicitar permisos de notificaciones
    async function requestPermissions() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      console.log('Push notification permissions granted');
    }

    requestPermissions();
  }, []);

  return (
    <Provider store={store}>
      <PaperProvider theme={erphyxTheme}>
        <AppNavigator />
      </PaperProvider>
    </Provider>
  );
}