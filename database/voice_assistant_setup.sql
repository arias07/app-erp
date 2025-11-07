-- ============================================================================
-- CONFIGURACIÓN DE BASE DE DATOS PARA ASISTENTE DE VOZ
-- ============================================================================
-- Este archivo contiene todas las definiciones SQL necesarias para el
-- funcionamiento del asistente de voz con IA en el ERP
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA DE AUDITORÍA DE INTERACCIONES DE VOZ
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS voice_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  transcription TEXT NOT NULL,          -- Texto transcrito de voz
  intent TEXT NOT NULL,                 -- Acción detectada (AssistantAction)
  parameters JSONB DEFAULT '{}'::jsonb, -- Parámetros extraídos
  response JSONB DEFAULT '{}'::jsonb,   -- Respuesta completa del asistente
  success BOOLEAN DEFAULT true,
  duration INTEGER,                     -- Duración en milisegundos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_voice_interactions_user_id ON voice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_intent ON voice_interactions(intent);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_created_at ON voice_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_success ON voice_interactions(success);

-- Comentarios
COMMENT ON TABLE voice_interactions IS 'Registro de todas las interacciones con el asistente de voz';
COMMENT ON COLUMN voice_interactions.transcription IS 'Texto original transcrito desde voz';
COMMENT ON COLUMN voice_interactions.intent IS 'Intención detectada por el NLP';
COMMENT ON COLUMN voice_interactions.parameters IS 'Parámetros extraídos de la consulta';
COMMENT ON COLUMN voice_interactions.response IS 'Respuesta completa del asistente (JSON)';
COMMENT ON COLUMN voice_interactions.duration IS 'Tiempo de procesamiento en milisegundos';

