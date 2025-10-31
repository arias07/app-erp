import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { mapSupabaseUserToUsuario } from './userMapper';
import { Usuario, UserRole } from '../types/user.types';

const handleSupabaseError = (error: PostgrestError | null) => {
  if (error) {
    console.error('[userService] Supabase error:', error);
    throw error;
  }
};

export const userService = {
  async getUsersByRoles(roles: UserRole[]): Promise<Usuario[]> {
    const uniqueRoles = Array.from(new Set(roles));

    let query = supabase.from('usuarios').select('*');

    if (uniqueRoles.length > 0) {
      const filters = uniqueRoles
        .map((role) => `tipouser.ilike.%${role}%`)
        .join(',');
      query = query.or(filters);
    }

    const { data, error } = await query;

    handleSupabaseError(error);

    return (data ?? []).map(mapSupabaseUserToUsuario);
  },

  async getActiveExecutors(): Promise<Usuario[]> {
    return this.getUsersByRoles(['ejecutor']);
  },

  async getActiveSupervisors(): Promise<Usuario[]> {
    return this.getUsersByRoles(['supervisor']);
  },

  async getAreaCollaborators(): Promise<Usuario[]> {
    const roles: UserRole[] = ['empleado', 'operacion', 'ejecutor'];
    return this.getUsersByRoles(roles);
  },

  async searchUsersByName(search: string, roles?: UserRole[]): Promise<Usuario[]> {
    const sanitized = search.trim();
    let query = supabase.from('usuarios').select('*');

    if (roles && roles.length > 0) {
      const filters = roles.map((role) => `tipouser.ilike.%${role}%`).join(',');
      query = query.or(filters);
    }

    if (sanitized.length > 0) {
      query = query.or(
        `nombre_completo.ilike.%${sanitized}%,nombres.ilike.%${sanitized}%,correo.ilike.%${sanitized}%`
      );
    }

    const { data, error } = await query.limit(20);
    handleSupabaseError(error);

    return (data ?? []).map(mapSupabaseUserToUsuario);
  },
};
