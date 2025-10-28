import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { store } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { suppressPointerEventsWarning } from './src/utils/suppressWarnings';

export default function App() {
  useEffect(() => {
    suppressPointerEventsWarning();
  }, []);

  return (
    <Provider store={store}>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </Provider>
  );
}