
import { supabase } from '../services/supabase';

/**
 * Verifica los valores reales del enum estatus_solped en la base de datos
 */
export const checkEnumValues = async () => {
  try {
    console.log('🔍 Verificando valores del enum estatus_solped...\n');

    // Obtener algunos registros para ver qué valores tienen
    const { data, error } = await supabase
      .from('solped')
      .select('id, estatus_actual, descripcion')
      .limit(20);

    if (error) {
      console.error('❌ Error al consultar solped:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No hay registros en la tabla solped');
      return;
    }

    // Extraer valores únicos de estatus_actual
    const estatusUnicos = new Set<string>();
    data.forEach((row: any) => {
      if (row.estatus_actual) {
        estatusUnicos.add(row.estatus_actual);
      }
    });

    console.log('✅ Valores encontrados en estatus_actual:');
    Array.from(estatusUnicos).sort().forEach((estatus) => {
      console.log(`   - "${estatus}"`);
    });
  } catch (error) {
    console.error('❌ Error al verificar valores del enum:', error);
  }
};
