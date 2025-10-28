
import { supabase } from './supabase';

export const authService = {
  signIn: async (email: string, password: string) => {
    console.log('authService.signIn called with:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase signIn result:', { 
        hasData: !!data, 
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        error 
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('authService.signIn error:', error);
      throw error;
    }
  },

  signOut: async () => {
    console.log('authService.signOut called');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    console.log('authService.getCurrentUser called');
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
