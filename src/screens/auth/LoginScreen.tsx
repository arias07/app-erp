import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { authService } from '../../services/authService';
import { BRAND_COLORS } from '../../constants/theme';
import { ErphyxLogo } from '../../components/branding';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleLogin = async () => {
    console.log('Login attempt started...');
    if (!email || !password) {
      showSnackbar('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling authService.login...');
      await authService.login(email, password);
      console.log('Login successful!');
      // La navegación se manejará automáticamente por el listener en AppNavigator
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Error al iniciar sesión';
      showSnackbar(errorMessage);
    } finally {
      setLoading(false);
      console.log('Login attempt finished');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <ErphyxLogo width={140} height={140} />
      </View>

      <Text variant="headlineLarge" style={styles.title}>
        ERPHYX
      </Text>

      <Text variant="titleMedium" style={styles.subtitle}>
        GO
      </Text>

      <Text variant="bodyMedium" style={styles.description}>
        Sistema de Gestión Empresarial
      </Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        disabled={loading}
      />
      
      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={loading}
      />
      
      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Ingresar
      </Button>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Cerrar',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 0,
    fontWeight: '900',
    color: BRAND_COLORS.secondary,
    letterSpacing: 2,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: BRAND_COLORS.secondary,
  },
  description: {
    textAlign: 'center',
    marginBottom: 40,
    color: BRAND_COLORS.textSecondary,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
});

export default LoginScreen;
