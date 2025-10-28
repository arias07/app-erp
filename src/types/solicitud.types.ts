
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'completada';
export type TipoSolicitud = 'salida' | 'transferencia';

export interface SolicitudSKU {
  id: number;
  id_solicitante: string;
  id_producto: number;
  id_ubicacion_origen: number;
  id_ubicacion_destino?: number; // Solo para transferencias
  cantidad: number;
  tipo: TipoSolicitud;
  estado: EstadoSolicitud;
  motivo?: string;
  observaciones?: string;
  id_aprobador?: string;
  fecha_aprobacion?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  solicitante?: {
    id: string;
    nombre_completo: string;
    email: string;
    rol: string;
  };
  aprobador?: {
    id: string;
    nombre_completo: string;
    email: string;
  };
  productos_pos?: {
    id: number;
    nombre: string;
    sku: string;
    descripcion?: string;
    unidad_medida?: string;
  };
  ubicacion_origen?: {
    id: number;
    nombre: string;
  };
  ubicacion_destino?: {
    id: number;
    nombre: string;
  };
}

export interface CreateSolicitudInput {
  id_producto: number;
  id_ubicacion_origen: number;
  id_ubicacion_destino?: number;
  cantidad: number;
  tipo: TipoSolicitud;
  motivo?: string;
}

export interface UpdateSolicitudInput {
  estado?: EstadoSolicitud;
  observaciones?: string;
  id_aprobador?: string;
}

export interface SolicitudFilters {
  estado?: EstadoSolicitud;
  tipo?: TipoSolicitud;
  id_solicitante?: string;
  searchTerm?: string;
}
