
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'completada' | 'cancelada';

export interface SolicitudUsuario {
  id: string;
  nombre: string;
  correo?: string | null;
  rol?: string | null;
}

export interface SolicitudDetalle {
  id: string;
  id_solped: string;
  id_producto?: number | string | null;
  id_proveedor?: number | string | null;
  cantidad?: number | null;
  costo_unitario?: number | null;
}

export interface SolicitudHistorial {
  id: string;
  id_solped: string;
  fecha: string;
  estatus: string;
  comentario?: string | null;
  usuario?: SolicitudUsuario;
}

export interface SolicitudSKU {
  id: string;
  descripcion?: string | null;
  fecha: string;
  divisa?: string | null;
  total?: number | null;
  estado: EstadoSolicitud;
  motivo?: string | null;
  observaciones?: string | null;
  responsable?: SolicitudUsuario;
  autorizado?: SolicitudUsuario;
  detalles: SolicitudDetalle[];
  historial: SolicitudHistorial[];
}

export interface SolicitudFilters {
  estado?: EstadoSolicitud;
  responsableId?: string;
  searchTerm?: string;
}

export interface CreateSolicitudInput {
  // Placeholder – las solicitudes se gestionan en el ERP
}

export interface UpdateSolicitudInput {
  // Placeholder – las solicitudes se gestionan en el ERP
}
