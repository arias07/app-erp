
import { supabase } from './supabase';
import {
  SolicitudSKU,
  CreateSolicitudInput,
  UpdateSolicitudInput,
  SolicitudFilters,
} from '../types/solicitud.types';
import { inventoryService } from './inventory.service';

export const solicitudService = {
  /**
   * Obtiene todas las solicitudes con filtros
   */
  getAll: async (filters?: SolicitudFilters): Promise<SolicitudSKU[]> => {
    try {
      let query = supabase
        .from('solicitudes_sku')
        .select(`
          *,
          solicitante:usuarios!solicitudes_sku_id_solicitante_fkey(
            id,
            nombre_completo,
            email,
            rol
          ),
          aprobador:usuarios!solicitudes_sku_id_aprobador_fkey(
            id,
            nombre_completo,
            email
          ),
          productos_pos(
            id,
            nombre,
            sku,
            descripcion,
            unidad_medida
          ),
          ubicacion_origen:ubicaciones!solicitudes_sku_id_ubicacion_origen_fkey(
            id,
            nombre
          ),
          ubicacion_destino:ubicaciones!solicitudes_sku_id_ubicacion_destino_fkey(
            id,
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }

      if (filters?.id_solicitante) {
        query = query.eq('id_solicitante', filters.id_solicitante);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por término de búsqueda
      if (filters?.searchTerm && data) {
        const searchLower = filters.searchTerm.toLowerCase();
        return data.filter((item: any) => {
          const producto = item.productos_pos;
          return (
            producto?.nombre?.toLowerCase().includes(searchLower) ||
            producto?.sku?.toLowerCase().includes(searchLower)
          );
        });
      }

      return data || [];
    } catch (error: any) {
      console.error('Error en getAll solicitudes:', error);
      throw error;
    }
  },

  /**
   * Obtiene solicitudes pendientes para supervisores
   */
  getPendientes: async (): Promise<SolicitudSKU[]> => {
    return await solicitudService.getAll({ estado: 'pendiente' });
  },

  /**
   * Obtiene mis solicitudes
   */
  getMisSolicitudes: async (userId: string): Promise<SolicitudSKU[]> => {
    return await solicitudService.getAll({ id_solicitante: userId });
  },

  /**
   * Obtiene una solicitud por ID
   */
  getById: async (id: number): Promise<SolicitudSKU | null> => {
    try {
      const { data, error } = await supabase
        .from('solicitudes_sku')
        .select(`
          *,
          solicitante:usuarios!solicitudes_sku_id_solicitante_fkey(
            id,
            nombre_completo,
            email,
            rol
          ),
          aprobador:usuarios!solicitudes_sku_id_aprobador_fkey(
            id,
            nombre_completo,
            email
          ),
          productos_pos(
            id,
            nombre,
            sku,
            descripcion,
            unidad_medida
          ),
          ubicacion_origen:ubicaciones!solicitudes_sku_id_ubicacion_origen_fkey(
            id,
            nombre
          ),
          ubicacion_destino:ubicaciones!solicitudes_sku_id_ubicacion_destino_fkey(
            id,
            nombre
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error en getById solicitud:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva solicitud
   */
  create: async (
    input: CreateSolicitudInput,
    userId: string
  ): Promise<SolicitudSKU> => {
    try {
      const { data, error } = await supabase
        .from('solicitudes_sku')
        .insert({
          ...input,
          id_solicitante: userId,
          estado: 'pendiente',
        })
        .select(`
          *,
          productos_pos(
            id,
            nombre,
            sku,
            descripcion,
            unidad_medida
          ),
          ubicacion_origen:ubicaciones!solicitudes_sku_id_ubicacion_origen_fkey(
            id,
            nombre
          ),
          ubicacion_destino:ubicaciones!solicitudes_sku_id_ubicacion_destino_fkey(
            id,
            nombre
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error en create solicitud:', error);
      throw error;
    }
  },

  /**
   * Aprueba una solicitud
   */
  aprobar: async (
    id: number,
    aprobadorId: string,
    observaciones?: string
  ): Promise<SolicitudSKU> => {
    try {
      const { data, error } = await supabase
        .from('solicitudes_sku')
        .update({
          estado: 'aprobado',
          id_aprobador: aprobadorId,
          observaciones: observaciones || null,
        })
        .eq('id', id)
        .select(`
          *,
          solicitante:usuarios!solicitudes_sku_id_solicitante_fkey(
            id,
            nombre_completo,
            email,
            rol
          ),
          aprobador:usuarios!solicitudes_sku_id_aprobador_fkey(
            id,
            nombre_completo,
            email
          ),
          productos_pos(
            id,
            nombre,
            sku,
            descripcion,
            unidad_medida
          ),
          ubicacion_origen:ubicaciones!solicitudes_sku_id_ubicacion_origen_fkey(
            id,
            nombre
          ),
          ubicacion_destino:ubicaciones!solicitudes_sku_id_ubicacion_destino_fkey(
            id,
            nombre
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error en aprobar solicitud:', error);
      throw error;
    }
  },

  /**
   * Rechaza una solicitud
   */
  rechazar: async (
    id: number,
    aprobadorId: string,
    observaciones: string
  ): Promise<SolicitudSKU> => {
    try {
      const { data, error } = await supabase
        .from('solicitudes_sku')
        .update({
          estado: 'rechazado',
          id_aprobador: aprobadorId,
          observaciones,
        })
        .eq('id', id)
        .select(`
          *,
          solicitante:usuarios!solicitudes_sku_id_solicitante_fkey(
            id,
            nombre_completo,
            email,
            rol
          ),
          aprobador:usuarios!solicitudes_sku_id_aprobador_fkey(
            id,
            nombre_completo,
            email
          ),
          productos_pos(
            id,
            nombre,
            sku,
            descripcion,
            unidad_medida
          ),
          ubicacion_origen:ubicaciones!solicitudes_sku_id_ubicacion_origen_fkey(
            id,
            nombre
          ),
          ubicacion_destino:ubicaciones!solicitudes_sku_id_ubicacion_destino_fkey(
            id,
            nombre
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error en rechazar solicitud:', error);
      throw error;
    }
  },

  /**
   * Completa una solicitud aprobada (ejecuta el movimiento de inventario)
   */
  completar: async (id: number): Promise<SolicitudSKU> => {
    try {
      // Obtener la solicitud
      const solicitud = await solicitudService.getById(id);
      
      if (!solicitud) {
        throw new Error('Solicitud no encontrada');
      }

      if (solicitud.estado !== 'aprobada') {
        throw new Error('Solo se pueden completar solicitudes aprobadas');
      }

      // Buscar la existencia en el almacén de origen
      const { data: existencias, error: existError } = await supabase
        .from('existencias_pos')
        .select('*')
        .eq('id_producto', solicitud.id_producto)
        .eq('id_ubicacion', solicitud.id_ubicacion_origen)
        .single();

      if (existError || !existencias) {
        throw new Error('No hay existencias en el almacén de origen');
      }

      if (existencias.stock_actual < solicitud.cantidad) {
        throw new Error('Stock insuficiente en el almacén de origen');
      }

      // Realizar el movimiento según el tipo
      if (solicitud.tipo === 'salida') {
        // Solo restar del origen
        await inventoryService.adjustStock(
          existencias.id,
          solicitud.cantidad,
          'salida'
        );
      } else if (solicitud.tipo === 'transferencia') {
        // Restar del origen
        await inventoryService.adjustStock(
          existencias.id,
          solicitud.cantidad,
          'salida'
        );

        // Buscar o crear existencia en destino
        const { data: existenciaDestino, error: destinoError } = await supabase
          .from('existencias_pos')
          .select('*')
          .eq('id_producto', solicitud.id_producto)
          .eq('id_ubicacion', solicitud.id_ubicacion_destino!)
          .single();

        if (existenciaDestino) {
          // Sumar al destino
          await inventoryService.adjustStock(
            existenciaDestino.id,
            solicitud.cantidad,
            'entrada'
          );
        } else {
          // Crear nueva existencia en destino
          const { error: createError } = await supabase
            .from('existencias_pos')
            .insert({
              id_producto: solicitud.id_producto,
              id_ubicacion: solicitud.id_ubicacion_destino!,
              stock_actual: solicitud.cantidad,
              stock_minimo: 0,
            });

          if (createError) throw createError;
        }
      }

      // Actualizar estado de la solicitud
      const { data, error } = await supabase
        .from('solicitudes_sku')
        .update({
          estado: 'completada',
          fecha_completado: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          productos_pos:id_producto (
            id,
            sku,
            nombre,
            unidad_medida
          ),
          ubicacion_origen:id_ubicacion_origen (
            id,
            nombre
          ),
          ubicacion_destino:id_ubicacion_destino (
            id,
            nombre
          ),
          solicitante:id_solicitante (
            id,
            nombre_completo,
            email,
            rol
          ),
          aprobador:id_aprobador (
            id,
            nombre_completo,
            email,
            rol
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing solicitud:', error);
      throw error;
    }
  },
};
