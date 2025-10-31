import { supabase } from './supabase';
import {
  SolicitudSKU,
  SolicitudFilters,
  SolicitudDetalle,
  SolicitudHistorial,
  SolicitudUsuario,
  EstadoSolicitud,
} from '../types/solicitud.types';

const TABLE_SOLPED = 'solped';
const TABLE_SOLPED_DETALLE = 'solped_detalle';
const TABLE_SOLPED_HISTORIAL = 'solped_historial';
const TABLE_USUARIOS = 'usuarios';

const isMissingTableError = (error: unknown): boolean => {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'PGRST205'
  );
};

const ESTADO_NORMALIZADO: Record<string, EstadoSolicitud> = {
  POR_AUTORIZAR: 'pendiente',
  EN_REVISION: 'pendiente',
  AUTORIZADA: 'aprobada',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
};

const ESTADO_INVERTIDO: Record<EstadoSolicitud, string[]> = {
  pendiente: ['POR_AUTORIZAR', 'EN_REVISION'],
  aprobada: ['AUTORIZADA', 'APROBADA'],
  rechazada: ['RECHAZADA'],
  completada: ['COMPLETADA'],
  cancelada: ['CANCELADA'],
};

const normalizeEstado = (estatus?: string | null): EstadoSolicitud => {
  if (!estatus) return 'pendiente';
  const normalized = (estatus || '').toUpperCase();
  return ESTADO_NORMALIZADO[normalized] ?? 'pendiente';
};

const buildUsuario = (row: any | null | undefined): SolicitudUsuario | undefined => {
  if (!row) return undefined;
  const partes = [row.nombres, row.last_name, row.mother_last_name]
    .filter(Boolean)
    .map((parte: string) => parte.trim());
  const nombre = partes.length > 0 ? partes.join(' ') : row.correo || 'Usuario';

  return {
    id: String(row.id),
    nombre,
    correo: row.correo ?? null,
    rol: row.tipouser ?? null,
  };
};

const fetchUsuarios = async (ids: Set<string>): Promise<Record<string, SolicitudUsuario>> => {
  if (ids.size === 0) return {};
  const { data, error } = await supabase
    .from(TABLE_USUARIOS)
    .select('id, nombres, last_name, mother_last_name, correo, tipouser')
    .in('id', Array.from(ids));

  if (error) {
    console.error('Error al obtener usuarios:', error);
    return {};
  }

  const resultado: Record<string, SolicitudUsuario> = {};
  (data ?? []).forEach((row: any) => {
    resultado[String(row.id)] = buildUsuario(row)!;
  });
  return resultado;
};

const mapDetalle = (row: any): SolicitudDetalle => ({
  id: String(row.id),
  id_solped: String(row.id_solped),
  id_producto: row.id_producto ?? null,
  id_proveedor: row.id_proveedor ?? null,
  cantidad:
    row.cant_solicitada ??
    row.cant_requisitada ??
    row.cant_despachada ??
    row.cant_ingresada ??
    null,
  costo_unitario: row.costo_unitario != null ? Number(row.costo_unitario) : null,
});

const mapHistorial = (
  row: any,
  usuario?: SolicitudUsuario
): SolicitudHistorial => ({
  id: String(row.id),
  id_solped: String(row.id_solped),
  fecha: row.fecha ? new Date(row.fecha).toISOString() : new Date().toISOString(),
  estatus: row.estatus || 'SIN_ESTADO',
  comentario: row.comentario ?? null,
  usuario,
});

const mapSolicitud = (
  row: any,
  usuarios: Record<string, SolicitudUsuario>,
  detallesMap: Map<string, SolicitudDetalle[]>,
  historialMap: Map<string, SolicitudHistorial[]>
): SolicitudSKU => {
  const id = String(row.id);
  const fechaBase = row.fecha || row.created_at || row.updated_at || new Date().toISOString();

  return {
    id,
    descripcion: row.descripcion ?? null,
    fecha: new Date(fechaBase).toISOString(),
    divisa: row.divisa ?? null,
    total: row.total != null ? Number(row.total) : null,
    estado: normalizeEstado(row.estatus_actual),
    motivo: row.motivo ?? null,
    observaciones: row.observaciones ?? null,
    responsable: row.id_responsable
      ? usuarios[String(row.id_responsable)]
      : undefined,
    autorizado: row.id_autorizado
      ? usuarios[String(row.id_autorizado)]
      : undefined,
    detalles: detallesMap.get(id) ?? [],
    historial: historialMap.get(id) ?? [],
  };
};

const buildDetallesMap = (rows: any[] | null | undefined): Map<string, SolicitudDetalle[]> => {
  const mapa = new Map<string, SolicitudDetalle[]>();
  (rows ?? []).forEach((row) => {
    const key = String(row.id_solped);
    if (!mapa.has(key)) {
      mapa.set(key, []);
    }
    mapa.get(key)!.push(mapDetalle(row));
  });
  return mapa;
};

const buildHistorialMap = (
  rows: any[] | null | undefined,
  usuarios: Record<string, SolicitudUsuario>
): Map<string, SolicitudHistorial[]> => {
  const mapa = new Map<string, SolicitudHistorial[]>();
  (rows ?? []).forEach((row) => {
    const key = String(row.id_solped);
    if (!mapa.has(key)) {
      mapa.set(key, []);
    }
    const usuario = row.id_usuario ? usuarios[String(row.id_usuario)] : undefined;
    mapa.get(key)!.push(mapHistorial(row, usuario));
  });
  return mapa;
};

