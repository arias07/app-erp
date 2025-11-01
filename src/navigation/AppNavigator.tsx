import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { View, ActivityIndicator, Text } from 'react-native';
import { RootState } from '../store/store';
import { setUser, setLoading } from '../store/slices/authSlice';
import { supabase } from '../services/supabase';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import HomeOperadorScreen from '../screens/HomeOperadorScreen';
import InventoryScreen from '../screens/InventoryScreen';
import OrdersScreen from '../screens/OrdersScreen';
import BitacorasScreen from '../screens/BitacorasScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SolicitudesScreen from '../screens/SolicitudesScreen';
import CreateSolicitudScreen from '../screens/CreateSolicitudScreen';
import DetalleSolicitudScreen from '../screens/DetalleSolicitudScreen';
import type { Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import type { Usuario } from '../types/user.types';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator para Operadores
function OperadorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeOperadorScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Órdenes' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Tab Navigator normal para otros roles
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'package-variant' : 'package-variant-closed';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
          } else if (route.name === 'Bitacoras') {
            iconName = focused ? 'notebook' : 'notebook-outline';
          } else if (route.name === 'Solicitudes') {
            iconName = focused ? 'file-document' : 'file-document-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />

      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Ordenes' }}
      />
      <Tab.Screen
        name="Bitacoras"
        component={BitacorasScreen}
        options={{ title: 'Bitacoras' }}
      />
      <Tab.Screen
        name="Solicitudes"
        component={SolicitudesScreen}
        options={{
          title: 'Compras',
          tabBarLabel: 'Compras',
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: 'Inventario' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async (session: Session | null, toggleLoader: boolean) => {
      const idauth = session?.user?.id;
      const email = session?.user?.email;

      const finishLoading = () => {
        if (toggleLoader && isMounted) {
          dispatch(setLoading(false));
        }
      };

      if (!idauth && !email) {
        if (isMounted) {
          dispatch(setUser(null));
        }
        finishLoading();
        return;
      }

      try {
        let profile = idauth ? await authService.getUserProfileByIdauth(idauth) : null;

        if (!profile && email) {
          profile = await authService.getUserProfileByEmail(email);
        }

        if (!isMounted) {
          return;
        }

        dispatch(setUser(profile || null));
      } catch (error) {
        console.error('Error resolving user profile:', error);
        if (isMounted) {
          dispatch(setUser(null));
        }
      } finally {
        finishLoading();
      }
    };

    const initialize = async () => {
      dispatch(setLoading(true));
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error obtaining current session:', error);
      }

      await syncUser(data?.session ?? null, true);
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await syncUser(session, false);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [dispatch]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  // Determinar qué navegador usar según el rol
  const isOperador = user?.rol === 'operacion';
  const TabsComponent = isOperador ? OperadorTabs : MainTabs;

  console.log('[AppNavigator] User role:', user?.rol, 'isOperador:', isOperador, 'Using:', isOperador ? 'OperadorTabs' : 'MainTabs');

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            {console.log('Rendering Login screen')}
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            {console.log('Rendering tabs for user:', user.email, 'rol:', user.rol)}
            <Stack.Screen name="MainTabs" component={TabsComponent} />
            <Stack.Screen
              name="CreateSolicitud"
              component={CreateSolicitudScreen}
              options={{
                headerShown: true,
                title: 'Nueva Solicitud',
                presentation: 'modal'
              }}
            />
            <Stack.Screen
              name="DetalleSolicitud"
              component={DetalleSolicitudScreen}
              options={{
                headerShown: true,
                title: 'Detalle de Solicitud'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
