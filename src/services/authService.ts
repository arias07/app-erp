
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Usuario } from '../types/user.types';
import { mapSupabaseUserToUsuario } from './userMapper';

const isRowNotFound = (error?: PostgrestError | null) =>
  Boolean(error && error.code === 'PGRST116');

const fetchProfileByColumn = async (
  column: 'idauth' | 'correo',
  value: string
): Promise<Usuario | null> => {
  console.log(`getUsuarioProfile -> querying ${column}=${value}`);
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq(column, value)
    .limit(1);

  console.log('getUsuarioProfile response', {
    column,
    value,
    count: data?.length ?? 0,
    hasError: !!error,
    error,
  });

  if (error) {
    if (isRowNotFound(error)) {
      return null;
    }
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const rawUser = data[0];
  console.log('getUsuarioProfile - Raw data from DB:', {
    tipouser: rawUser.tipouser,
    rol: rawUser.rol,
    nombres: rawUser.nombres,
  });

  const mappedUser = mapSupabaseUserToUsuario(rawUser);
  console.log('getUsuarioProfile - After mapping:', {
    rol: mappedUser.rol,
    nombre_completo: mappedUser.nombre_completo,
  });

  return mappedUser;
};

const getUsuarioProfile = async (filter: { email?: string; idauth?: string }): Promise<Usuario | null> => {
  if (!filter.email && !filter.idauth) {
    throw new Error('Debe proporcionar un email o idauth para obtener el perfil de usuario');
  }

  if (filter.idauth) {
    const profileByIdauth = await fetchProfileByColumn('idauth', filter.idauth);
    if (profileByIdauth) {
      return profileByIdauth;
    }
  }

  if (filter.email) {
    const profileByEmail = await fetchProfileByColumn('correo', filter.email);
    if (profileByEmail) {
      return profileByEmail;
    }
  }

  return null;
};

export const authService = {
  /**
   * Inicia sesión con email y contraseña
   */
  login: async (email: string, password: string): Promise<Usuario> => {
    console.log('authService.login called with:', email);
    try {
      // Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase signIn result:', { 
        hasData: !!authData, 
        hasSession: !!authData?.session,
        hasUser: !!authData?.user,
        error: authError 
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo obtener el usuario');

      const profile = await getUsuarioProfile({ idauth: authData.user.id });

      if (!profile) {
        throw new Error('Perfil de usuario no encontrado en la base de datos');
      }

      console.log('User profile resolved:', profile.email);
      return profile;
    } catch (error: any) {
      console.error('authService.login error:', error);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario
   */
  signOut: async (): Promise<void> => {
    console.log('authService.signOut called');
    try {
      const { error } = await supabase.auth.signOut();

      // Ignorar el error "Auth session missing" en iOS
      if (error && error.message !== 'Auth session missing!') {
        throw error;
      }

      console.log('authService.signOut completed successfully');
    } catch (error: any) {
      // Si es el error de sesión faltante, lo ignoramos (ya se cerró la sesión)
      if (error?.message === 'Auth session missing!') {
        console.log('Session already cleared, ignoring error');
        return;
      }
      throw error;
    }
  },

  /**
   * Obtiene el usuario actual desde la sesión
   */
  getCurrentUser: async (): Promise<Usuario | null> => {
    console.log('authService.getCurrentUser called');
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('authService.getCurrentUser session error:', error);
      throw error;
    }

    if (!user) return null;

    const profile = await getUsuarioProfile({ idauth: user.id });
    console.log('authService.getCurrentUser - Profile loaded:', {
      id: profile?.id,
      email: profile?.email,
      rol: profile?.rol,
      nombre: profile?.nombre_completo,
    });
    return profile;
  },

  /**
   * Obtiene un perfil de usuario por email
   */
  getUserProfileByEmail: async (email: string): Promise<Usuario | null> => {
    try {
      return await getUsuarioProfile({ email });
    } catch (error) {
      console.error('authService.getUserProfileByEmail error:', error);
      throw error;
    }
  },

  /**
   * Obtiene un perfil de usuario por idauth
   */
  getUserProfileByIdauth: async (idauth: string): Promise<Usuario | null> => {
    try {
      return await getUsuarioProfile({ idauth });
    } catch (error) {
      console.error('authService.getUserProfileByIdauth error:', error);
      throw error;
    }
  },

  /**
   * Registra un nuevo usuario
   */
  register: async (
    email: string,
    password: string,
    nombres: string,
    tipouser: string,
    nroDoc?: string,
    telefono?: string,
    direccion?: string
  ): Promise<Usuario> => {
    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Crear registro en la tabla usuarios
      const { data: newUser, error: userError } = await supabase
        .from('usuarios')
        .insert({
          idauth: authData.user.id,
          correo: email,
          nombres: nombres,
          tipouser: tipouser,
          nro_doc: nroDoc || '-',
          telefono: telefono || '-',
          direccion: direccion || '-',
          estado: 'activo',
        })
        .select()
        .single();

      if (userError) {
        console.error('Error al crear usuario en tabla:', userError);
        throw new Error('Error al crear el perfil del usuario');
      }

      return mapSupabaseUserToUsuario(newUser);
    } catch (error: any) {
      console.error('Error en register:', error);
      throw error;
    }
  },

  /**
   * Solicita recuperación de contraseña
   */
  resetPassword: async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Error en resetPassword:', error);
      throw error;
    }
  },

  /**
   * Actualiza la contraseña del usuario
   */
  updatePassword: async (newPassword: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Error en updatePassword:', error);
      throw error;
    }
  },
};
