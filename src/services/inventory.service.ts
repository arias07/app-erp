import { supabase } from './supabase';
import {
  ExistenciaPos,
  InventoryFilters,
  CreateExistenciaInput,
  UpdateExistenciaInput,
} from '../types/inventory.types';

export const inventoryService = {
  /**
   * Obtiene todas las existencias con sus relaciones
   */
  getAll: async (filters?: InventoryFilters): Promise<ExistenciaPos[]> => {
    try {
      let query = supabase
        .from('existencias_pos')
        .select(`
          *,
          productos_pos (
            id,
            nombre,
            descripcion,
            sku,
            presentacion,
            id_categoria,
            stock,
            stock_minimo,
            stock_maximo,
            preciocompra,
            precioventa
          ),
          ubicaciones (
            id,
            descripcion,
            direccion,
            es_almacen
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.id_ubicacion) {
        query = query.eq('id_ubicacion', filters.id_ubicacion);
      }

      if (filters?.id_empresa) {
        query = query.eq('id_empresa', filters.id_empresa);
      }

      if (filters?.stockMinimo !== undefined) {
        query = query.lte('stock', filters.stockMinimo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por término de búsqueda si existe
      if (filters?.searchTerm && data) {
        const searchLower = filters.searchTerm.toLowerCase();
        return data.filter((item: any) => {
          const producto = item.productos_pos;
          return (
            producto?.nombre?.toLowerCase().includes(searchLower) ||
            producto?.sku?.toLowerCase().includes(searchLower) ||
            producto?.descripcion?.toLowerCase().includes(searchLower)
          );
        });
      }

      return data || [];
    } catch (error: any) {
      console.error('Error en getAll:', error);
      throw error;
    }
  },

  /**
   * Obtiene una existencia por ID con sus relaciones
   */
  getById: async (id: number): Promise<ExistenciaPos | null> => {
    try {
      const { data, error } = await supabase
        .from('existencias_pos')
        .select(`
          *,
          productos_pos (
            id,
            nombre,
            descripcion,
            sku,
            presentacion,
            id_categoria,
            stock,
            stock_minimo,
            stock_maximo,
            preciocompra,
            precioventa
          ),
          ubicaciones (
            id,
            descripcion,
            direccion,
            es_almacen
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error en getById:', error);
      throw error;
    }
  },

  /**
   * Obtiene existencias por producto
   */
  getByProducto: async (id_producto: number): Promise<ExistenciaPos[]> => {
    try {
      const { data, error } = await supabase
        .from('existencias_pos')
        .select(`
          *,
          productos_pos (
            id,
            nombre,
            descripcion,
            sku,
            presentacion,
            id_categoria,
            stock,
            stock_minimo,
            stock_maximo,
            preciocompra,
            precioventa
          ),
          ubicaciones (
            id,
            descripcion,
            direccion,
            es_almacen
          )
        `)
        .eq('id_producto', id_producto);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error en getByProducto:', error);
      throw error;
    }
  },

  /**
   * Obtiene existencias con stock bajo (configurable)
   */
  getLowStock: async (threshold: number = 10): Promise<ExistenciaPos[]> => {
    try {
      const { data, error } = await supabase
        .from('existencias_pos')
        .select(`
          *,
          productos_pos (
            id,
            nombre,
            descripcion,
            sku,
            presentacion,
            id_categoria,
            stock,
            stock_minimo,
            stock_maximo,
            preciocompra,
            precioventa
          ),
          ubicaciones (
            id,
            descripcion,
            direccion,
            es_almacen
          )
        `)
        .lte('stock', threshold)
        .gt('stock', 0)
        .order('stock', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error en getLowStock:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva existencia
   */
  create: async (input: CreateExistenciaInput): Promise<ExistenciaPos> => {
    try {
      const { data, error } = await supabase
        .from('existencias_pos')
        .insert({
          ...input,
          id_lote: input.id_lote || 1, // Lote por defecto
        })
        .select(`
          *,
          productos_pos (
            id,
            nombre,
            descripcion,
            sku,
            presentacion,
            id_categoria,
            stock,
            stock_minimo,
            stock_maximo,
            preciocompra,
            precioventa
          ),
          ubicaciones (
            id,
            nombre,
            descripcion
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error en create:', error);
      throw error;
    }
  },

  /**
   * Actualiza una existencia
   */
  update: async (
    id: number,
    input: UpdateExistenciaInput
  ): Promise<ExistenciaPos> => {
    try {
      const { data, error } = await supabase
        .from('existencias_pos')
        .update(input)
        .eq('id', id)
        .select(`
          *,
          productos_pos (
            id,
            nombre,
            descripcion,
            sku,
            presentacion,
            id_categoria,
            stock,
            stock_minimo,
            stock_maximo,
            preciocompra,
            precioventa
          ),
          ubicaciones (
            id,
            nombre,
            descripcion
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error en update:', error);
      throw error;
    }
  },

  /**
   * Ajusta el stock (suma o resta)
   */
  adjustStock: async (
    id: number,
    cantidad: number,
    tipo: 'entrada' | 'salida'
  ): Promise<ExistenciaPos> => {
    try {
      // Primero obtenemos el stock actual
      const { data: existencia, error: fetchError } = await supabase
        .from('existencias_pos')
        .select('stock')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const nuevoStock =
        tipo === 'entrada'
          ? existencia.stock + cantidad
          : existencia.stock - cantidad;

      // Validar que no quede negativo
      if (nuevoStock < 0) {
        throw new Error('El stock no puede ser negativo');
      }

      return await inventoryService.update(id, { stock: nuevoStock });
    } catch (error: any) {
      console.error('Error en adjustStock:', error);
      throw error;
    }
  },

  /**
   * Elimina una existencia (solo si stock es 0)
   */
  delete: async (id: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('existencias_pos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error en delete:', error);
      throw error;
    }
  },

  /**
   * Obtiene el stock total por producto
   */
  getTotalStockByProducto: async (id_producto: number): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('existencias_pos')
        .select('stock')
        .eq('id_producto', id_producto);

      if (error) throw error;

      return data?.reduce((total, item) => total + (item.stock || 0), 0) || 0;
    } catch (error: any) {
      console.error('Error en getTotalStockByProducto:', error);
      throw error;
    }
  },
};
