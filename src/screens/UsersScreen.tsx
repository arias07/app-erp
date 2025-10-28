
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, FAB, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const UsersScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="account-group" size={48} color="#6200ee" />
            </View>
            <Text variant="headlineSmall" style={styles.title}>
              Gestión de Usuarios
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Administra usuarios y permisos
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Usuarios por Rol
            </Text>
            <View style={styles.rolesContainer}>
              <Chip icon="shield-crown" style={styles.chip}>Directivos: 0</Chip>
              <Chip icon="shield-account" style={styles.chip}>Supervisores: 0</Chip>
              <Chip icon="account-hard-hat" style={styles.chip}>Operación: 0</Chip>
              <Chip icon="account" style={styles.chip}>Ejecutores: 0</Chip>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="account-plus"
        style={styles.fab}
        onPress={() => console.log('Agregar usuario')}
        label="Agregar Usuario"
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
  rolesContainer: {
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
  },
});

export default UsersScreen;
