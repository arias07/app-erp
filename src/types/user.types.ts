export type UserRole =
  | 'superadmin'
  | 'administrador'
  | 'supervisor'
  | 'empleado'
  | 'proveedor'
  | 'own'
  | 'directivo'
  | 'operacion'
  | 'ejecutor';

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  rol: UserRole;
  foto_perfil_url?: string;
  telefono?: string;
  activo: boolean;
  calificacion_promedio: number;
  total_calificaciones: number;
  created_at: string;
  updated_at: string;
}