const toEstadoFiltro = (estado: EstadoSolicitud): string[] => {
  return ESTADO_INVERTIDO[estado] ?? [];
};

const applySearchFilter = (rows: any[], searchTerm?: string) => {
  if (!searchTerm) return rows;
  const query = searchTerm.toLowerCase();
  return rows.filter((row) => {
    const parts = [
      row.id ? String(row.id) : '',
      row.descripcion ?? '',
      row.estatus_actual ?? '',
    ];
    return parts.some((part) => part.toLowerCase().includes(query));
  });
};

const fetchDetalles = async (solpedIds: string[]): Promise<any[]> => {
  if (solpedIds.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE_SOLPED_DETALLE)
    .select('*')
    .in('id_solped', solpedIds);
  if (error) {
    console.error('Error al obtener detalles de solped:', error);
    return [];
  }
  return data ?? [];
};

const fetchHistorial = async (solpedIds: string[]): Promise<any[]> => {
  if (solpedIds.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE_SOLPED_HISTORIAL)
    .select('*')
    .in('id_solped', solpedIds)
    .order('fecha', { ascending: false });
  if (error) {
    console.error('Error al obtener historial de solped:', error);
    return [];
  }
  return data ?? [];
};

const buildUsuarioLookup = async (
  solpedRows: any[],
  historialRows: any[]
): Promise<Record<string, SolicitudUsuario>> => {
  const userIds = new Set<string>();

  solpedRows.forEach((row) => {
    if (row.id_responsable) userIds.add(String(row.id_responsable));
    if (row.id_autorizado) userIds.add(String(row.id_autorizado));
  });

  historialRows.forEach((row) => {
    if (row.id_usuario) userIds.add(String(row.id_usuario));
  });

  return fetchUsuarios(userIds);
};

const fetchSolicitudesBase = async (
  filters?: SolicitudFilters
): Promise<any[]> => {
  let query = supabase
    .from(TABLE_SOLPED)
    .select('*')
    .order('fecha', { ascending: false });

  if (filters?.estado) {
    const estados = toEstadoFiltro(filters.estado);
    if (estados.length > 0) {
      query = query.in('estatus_actual', estados);
    }
  }

  if (filters?.responsableId) {
    query = query.eq('id_responsable', filters.responsableId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error)) {
      console.warn(
        'La tabla solped no se encuentra disponible. Se devuelve una lista vacía.'
      );
      return [];
    }
    throw error;
  }

  const rows = data ?? [];
  return applySearchFilter(rows, filters?.searchTerm);
};

export const solicitudService = {
  async getAll(filters?: SolicitudFilters): Promise<SolicitudSKU[]> {
    try {
      const baseRows = await fetchSolicitudesBase(filters);
      if (baseRows.length === 0) {
        return [];
      }

      const solpedIds = baseRows.map((row) => String(row.id));
      const detalleRows = await fetchDetalles(solpedIds);
      const historialRows = await fetchHistorial(solpedIds);
      const usuarios = await buildUsuarioLookup(baseRows, historialRows);

      const detallesMap = buildDetallesMap(detalleRows);
      const historialMap = buildHistorialMap(historialRows, usuarios);

      return baseRows.map((row) =>
        mapSolicitud(row, usuarios, detallesMap, historialMap)
      );
    } catch (error) {
      console.error('Error en getAll solicitudes (solped):', error);
      throw error;
    }
  },

  async getPendientes(): Promise<SolicitudSKU[]> {
    return this.getAll({ estado: 'pendiente' });
  },

  async getMisSolicitudes(userId: string): Promise<SolicitudSKU[]> {
    return this.getAll({ responsableId: userId });
  },

  async getById(id: number | string): Promise<SolicitudSKU | null> {
    try {
      const rows = await fetchSolicitudesBase({ searchTerm: String(id) });
      const match = rows.find((row) => String(row.id) === String(id));

      if (!match) {
        return null;
      }

      const solpedId = String(match.id);
      const [detalleRows, historialRows] = await Promise.all([
        fetchDetalles([solpedId]),
        fetchHistorial([solpedId]),
      ]);
      const usuarios = await buildUsuarioLookup([match], historialRows);

      const detallesMap = buildDetallesMap(detalleRows);
      const historialMap = buildHistorialMap(historialRows, usuarios);

      return mapSolicitud(match, usuarios, detallesMap, historialMap);
    } catch (error) {
      if (isMissingTableError(error)) {
        console.warn('Tabla solped no encontrada en getById.');
        return null;
      }
      console.error('Error en getById solicitud (solped):', error);
      throw error;
    }
  },

  async create(): Promise<SolicitudSKU> {
    throw new Error('Las solicitudes se gestionan directamente desde el ERP.');
  },

  async actualizar(): Promise<SolicitudSKU> {
    throw new Error('Las solicitudes se gestionan directamente desde el ERP.');
  },

  async aprobar(): Promise<SolicitudSKU> {
    throw new Error('Las aprobaciones de solicitudes se realizan en el ERP.');
  },

  async rechazar(): Promise<SolicitudSKU> {
    throw new Error('Los rechazos de solicitudes se realizan en el ERP.');
  },

  async completar(): Promise<SolicitudSKU> {
    throw new Error('La ejecución de solicitudes se realiza en el ERP.');
  },
};
