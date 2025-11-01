import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/store/store';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { checkEnumValues } from './src/utils/checkEnums';
import * as Notifications from 'expo-notifications';

// Configurar cómo se comportan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </Provider>
  );
}