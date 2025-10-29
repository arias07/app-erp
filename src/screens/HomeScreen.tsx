
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootState } from '../store/store';

const HomeScreen = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const getRoleGreeting = (rol: string) => {
    const greetings: Record<string, string> = {
      superadmin: '¡Bienvenido, Super Administrador!',
      administrador: '¡Bienvenido, Administrador!',
      supervisor: '¡Bienvenido, Supervisor!',
      empleado: '¡Bienvenido, Colaborador!',
      proveedor: '¡Bienvenido, Proveedor!',
      own: '¡Bienvenido!',
    };
    return greetings[rol] || '¡Bienvenido!';
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeContent}>
              <MaterialCommunityIcons name="hand-wave" size={40} color="#6200ee" />
              <Text variant="headlineMedium" style={styles.greeting}>
                {getRoleGreeting(user?.rol || '')}
              </Text>
              <Text variant="bodyLarge" style={styles.userName}>
                {user?.nombre_completo}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Resumen del Día
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="clipboard-list" size={32} color="#6200ee" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Pedidos Hoy</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="package-variant" size={32} color="#6200ee" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Productos</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="alert-circle" size={32} color="#ff9800" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Alertas</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="check-circle" size={32} color="#4caf50" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Completados</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accesos Rápidos
            </Text>
            <View style={styles.quickActions}>
              <Button
                mode="contained"
                icon="plus"
                style={styles.actionButton}
                onPress={() => console.log('Nuevo pedido')}
              >
                Nuevo Pedido
              </Button>
              <Button
                mode="outlined"
                icon="magnify"
                style={styles.actionButton}
                onPress={() => console.log('Buscar')}
              >
                Buscar
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actividad Reciente
            </Text>
            <Text variant="bodyMedium" style={styles.emptyState}>
              No hay actividad reciente
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#e8def8',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontWeight: 'bold',
    marginTop: 12,
    color: '#6200ee',
  },
  userName: {
    marginTop: 4,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  quickActions: {
    flexDirection: 'column',
  },
  actionButton: {
    marginBottom: 12,
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
});

export default HomeScreen;
