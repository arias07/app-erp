import { supabase } from './supabase';
import { notificationService } from './notification.service';
import {
  BitacoraConcepto,
  BitacoraMedicionEntrada,
  BitacoraMedicionDetallePunto,
  CreateBitacoraMedicionInput,
  BitacoraGeneralEntrada,
  CreateBitacoraGeneralInput,
  BitacoraSerieDato,
} from '../types/bitacora.types';

const conceptosSelect = `
  id,
  codigo,
  nombre,
  descripcion,
  variables,
  puntos_medicion,
  metadata,
  activo,
  created_at,
  updated_at
`;

const medicionesSelect = `
  id,
  concepto_id,
  concepto_codigo,
  concepto_nombre,
  fecha_medicion,
  hora_medicion,
  mediciones,
  observaciones,
  registrado_por,
  registrado_por_nombre,
  registrado_por_rol,
  firma,
  created_at,
  updated_at
`;

const generalSelect = `
  id,
  fecha,
  titulo,
  resumen,
  actividades,
  incidencias,
  pendientes,
  recomendaciones,
  ejecutor_id,
  ejecutor_nombre,
  turno,
  area,
  created_at,
  updated_at
`;

export const bitacoraService = {
  async getConceptos(): Promise<BitacoraConcepto[]> {
    const { data, error } = await supabase
      .from('bitacora_conceptos')
      .select(conceptosSelect)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async getConceptoById(id: string): Promise<BitacoraConcepto | null> {
    const { data, error } = await supabase
      .from('bitacora_conceptos')
      .select(conceptosSelect)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  async getMediciones(conceptoId?: string, limit: number = 50): Promise<BitacoraMedicionEntrada[]> {
    let query = supabase
      .from('bitacoras')
      .select(medicionesSelect)
      .eq('tipo', 'medicion')
      .order('fecha_medicion', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (conceptoId) {
      query = query.eq('concepto_id', conceptoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async createMedicion(
    input: CreateBitacoraMedicionInput,
    user: { id: string; nombre: string; rol?: string }
  ): Promise<BitacoraMedicionEntrada> {
    const payload = {
      tipo: 'medicion',
      concepto_id: input.concepto_id,
      concepto_codigo: input.concepto_codigo,
      concepto_nombre: input.concepto_nombre,
      fecha_medicion: input.fecha_medicion,
      mediciones: input.mediciones,
      observaciones: input.observaciones ?? null,
      registrado_por: user.id,
      registrado_por_nombre: user.nombre,
      registrado_por_rol: user.rol ?? null,
      firma: user.nombre,
    };

    const { data, error } = await supabase
      .from('bitacoras')
      .insert(payload)
      .select(medicionesSelect)
      .single();

    if (error) throw error;
    return data as BitacoraMedicionEntrada;
  },

  async getBitacoraGeneral(limit: number = 30): Promise<BitacoraGeneralEntrada[]> {
    const { data, error } = await supabase
      .from('bitacora_general')
      .select(generalSelect)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },

  async createBitacoraGeneral(
    input: CreateBitacoraGeneralInput,
    user: { id: string; nombre: string; rol?: string }
  ): Promise<BitacoraGeneralEntrada> {
    const payload = {
      fecha: input.fecha,
      titulo: input.titulo,
      resumen: input.resumen,
      actividades: input.actividades ?? null,
      incidencias: input.incidencias ?? null,
      pendientes: input.pendientes ?? null,
      recomendaciones: input.recomendaciones ?? null,
      turno: input.turno ?? null,
      area: input.area ?? null,
      ejecutor_id: user.id,
      ejecutor_nombre: user.nombre,
      ejecutor_rol: user.rol ?? null,
    };

    const { data, error } = await supabase
      .from('bitacora_general')
      .insert(payload)
      .select(generalSelect)
      .single();

    if (error) throw error;
    return data as BitacoraGeneralEntrada;
  },

  async getSeriesByConceptAndPoint(
    conceptoId: string,
    puntoId: string,
    variableId: string,
    limit: number = 20
  ): Promise<BitacoraSerieDato[]> {
    const { data, error } = await supabase.rpc('bitacora_obtener_series', {
      p_concepto_id: conceptoId,
      p_punto_id: puntoId,
      p_variable_id: variableId,
      p_limit: limit,
    });

    if (error) throw error;
    return (data ?? []) as BitacoraSerieDato[];
  },

  async evaluateThresholds(
    concepto: BitacoraConcepto,
    mediciones: BitacoraMedicionDetallePunto[],
    entry: BitacoraMedicionEntrada
  ): Promise<void> {
    const variablesMap = new Map(concepto.variables.map((variable) => [variable.id, variable]));

    const alerts: BitacoraSerieDato[] = [];

    mediciones.forEach((punto) => {
      punto.variables.forEach((variable) => {
        const meta = variablesMap.get(variable.variable_id);
        if (!meta) return;
        if (meta.minimo == null && meta.maximo == null) return;

        const numericValue = Number(variable.valor);
        if (Number.isNaN(numericValue)) {
          return;
        }

        const isBelow = meta.minimo != null && numericValue < meta.minimo;
        const isAbove = meta.maximo != null && numericValue > meta.maximo;

        if (isBelow || isAbove) {
          alerts.push({
            fecha: entry.fecha_medicion,
            valor: numericValue,
            punto_id: punto.punto_id,
            punto_nombre: punto.punto_nombre,
            variable_id: variable.variable_id,
            variable_nombre: variable.variable_nombre,
            minimo: meta.minimo ?? null,
            maximo: meta.maximo ?? null,
            deseado: meta.deseado ?? null,
          });
        }
      });
    });

    if (alerts.length > 0) {
      await notificationService.sendBitacoraThresholdAlert(concepto, entry, alerts);
    }
  },
};
