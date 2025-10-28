import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Avatar, List, Divider, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { authService } from '../services/authService';
import { logout } from '../store/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      dispatch(logout());
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={user?.nombre_completo?.substring(0, 2).toUpperCase() || 'US'}
            style={styles.avatar}
          />
          <Text variant="headlineSmall" style={styles.name}>
            {user?.nombre_completo}
          </Text>
          <Text variant="bodyMedium" style={styles.role}>
            {user?.rol}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Información Personal
          </Text>
          <Divider style={styles.divider} />
          <List.Item
            title="Nombre"
            description={user?.nombre_completo}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          <List.Item
            title="Email"
            description={user?.email}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item
            title="Rol"
            description={user?.rol}
            left={(props) => <List.Icon {...props} icon="badge-account" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Configuración
          </Text>
          <Divider style={styles.divider} />
          <List.Item
            title="Notificaciones"
            description="Configurar preferencias de notificación"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Privacidad"
            description="Gestionar configuración de privacidad"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider style={styles.divider} />
          <Button
            mode="contained-tonal"
            icon="logout"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            Cerrar Sesión
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
  headerContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  avatar: {
    marginBottom: 12,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    color: '#666',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  logoutButton: {
    marginTop: 12,
  },
});

export default ProfileScreen;
