import { supabase } from './supabase';
import {
  AssignOrderInput,
  CompleteOrderInput,
  CreateOrdenMttoInput,
  OrderFilters,
  OrderStatus,
  OrdenMtto,
  RateSolicitanteInput,
  SubmitApprovalInput,
} from '../types/order.types';

const ORDER_BASE_SELECT = `
  *,
  solicitante:usuarios!ordenesmtto_solicitante_id_fkey(
    id,
    nombre_completo:nombres,
    last_name,
    mother_last_name,
    email:correo,
    rol:tipouser
  ),
  ejecutor:usuarios!ordenesmtto_ejecutor_id_fkey(
    id,
    nombre_completo:nombres,
    last_name,
    mother_last_name,
    email:correo,
    rol:tipouser
  ),
  supervisor:usuarios!ordenesmtto_supervisor_id_fkey(
    id,
    nombre_completo:nombres,
    last_name,
    mother_last_name,
    email:correo,
    rol:tipouser
  ),
  colaborador_area:usuarios!ordenesmtto_colaborador_area_id_fkey(
    id,
    nombre_completo:nombres,
    last_name,
    mother_last_name,
    email:correo,
    rol:tipouser
  )
`;

const handleError = (context: string, error: any) => {
  if (error) {
    console.error(`[ordersService] ${context}`, error);
    throw error;
  }
};

const buildFilters = (filters?: OrderFilters) => {
  let query = supabase.from('ordenesmtto').select(ORDER_BASE_SELECT).order('created_at', {
    ascending: false,
  });

  if (filters?.status) {
    query = query.eq('estado', filters.status);
  }

  if (filters?.type) {
    query = query.eq('tipo', filters.type);
  }

  if (filters?.assignedTo) {
    query = query.eq('ejecutor_id', filters.assignedTo);
  }

  if (filters?.requestedBy) {
    query = query.eq('solicitante_id', filters.requestedBy);
  }

  return query;
};

const buildStatusUpdate = (status: OrderStatus) => {
  switch (status) {
    case 'pendiente':
      return {
        estado: status,
        fecha_inicio: null,
        fecha_finalizacion: null,
      };
    case 'en_proceso':
      return {
        estado: status,
        fecha_inicio: new Date().toISOString(),
      };
    case 'completado':
      return {
        estado: status,
        fecha_finalizacion: new Date().toISOString(),
      };
    default:
      return {};
  }
};

export const ordersService = {
  async list(filters?: OrderFilters): Promise<OrdenMtto[]> {
    const query = buildFilters(filters);
    const { data, error } = await query;
    handleError('list failed', error);
    return data ?? [];
  },

  async create(input: CreateOrdenMttoInput): Promise<OrdenMtto> {
    const payload = {
      titulo: input.titulo,
      descripcion: input.descripcion,
      tipo: input.tipo,
      prioridad: input.prioridad,
      solicitante_id: input.solicitanteId,
      supervisor_id: input.supervisorId ?? null,
      colaborador_area_id: input.colaboradorAreaId ?? null,
      fecha_programada: input.fechaProgramada ?? null,
      detalles: input.metadata ?? {},
      estado: 'pendiente' as OrderStatus,
      aprobacion_estado: 'pendiente',
    };

    const { data, error } = await supabase
      .from('ordenesmtto')
      .insert(payload)
      .select(ORDER_BASE_SELECT)
      .single();

    handleError('create failed', error);
    return data as OrdenMtto;
  },

  async assignToExecutor({ orderId, executorId }: AssignOrderInput): Promise<OrdenMtto> {
    const { data, error } = await supabase
      .from('ordenesmtto')
      .update({
        ejecutor_id: executorId,
        ...buildStatusUpdate('en_proceso'),
      })
      .eq('id', orderId)
      .select(ORDER_BASE_SELECT)
      .single();

    handleError('assignToExecutor failed', error);
    return data as OrdenMtto;
  },

  async markCompleted({
    orderId,
    executorId,
    trabajosRealizados,
    recursosUtilizados,
    evidencias,
  }: CompleteOrderInput): Promise<OrdenMtto> {
    const { data, error } = await supabase
      .from('ordenesmtto')
      .update({
        ejecutor_id: executorId,
        trabajos_realizados: trabajosRealizados,
        recursos_utilizados: recursosUtilizados ?? null,
        evidencias: evidencias ?? null,
        ...buildStatusUpdate('completado'),
        aprobacion_estado: 'pendiente',
      })
      .eq('id', orderId)
      .select(ORDER_BASE_SELECT)
      .single();

    handleError('markCompleted failed', error);
    return data as OrdenMtto;
  },

  async submitApproval({
    orderId,
    aprobadorId,
    aprobado,
    calificacion,
    comentarios,
  }: SubmitApprovalInput): Promise<OrdenMtto> {
    const { data, error } = await supabase
      .from('ordenesmtto')
      .update({
        aprobador_id: aprobadorId,
        aprobacion_estado: aprobado ? 'aprobado' : 'rechazado',
        aprobacion_fecha: new Date().toISOString(),
        aprobacion_comentarios: comentarios ?? null,
        calificacion_ejecucion: calificacion ?? null,
      })
      .eq('id', orderId)
      .select(ORDER_BASE_SELECT)
      .single();

    handleError('submitApproval failed', error);
    return data as OrdenMtto;
  },

  async rateSolicitante({
    orderId,
    executorId,
    calificacion,
    comentarios,
  }: RateSolicitanteInput): Promise<OrdenMtto> {
    const { data, error } = await supabase
      .from('ordenesmtto')
      .update({
        ejecutor_id: executorId,
        calificacion_solicitante: calificacion,
        retroalimentacion_solicitante: comentarios ?? null,
      })
      .eq('id', orderId)
      .select(ORDER_BASE_SELECT)
      .single();

    handleError('rateSolicitante failed', error);
    return data as OrdenMtto;
  },
};
