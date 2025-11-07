/**
 * Pantalla del Asistente de Voz
 * Interfaz principal para interactuar con el asistente de IA
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { VoiceAssistant } from '../components/VoiceAssistant';

export const VoiceAssistantScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <VoiceAssistant />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
