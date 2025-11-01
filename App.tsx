import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/store/store';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { checkEnumValues } from './src/utils/checkEnums';

export default function App() {
  useEffect(() => {
    // Solo en desarrollo - verificar valores del enum
    if (__DEV__) {
      checkEnumValues();
    }
  }, []);

  return (
    <Provider store={store}>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </Provider>
  );
}