-- ----------------------------------------------------------------------------
-- 2. FUNCIÓN RPC: REPORTE DE MANTENIMIENTO
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION asistente_reporte_mantenimiento(
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS TABLE(
  tipo TEXT,
  total_ordenes BIGINT,
  pendientes BIGINT,
  en_proceso BIGINT,
  completadas BIGINT,
  tiempo_promedio_resolucion NUMERIC,
  calificacion_promedio NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.tipo,
    COUNT(*) AS total_ordenes,
    COUNT(*) FILTER (WHERE o.estado = 'pendiente') AS pendientes,
    COUNT(*) FILTER (WHERE o.estado = 'en_proceso') AS en_proceso,
    COUNT(*) FILTER (WHERE o.estado = 'completado') AS completadas,
    AVG(
      EXTRACT(EPOCH FROM (o.fecha_finalizacion - o.fecha_inicio)) / 3600
    )::NUMERIC(10,2) AS tiempo_promedio_resolucion,
    AVG(o.calificacion_ejecucion)::NUMERIC(3,2) AS calificacion_promedio
  FROM ordenesmtto o
  WHERE
    o.created_at >= p_fecha_inicio
    AND o.created_at <= p_fecha_fin
  GROUP BY o.tipo
  ORDER BY total_ordenes DESC;
END;
$$;

COMMENT ON FUNCTION asistente_reporte_mantenimiento IS
'Genera un resumen de órdenes de mantenimiento por tipo en un período';

-- ----------------------------------------------------------------------------
-- 3. FUNCIÓN RPC: REPORTE DE INVENTARIO
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION asistente_reporte_inventario()
RETURNS TABLE(
  categoria TEXT,
  total_productos BIGINT,
  stock_total NUMERIC,
  valor_total NUMERIC,
  productos_bajo_minimo BIGINT,
  productos_sobre_maximo BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p.presentacion, 'Sin categoría') AS categoria,
    COUNT(DISTINCT p.id) AS total_productos,
    SUM(e.stock)::NUMERIC AS stock_total,
    SUM(e.stock * e.costo_unitario)::NUMERIC(12,2) AS valor_total,
    COUNT(*) FILTER (WHERE e.stock < COALESCE(p.stock_minimo, 0)) AS productos_bajo_minimo,
    COUNT(*) FILTER (WHERE e.stock > COALESCE(p.stock_maximo, 999999)) AS productos_sobre_maximo
  FROM existencias_pos e
  INNER JOIN productos_pos p ON p.id = e.id_producto
  GROUP BY p.presentacion
  ORDER BY valor_total DESC;
END;
$$;

COMMENT ON FUNCTION asistente_reporte_inventario IS
'Genera un resumen del estado actual del inventario por categoría';

-- ----------------------------------------------------------------------------
-- 4. FUNCIÓN RPC: REPORTE DE VENTAS (PLACEHOLDER)
-- ----------------------------------------------------------------------------
-- NOTA: Esta función depende de las tablas de ventas de tu sistema
-- Ajusta los nombres de tablas según tu esquema

CREATE OR REPLACE FUNCTION asistente_reporte_ventas(
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS TABLE(
  fecha DATE,
  total_ventas NUMERIC,
  numero_transacciones BIGINT,
  ticket_promedio NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- PLACEHOLDER: Ajusta esta consulta según tu esquema de ventas
  RETURN QUERY
  SELECT
    p_fecha_inicio::DATE AS fecha,
    0::NUMERIC AS total_ventas,
    0::BIGINT AS numero_transacciones,
    0::NUMERIC AS ticket_promedio
  WHERE FALSE; -- Deshabilitar hasta implementar

  -- EJEMPLO de implementación (descomentar y ajustar):
  /*
  RETURN QUERY
  SELECT
    v.fecha::DATE,
    SUM(v.total)::NUMERIC(12,2) AS total_ventas,
    COUNT(*)::BIGINT AS numero_transacciones,
    AVG(v.total)::NUMERIC(12,2) AS ticket_promedio
  FROM ventas v
  WHERE
    v.fecha >= p_fecha_inicio
    AND v.fecha <= p_fecha_fin
  GROUP BY v.fecha::DATE
  ORDER BY v.fecha;
  */
END;
$$;

COMMENT ON FUNCTION asistente_reporte_ventas IS
'Genera un reporte de ventas por día (REQUIERE IMPLEMENTACIÓN)';

-- ----------------------------------------------------------------------------
-- 5. FUNCIÓN RPC: ANÁLISIS DE DESEMPEÑO DE MANTENIMIENTO
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION asistente_analizar_desempeno_mtto(
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_total_ordenes INTEGER;
  v_completadas INTEGER;
  v_tasa_completado NUMERIC;
  v_tiempo_promedio NUMERIC;
  v_calificacion_promedio NUMERIC;
  v_ordenes_urgentes INTEGER;
BEGIN
  -- Total de órdenes
  SELECT COUNT(*) INTO v_total_ordenes
  FROM ordenesmtto
  WHERE created_at >= p_fecha_inicio AND created_at <= p_fecha_fin;

  -- Órdenes completadas
  SELECT COUNT(*) INTO v_completadas
  FROM ordenesmtto
  WHERE
    created_at >= p_fecha_inicio
    AND created_at <= p_fecha_fin
    AND estado = 'completado';

  -- Tasa de completado
  v_tasa_completado := CASE
    WHEN v_total_ordenes > 0 THEN (v_completadas::NUMERIC / v_total_ordenes) * 100
    ELSE 0
  END;

  -- Tiempo promedio de resolución (en horas)
  SELECT AVG(EXTRACT(EPOCH FROM (fecha_finalizacion - fecha_inicio)) / 3600)
  INTO v_tiempo_promedio
  FROM ordenesmtto
  WHERE
    created_at >= p_fecha_inicio
    AND created_at <= p_fecha_fin
    AND estado = 'completado'
    AND fecha_inicio IS NOT NULL
    AND fecha_finalizacion IS NOT NULL;

  -- Calificación promedio
  SELECT AVG(calificacion_ejecucion)
  INTO v_calificacion_promedio
  FROM ordenesmtto
  WHERE
    created_at >= p_fecha_inicio
    AND created_at <= p_fecha_fin
    AND calificacion_ejecucion IS NOT NULL;

  -- Órdenes urgentes (alta o crítica)
  SELECT COUNT(*) INTO v_ordenes_urgentes
  FROM ordenesmtto
  WHERE
    created_at >= p_fecha_inicio
    AND created_at <= p_fecha_fin
    AND prioridad IN ('alta', 'critica');

  -- Construir resultado JSON
  v_result := jsonb_build_object(
    'total_ordenes', v_total_ordenes,
    'ordenes_completadas', v_completadas,
    'tasa_completado_porcentaje', ROUND(v_tasa_completado, 2),
    'tiempo_promedio_horas', ROUND(COALESCE(v_tiempo_promedio, 0), 2),
    'calificacion_promedio', ROUND(COALESCE(v_calificacion_promedio, 0), 2),
    'ordenes_urgentes', v_ordenes_urgentes
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION asistente_analizar_desempeno_mtto IS
'Analiza el desempeño del área de mantenimiento en un período';

-- ----------------------------------------------------------------------------
-- 6. FUNCIÓN RPC: ANÁLISIS DE EFICIENCIA DE EJECUTORES
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION asistente_analizar_ejecutores(
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS TABLE(
  ejecutor_id TEXT,
  ejecutor_nombre TEXT,
  total_ordenes BIGINT,
  ordenes_completadas BIGINT,
  tasa_completado NUMERIC,
  tiempo_promedio_horas NUMERIC,
  calificacion_promedio NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.ejecutor_id,
    u.nombres || ' ' || COALESCE(u.last_name, '') AS ejecutor_nombre,
    COUNT(*) AS total_ordenes,
    COUNT(*) FILTER (WHERE o.estado = 'completado') AS ordenes_completadas,
    (COUNT(*) FILTER (WHERE o.estado = 'completado')::NUMERIC / COUNT(*) * 100)::NUMERIC(5,2) AS tasa_completado,
    AVG(
      EXTRACT(EPOCH FROM (o.fecha_finalizacion - o.fecha_inicio)) / 3600
    )::NUMERIC(10,2) AS tiempo_promedio_horas,
    AVG(o.calificacion_ejecucion)::NUMERIC(3,2) AS calificacion_promedio
  FROM ordenesmtto o
  INNER JOIN usuarios u ON u.idauth = o.ejecutor_id
  WHERE
    o.created_at >= p_fecha_inicio
    AND o.created_at <= p_fecha_fin
    AND o.ejecutor_id IS NOT NULL
  GROUP BY o.ejecutor_id, u.nombres, u.last_name
  ORDER BY ordenes_completadas DESC, calificacion_promedio DESC
  LIMIT 10;
END;
$$;

COMMENT ON FUNCTION asistente_analizar_ejecutores IS
'Analiza la eficiencia de los ejecutores de mantenimiento';

-- ----------------------------------------------------------------------------
-- 7. FUNCIÓN RPC: BÚSQUEDA INTELIGENTE DE PRODUCTOS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION asistente_buscar_producto(
  p_busqueda TEXT
)
RETURNS TABLE(
  id INTEGER,
  nombre TEXT,
  descripcion TEXT,
  sku TEXT,
  stock_total NUMERIC,
  precio_venta NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nombre,
    p.descripcion,
    p.sku,
    SUM(e.stock)::NUMERIC AS stock_total,
    p.precioventa
  FROM productos_pos p
  LEFT JOIN existencias_pos e ON e.id_producto = p.id
  WHERE
    p.nombre ILIKE '%' || p_busqueda || '%'
    OR p.descripcion ILIKE '%' || p_busqueda || '%'
    OR p.sku ILIKE '%' || p_busqueda || '%'
  GROUP BY p.id, p.nombre, p.descripcion, p.sku, p.precioventa
  ORDER BY p.nombre
  LIMIT 20;
END;
$$;

COMMENT ON FUNCTION asistente_buscar_producto IS
'Búsqueda inteligente de productos por nombre, descripción o SKU';

-- ----------------------------------------------------------------------------
-- 8. FUNCIÓN RPC: OBTENER ESTADÍSTICAS GENERALES DEL SISTEMA
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION asistente_estadisticas_generales()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_total_ordenes INTEGER;
  v_ordenes_pendientes INTEGER;
  v_total_productos INTEGER;
  v_productos_bajo_stock INTEGER;
  v_valor_inventario NUMERIC;
  v_bitacoras_hoy INTEGER;
  v_solicitudes_pendientes INTEGER;
BEGIN
  -- Órdenes de mantenimiento
  SELECT COUNT(*) INTO v_total_ordenes FROM ordenesmtto;
  SELECT COUNT(*) INTO v_ordenes_pendientes FROM ordenesmtto WHERE estado = 'pendiente';

  -- Inventario
  SELECT COUNT(DISTINCT id_producto) INTO v_total_productos FROM existencias_pos;

  SELECT COUNT(DISTINCT e.id_producto) INTO v_productos_bajo_stock
  FROM existencias_pos e
  INNER JOIN productos_pos p ON p.id = e.id_producto
  WHERE e.stock < COALESCE(p.stock_minimo, 0);

  SELECT SUM(stock * costo_unitario) INTO v_valor_inventario FROM existencias_pos;

  -- Bitácoras
  SELECT COUNT(*) INTO v_bitacoras_hoy
  FROM bitacoras
  WHERE fecha_medicion = CURRENT_DATE;

  -- Solicitudes
  SELECT COUNT(*) INTO v_solicitudes_pendientes
  FROM solped
  WHERE estatus_actual = 'POR AUTORIZAR';

  -- Construir JSON
  v_result := jsonb_build_object(
    'ordenes_mantenimiento', jsonb_build_object(
      'total', v_total_ordenes,
      'pendientes', v_ordenes_pendientes
    ),
    'inventario', jsonb_build_object(
      'total_productos', v_total_productos,
      'productos_bajo_stock', v_productos_bajo_stock,
      'valor_total', ROUND(COALESCE(v_valor_inventario, 0), 2)
    ),
    'bitacoras', jsonb_build_object(
      'registros_hoy', v_bitacoras_hoy
    ),
    'solicitudes', jsonb_build_object(
      'pendientes_autorizacion', v_solicitudes_pendientes
    )
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION asistente_estadisticas_generales IS
'Obtiene un resumen de las estadísticas principales del sistema';

-- ----------------------------------------------------------------------------
-- 9. POLÍTICA DE SEGURIDAD RLS (Row Level Security)
-- ----------------------------------------------------------------------------

-- Habilitar RLS en la tabla de interacciones
ALTER TABLE voice_interactions ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias interacciones
CREATE POLICY voice_interactions_select_own
  ON voice_interactions
  FOR SELECT
  USING (user_id = auth.uid()::TEXT);

-- Política: Los usuarios pueden insertar sus propias interacciones
CREATE POLICY voice_interactions_insert_own
  ON voice_interactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

-- Política: Los superadmins pueden ver todas las interacciones
CREATE POLICY voice_interactions_select_admin
  ON voice_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE idauth = auth.uid()::TEXT
      AND tipouser IN ('superadmin', 'administrador')
    )
  );

-- ----------------------------------------------------------------------------
-- 10. VISTAS ÚTILES
-- ----------------------------------------------------------------------------

-- Vista: Resumen de uso del asistente por usuario
CREATE OR REPLACE VIEW vista_uso_asistente_por_usuario AS
SELECT
  user_id,
  user_name,
  user_role,
  COUNT(*) AS total_interacciones,
  COUNT(*) FILTER (WHERE success = true) AS interacciones_exitosas,
  COUNT(*) FILTER (WHERE success = false) AS interacciones_fallidas,
  AVG(duration)::INTEGER AS duracion_promedio_ms,
  MAX(created_at) AS ultima_interaccion,
  jsonb_object_agg(intent, count_intent) AS intents_mas_usados
FROM (
  SELECT
    user_id,
    user_name,
    user_role,
    success,
    duration,
    created_at,
    intent,
    COUNT(*) OVER (PARTITION BY user_id, intent) AS count_intent
  FROM voice_interactions
) sub
GROUP BY user_id, user_name, user_role;

COMMENT ON VIEW vista_uso_asistente_por_usuario IS
'Estadísticas de uso del asistente de voz por usuario';

-- Vista: Intenciones más utilizadas
CREATE OR REPLACE VIEW vista_intenciones_populares AS
SELECT
  intent,
  COUNT(*) AS total_usos,
  COUNT(*) FILTER (WHERE success = true) AS usos_exitosos,
  COUNT(*) FILTER (WHERE success = false) AS usos_fallidos,
  (COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*) * 100)::NUMERIC(5,2) AS tasa_exito,
  AVG(duration)::INTEGER AS duracion_promedio_ms,
  MAX(created_at) AS ultimo_uso
FROM voice_interactions
GROUP BY intent
ORDER BY total_usos DESC;

COMMENT ON VIEW vista_intenciones_populares IS
'Intenciones más utilizadas en el asistente de voz';

-- ----------------------------------------------------------------------------
-- FIN DEL SCRIPT
-- ----------------------------------------------------------------------------

-- Para ejecutar este script en Supabase:
-- 1. Ve a SQL Editor en tu panel de Supabase
-- 2. Copia y pega este script completo
-- 3. Ejecuta el script
-- 4. Verifica que todas las funciones y tablas se crearon correctamente
