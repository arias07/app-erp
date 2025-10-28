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
import InventoryScreen from '../screens/InventoryScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SolicitudesScreen from '../screens/SolicitudesScreen';
import CreateSolicitudScreen from '../screens/CreateSolicitudScreen';
import DetalleSolicitudScreen from '../screens/DetalleSolicitudScreen';
import type { Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
        name="Inventory" 
        component={InventoryScreen}
        options={{ title: 'Inventario' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ title: 'Pedidos' }}
      />
      <Tab.Screen 
        name="Solicitudes" 
        component={SolicitudesScreen}
        options={{ 
          title: 'Solicitudes',
        }}
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

  console.log('AppNavigator rendering...', { userEmail: user?.email, loading });

  useEffect(() => {
    console.log('Setting up auth listener...');
    let isMounted = true;

    const safeDispatch = (action: any) => {
      console.log('Dispatching action:', action?.type, action);
      if (isMounted) {
        dispatch(action);
      }
    };

    const resolveUserFromSession = async (session: Session | null) => {
      if (!isMounted) return;

      const idauth = session?.user?.id;
      const email = session?.user?.email;

      if (!idauth && !email) {
        safeDispatch(setUser(null));
        return;
      }

      try {
        console.log(
          `Fetching user data for session`,
          JSON.stringify({ idauth, email }, null, 2)
        );

        let profile = idauth
          ? await authService.getUserProfileByIdauth(idauth)
          : null;

        if (!profile && email) {
          profile = await authService.getUserProfileByEmail(email);
        }

        if (!isMounted) {
          return;
        }

        if (profile) {
          console.log('User data fetched successfully:', profile.email);
          safeDispatch(setUser(profile));
        } else {
          console.warn('User profile not found for email:', email);
          safeDispatch(setUser(null));
        }
      } catch (error) {
        console.error('Error resolving user profile:', error);
        safeDispatch(setUser(null));
      }
    };

    const initialize = async () => {
      console.log('initialize -> setLoading(true)');
      safeDispatch(setLoading(true));
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error obtaining current session:', error);
        }

        await resolveUserFromSession(data?.session ?? null);
      } finally {
        console.log('initialize -> setLoading(false)');
        safeDispatch(setLoading(false));
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          `🔔 Auth event: ${event}`,
          session ? `User: ${session.user.email}` : 'No session'
        );
        console.log('auth state change -> setLoading(true)');
        safeDispatch(setLoading(true));
        await resolveUserFromSession(session);
        console.log('auth state change -> setLoading(false)');
        safeDispatch(setLoading(false));
      }
    );

    return () => {
      console.log('Cleaning up auth listener...');
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [dispatch]);

  console.log('Render check - loading:', loading, 'user:', user?.email);

  if (loading) {
    console.log('Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  console.log('Rendering NavigationContainer with user:', user?.email || 'null');

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
            {console.log('Rendering MainTabs for user:', user.email)}
            <Stack.Screen name="MainTabs" component={MainTabs} />
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
