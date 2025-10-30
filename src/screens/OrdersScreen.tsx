
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OrdersScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="clipboard-list" size={48} color="#6200ee" />
            </View>
            <Text variant="headlineSmall" style={styles.title}>
              Ordenes
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Gestiona y realiza seguimiento de ordenes de mantenimiento
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Estado de Ordenes
            </Text>
            <View style={styles.statusContainer}>
              <Chip icon="clock" style={styles.chip}>Pendientes: 0</Chip>
              <Chip icon="truck" style={styles.chip}>En Proceso: 0</Chip>
              <Chip icon="check" style={styles.chip}>Completadas: 0</Chip>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log('Nuevo pedido')}
        label="Nueva Orden"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
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
  statusContainer: {
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default OrdersScreen;
