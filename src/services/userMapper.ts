import { Usuario, UserRole } from '../types/user.types';

const normalizeRole = (role?: string | null): UserRole => {
  const normalized = role?.toLowerCase().trim();

  switch (normalized) {
    case 'superadmin':
    case 'super admin':
    case 'root':
      return 'superadmin';
    case 'admin':
    case 'administrador':
    case 'directivo':
    case 'director':
    case 'ceo':
      return 'administrador';
    case 'supervisor':
    case 'jefe':
      return 'supervisor';
    case 'empleado':
      return 'empleado';
    case 'operacion':
    case 'operador':
    case 'operaciones':
      return 'operacion';
    case 'proveedor':
      return 'proveedor';
    case 'own':
    case 'owner':
    case 'propietario':
      return 'own';
    case 'ejecutor':
    case 'tecnico':
    case 'operario':
      return 'ejecutor';
    default:
      return 'empleado';
  }
};

const buildFullName = (raw: any): string => {
  if (raw?.nombre_completo) {
    return String(raw.nombre_completo);
  }

  const parts = [raw?.nombres, raw?.last_name, raw?.mother_last_name]
    .filter(Boolean)
    .map((part: string) => part.trim());

  if (parts.length > 0) {
    return parts.join(' ');
  }

  return raw?.correo ?? raw?.email ?? '';
};

const sanitizePhone = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'null') {
    return undefined;
  }
  return trimmed;
};

const deriveActiveState = (raw: any): boolean => {
  if (typeof raw?.activo === 'boolean') {
    return raw.activo;
  }

  const state = (raw?.estado ?? '').toString().toLowerCase();
  return state === 'activo' || state === 'active';
};

export const mapSupabaseUserToUsuario = (raw: any): Usuario => {
  return {
    id: raw?.id ? String(raw.id) : raw?.idauth ?? '',
    email: raw?.correo ?? raw?.email ?? '',
    nombre_completo: buildFullName(raw),
    rol: normalizeRole(raw?.tipouser ?? raw?.rol),
    foto_perfil_url: raw?.foto_perfil_url ?? raw?.avatar_url ?? undefined,
    telefono: sanitizePhone(raw?.telefono),
    activo: deriveActiveState(raw),
    calificacion_promedio: raw?.calificacion_promedio ?? 0,
    total_calificaciones: raw?.total_calificaciones ?? 0,
    created_at: raw?.fecharegistro ?? raw?.created_at ?? new Date().toISOString(),
    updated_at:
      raw?.updated_at ??
      raw?.fecharegistro ??
      raw?.created_at ??
      new Date().toISOString(),
  };
};
