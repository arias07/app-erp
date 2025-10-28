
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ReportsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="chart-bar" size={48} color="#6200ee" />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            Reportes
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Analiza el rendimiento de tu negocio
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Reportes Disponibles
          </Text>
          <Button
            mode="outlined"
            icon="chart-line"
            style={styles.reportButton}
            onPress={() => console.log('Reporte de ventas')}
          >
            Reporte de Ventas
          </Button>
          <Button
            mode="outlined"
            icon="package-variant"
            style={styles.reportButton}
            onPress={() => console.log('Reporte de inventario')}
          >
            Reporte de Inventario
          </Button>
          <Button
            mode="outlined"
            icon="account-group"
            style={styles.reportButton}
            onPress={() => console.log('Reporte de usuarios')}
          >
            Reporte de Usuarios
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#666',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  reportButton: {
    marginBottom: 12,
  },
});

export default ReportsScreen;
