import { Usuario } from './user.types';

export type BitacoraTipoEntrada = 'medicion' | 'general';

export interface BitacoraVariable {
  id?: string;
  nombre: string;
  unidad?: string | null;
  descripcion?: string | null;
  tipo: 'numero' | 'texto' | 'booleano';
  minimo?: number | null;
  maximo?: number | null;
  deseado?: number | null;
  slug?: string | null;
}

export interface BitacoraPuntoMedicion {
  id?: string;
  nombre: string;
  ubicacion?: string | null;
  descripcion?: string | null;
  slug?: string | null;
}

export interface BitacoraConcepto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  variables: BitacoraVariable[];
  puntos_medicion: BitacoraPuntoMedicion[];
  metadata?: Record<string, any> | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BitacoraMedicionDetalleVariable {
  variable_id: string;
  variable_nombre: string;
  unidad?: string | null;
  valor: number | string | null;
  comentario?: string | null;
}

export interface BitacoraMedicionDetallePunto {
  punto_id: string;
  punto_nombre: string;
  variables: BitacoraMedicionDetalleVariable[];
}

export interface BitacoraMedicionEntrada {
  id: string;
  concepto_id: string;
  concepto_codigo: string;
  concepto_nombre: string;
  fecha_medicion: string;
  hora_medicion?: string | null;
  mediciones: BitacoraMedicionDetallePunto[];
  observaciones?: string | null;
  registrado_por: string;
  registrado_por_nombre: string;
  registrado_por_rol?: string | null;
  firma?: string | null;
  created_at: string;
  updated_at: string;
  usuario?: Usuario | null;
}

export interface CreateBitacoraMedicionInput {
  concepto_id: string;
  concepto_codigo: string;
  concepto_nombre: string;
  fecha_medicion: string;
  mediciones: BitacoraMedicionDetallePunto[];
  observaciones?: string;
}

export interface BitacoraGeneralEntrada {
  id: string;
  fecha: string;
  titulo: string;
  resumen: string;
  actividades?: string | null;
  incidencias?: string | null;
  pendientes?: string | null;
  recomendaciones?: string | null;
  ejecutor_id: string;
  ejecutor_nombre: string;
  turno?: string | null;
  area?: string | null;
  created_at: string;
  updated_at: string;
  usuario?: Usuario | null;
}

export interface CreateBitacoraGeneralInput {
  fecha: string;
  titulo: string;
  resumen: string;
  actividades?: string;
  incidencias?: string;
  pendientes?: string;
  recomendaciones?: string;
  turno?: string;
  area?: string;
}

export interface BitacoraSerieDato {
  fecha: string;
  valor: number;
  punto_id: string;
  punto_nombre: string;
  variable_id: string;
  variable_nombre: string;
  minimo?: number | null;
  maximo?: number | null;
  deseado?: number | null;
}
