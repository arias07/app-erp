import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

// Pantallas placeholder - reemplaza con tus pantallas reales
const DashboardOperacionScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Dashboard Operación</Text>
  </View>
);

const InventoryListScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Inventario</Text>
  </View>
);

const OrdersListScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Órdenes</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Perfil</Text>
  </View>
);

export const OperacionNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardOperacionScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryListScreen}
        options={{
          tabBarLabel: 'Inventario',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersListScreen}
        options={{
          tabBarLabel: 'Órdenes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
