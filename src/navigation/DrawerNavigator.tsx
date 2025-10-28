import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootState } from '../store/store';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import InventoryScreen from '../screens/InventoryScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ReportsScreen from '../screens/ReportsScreen';
import UsersScreen from '../screens/UsersScreen';

import { CustomDrawerContent } from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Definir qué pantallas puede ver cada rol
  const role = user?.rol || '';
  const inventoryRoles = new Set([
    'superadmin',
    'administrador',
    'supervisor',
    'empleado',
    'own',
    'operacion',
    'ejecutor',
  ]);
  const managementRoles = new Set(['superadmin', 'administrador', 'supervisor']);
  const adminOnlyRoles = new Set(['superadmin', 'administrador']);

  const canAccessInventory = inventoryRoles.has(role);
  const canAccessOrders = inventoryRoles.has(role);
  const canAccessReports = managementRoles.has(role);
  const canAccessUsers = adminOnlyRoles.has(role);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#6200ee',
        drawerInactiveTintColor: '#666',
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />

      {canAccessInventory && (
        <Drawer.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{
            title: 'Inventario',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="package-variant" size={size} color={color} />
            ),
          }}
        />
      )}

      {canAccessOrders && (
        <Drawer.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            title: 'Pedidos',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
            ),
          }}
        />
      )}

      {canAccessReports && (
        <Drawer.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            title: 'Reportes',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
            ),
          }}
        />
      )}

      {canAccessUsers && (
        <Drawer.Screen
          name="Users"
          component={UsersScreen}
          options={{
            title: 'Usuarios',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group" size={size} color={color} />
            ),
          }}
        />
      )}
    </Drawer.Navigator>
  );
};
