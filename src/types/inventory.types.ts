
export interface ExistenciaPos {
  id: number;
  id_producto: number;
  id_ubicacion: number;
  id_empresa: number;
  stock: number;
  costo_unitario: number;
  id_lote: number;
  created_at: string;
  // Relaciones
  productos_pos?: {
    id: number;
    nombre: string;
    descripcion?: string;
    sku?: string;
    unidad_medida?: string;
    categoria?: string;
    stock?: number;
    stock_minimo?: number;
    stock_maximo?: number;
    preciocompra?: number;
    precioventa?: number;
  };
  ubicaciones?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  lotes?: {
    id: number;
    numero_lote: string;
    fecha_vencimiento?: string;
  };
  empresa?: {
    id: number;
    nombre: string;
  };
}

export interface InventoryFilters {
  searchTerm?: string;
  id_ubicacion?: number;
  id_empresa?: number;
  stockMinimo?: number;
  categoria?: string;
}

export interface CreateExistenciaInput {
  id_producto: number;
  id_ubicacion: number;
  id_empresa: number;
  stock: number;
  costo_unitario: number;
  id_lote?: number;
}

export interface UpdateExistenciaInput {
  stock?: number;
  costo_unitario?: number;
  id_lote?: number;
}
