import { Usuario } from './user.types';

export type OrderType = 'correctiva' | 'preventiva' | 'mejora' | 'predictiva' | 'autonomo';

export type OrderStatus = 'pendiente' | 'en_proceso' | 'completado';

export type OrderPriority = 'baja' | 'media' | 'alta' | 'critica';

export type OrderApprovalStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface OrderFilters {
  status?: OrderStatus;
  type?: OrderType;
  assignedTo?: string;
  requestedBy?: string;
}

export interface OrderEvidence {
  url: string;
  path: string;
  bucket: string;
  tipo: string;
  nombre: string;
}

export interface CreateOrdenMttoInput {
  titulo: string;
  descripcion: string;
  tipo: OrderType;
  prioridad: OrderPriority;
  solicitanteId: string;
  fechaProgramada?: string;
  supervisorId?: string;
  colaboradorAreaId?: string;
  metadata: Record<string, any>;
}

export interface AssignOrderInput {
  orderId: string;
  executorId: string;
}

export interface CompleteOrderInput {
  orderId: string;
  executorId: string;
  trabajosRealizados: string;
  recursosUtilizados?: string;
  evidencias?: OrderEvidence[];
}

export interface SubmitApprovalInput {
  orderId: string;
  aprobadorId: string;
  aprobado: boolean;
  calificacion?: number;
  comentarios?: string;
}

export interface RateSolicitanteInput {
  orderId: string;
  executorId: string;
  calificacion: number;
  comentarios?: string;
}

export interface OrdenMtto {
  id: string;
  folio: number;
  tipo: OrderType;
  estado: OrderStatus;
  prioridad: OrderPriority;
  titulo: string;
  descripcion: string;
  solicitante_id: string;
  colaborador_area_id?: string | null;
  supervisor_id?: string | null;
  ejecutor_id?: string | null;
  aprobador_id?: string | null;
  aprobacion_estado: OrderApprovalStatus;
  aprobacion_fecha?: string | null;
  aprobacion_comentarios?: string | null;
  calificacion_ejecucion?: number | null;
  calificacion_solicitante?: number | null;
  fecha_programada?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  fecha_cierre?: string | null;
  trabajos_realizados?: string | null;
  recursos_utilizados?: string | null;
  detalles: Record<string, any> | null;
  evidencias?: OrderEvidence[] | null;
  created_at: string;
  updated_at: string;
  solicitante?: Usuario | null;
  ejecutor?: Usuario | null;
  supervisor?: Usuario | null;
  colaborador_area?: Usuario | null;
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  correctiva: 'Correctiva',
  preventiva: 'Preventiva',
  mejora: 'Mejora',
  predictiva: 'Predictiva',
  autonomo: 'Autonomo',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completado: 'Completado',
};

export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Critica',
};
