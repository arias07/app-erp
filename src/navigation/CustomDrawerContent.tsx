
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Avatar, Text, Divider, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store/store';

export const CustomDrawerContent = (props: any) => {
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

  const getRoleName = (rol: string) => {
    const roles: Record<string, string> = {
      superadmin: 'Super Administrador',
      administrador: 'Administrador',
      supervisor: 'Supervisor',
      empleado: 'Empleado',
      proveedor: 'Proveedor',
      own: 'Propietario',
      operacion: 'Operación',
      directivo: 'Directivo',
      ejecutor: 'Ejecutor',
    };
    return roles[rol] || rol;
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.userSection}>
        <Avatar.Text
          size={64}
          label={user?.nombre_completo?.substring(0, 2).toUpperCase() || 'US'}
          style={styles.avatar}
        />
        <Text variant="titleMedium" style={styles.userName}>
          {user?.nombre_completo}
        </Text>
        <Text variant="bodySmall" style={styles.userEmail}>
          {user?.email}
        </Text>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="shield-account" size={16} color="#6200ee" />
          <Text variant="bodySmall" style={styles.roleText}>
            {getRoleName(user?.rol || '')}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <DrawerItemList {...props} />

      <Divider style={styles.divider} />

      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}
        >
          Cerrar Sesión
        </Button>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  avatar: {
    backgroundColor: '#6200ee',
    marginBottom: 10,
  },
  userName: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  userEmail: {
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8def8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  roleText: {
    color: '#6200ee',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 10,
  },
  logoutSection: {
    padding: 16,
  },
  logoutButton: {
    borderColor: '#d32f2f',
  },
});
