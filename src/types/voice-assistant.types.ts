/**
 * Tipos para el Asistente de Voz con IA
 * Sistema de interpretación de lenguaje natural para consultas al ERP
 */

// ============================================================================
// TIPOS DE INTENCIONES (ACTIONS)
// ============================================================================

/**
 * Categorías principales de acciones que el asistente puede procesar
 */
export type AssistantActionCategory =
  | 'query'           // Consultas de información
  | 'report'          // Generación de reportes
  | 'analysis'        // Análisis y métricas
  | 'create'          // Creación de registros
  | 'update'          // Actualización de registros
  | 'notification'    // Notificaciones
  | 'search';         // Búsquedas específicas

/**
 * Acciones específicas del asistente
 */
export type AssistantAction =
  // Consultas de órdenes de mantenimiento
  | 'query_orders'
  | 'query_pending_orders'
  | 'query_my_orders'
  | 'query_orders_by_type'
  | 'query_orders_by_executor'

  // Consultas de inventario
  | 'query_inventory'
  | 'query_low_stock'
  | 'query_product_stock'
  | 'query_inventory_by_location'

  // Consultas de bitácoras
  | 'query_bitacoras'
  | 'query_recent_measurements'
  | 'query_concept_history'

  // Consultas de solicitudes/compras
  | 'query_purchase_requests'
  | 'query_pending_approvals'
  | 'query_my_requests'

  // Reportes ejecutivos
  | 'report_sales'
  | 'report_maintenance_summary'
  | 'report_inventory_status'
  | 'report_financial_summary'
  | 'report_top_clients'
  | 'report_monthly_summary'

  // Análisis y métricas
  | 'analyze_maintenance_performance'
  | 'analyze_executor_efficiency'
  | 'analyze_inventory_turnover'
  | 'analyze_cost_trends'

  // Búsquedas
  | 'search_product'
  | 'search_order'
  | 'search_user'
  | 'search_client';

// ============================================================================
// PARÁMETROS DE CONSULTA
// ============================================================================

/**
 * Tipos de filtros temporales
 */
export type TimeRange =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

/**
 * Parámetros temporales
 */
export interface TimeParameters {
  range?: TimeRange;
  startDate?: string;  // ISO 8601
  endDate?: string;    // ISO 8601
}

/**
 * Filtros para órdenes de mantenimiento
 */
export interface OrderFilters {
  type?: 'correctiva' | 'preventiva' | 'mejora' | 'predictiva' | 'autonomo';
  status?: 'pendiente' | 'en_proceso' | 'completado';
  priority?: 'baja' | 'media' | 'alta' | 'critica';
  executorId?: string;
  solicitanteId?: string;
  supervisorId?: string;
  location?: string;
  area?: string;
}

/**
 * Filtros para inventario
 */
export interface InventoryFilters {
  productId?: number;
  locationId?: number;
  category?: string;
  belowMinimum?: boolean;
  aboveMaximum?: boolean;
  stockThreshold?: number;
}

/**
 * Filtros para bitácoras
 */
export interface BitacoraFilters {
  conceptId?: string;
  conceptCode?: string;
  measurementPointId?: string;
  variableId?: string;
  registeredBy?: string;
}

/**
 * Filtros para solicitudes de compra
 */
export interface PurchaseFilters {
  status?: string;
  responsibleId?: number;
  authorizedBy?: number;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Parámetros unificados para consultas del asistente
 */
export interface AssistantQueryParameters {
  time?: TimeParameters;
  orders?: OrderFilters;
  inventory?: InventoryFilters;
  bitacoras?: BitacoraFilters;
  purchases?: PurchaseFilters;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

// ============================================================================
// CONTEXTO DEL USUARIO
// ============================================================================

/**
 * Contexto del usuario que hace la consulta
 */
export interface UserContext {
  userId: string;
  userName: string;
  role: string;
  permissions: string[];
  locationId?: number;
  areaId?: string;
  language: 'es' | 'en';
}

// ============================================================================
// SOLICITUD AL ASISTENTE
// ============================================================================

/**
 * Solicitud completa al asistente de voz
 */
export interface VoiceAssistantRequest {
  action: AssistantAction;
  category: AssistantActionCategory;
  parameters: AssistantQueryParameters;
  userContext: UserContext;
  rawInput?: string;          // Transcripción original
  confidence?: number;        // Confianza del reconocimiento (0-1)
  timestamp: string;          // ISO 8601
}

// ============================================================================
// RESPUESTA DEL ASISTENTE
// ============================================================================

/**
 * Estado de la respuesta
 */
export type ResponseStatus =
  | 'success'
  | 'partial_success'
  | 'missing_parameters'
  | 'unauthorized'
  | 'error'
  | 'unsupported_request';

/**
 * Tipo de visualización sugerida
 */
export type VisualizationType =
  | 'table'
  | 'chart_line'
  | 'chart_bar'
  | 'chart_pie'
  | 'card'
  | 'list'
  | 'text'
  | 'metric';

/**
 * Parámetros faltantes en la solicitud
 */
export interface MissingParameter {
  field: string;
  description: string;
  type: 'date' | 'number' | 'text' | 'select';
  options?: string[];
  required: boolean;
}

/**
 * Estructura de datos tabulares
 */
export interface TableData {
  columns: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  }>;
  rows: Array<Record<string, any>>;
  totalRows?: number;
  summary?: Record<string, any>;
}

/**
 * Estructura de datos para gráficos
 */
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  options?: Record<string, any>;
}

/**
 * Métrica simple
 */
export interface MetricData {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  comparison?: string;
}

/**
 * Datos de respuesta estructurados
 */
export interface ResponseData {
  type: VisualizationType;
  table?: TableData;
  chart?: ChartData;
  metrics?: MetricData[];
  text?: string;
  list?: Array<Record<string, any>>;
}

/**
 * Respuesta completa del asistente
 */
export interface VoiceAssistantResponse {
  status: ResponseStatus;
  message: string;              // Mensaje para TTS
  data?: ResponseData;          // Datos estructurados para UI
  missingParameters?: MissingParameter[];
  suggestions?: string[];       // Sugerencias de acciones
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    processingTime: number;     // Milisegundos
    dataSource: 'cache' | 'database' | 'rpc';
  };
}

// ============================================================================
// INTENTS DETECTADOS POR NLP
// ============================================================================

/**
 * Entidad detectada en el texto
 */
export interface DetectedEntity {
  type: 'date' | 'location' | 'person' | 'product' | 'number' | 'status';
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

/**
 * Intent detectado por el procesador NLP
 */
export interface DetectedIntent {
  action: AssistantAction;
  category: AssistantActionCategory;
  confidence: number;
  entities: DetectedEntity[];
  parameters: Partial<AssistantQueryParameters>;
}

// ============================================================================
// CONFIGURACIÓN DEL ASISTENTE
// ============================================================================

/**
 * Configuración de reconocimiento de voz
 */
export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

/**
 * Configuración de síntesis de voz
 */
export interface SpeechSynthesisConfig {
  language: string;
  voice?: string;
  rate: number;        // 0.1 - 10
  pitch: number;       // 0 - 2
  volume: number;      // 0 - 1
}

/**
 * Configuración completa del asistente
 */
export interface VoiceAssistantConfig {
  recognition: SpeechRecognitionConfig;
  synthesis: SpeechSynthesisConfig;
  enableTTS: boolean;
  enableSTT: boolean;
  maxRetries: number;
  timeout: number;      // Milisegundos
  cacheEnabled: boolean;
  cacheDuration: number; // Segundos
}

// ============================================================================
// AUDITORÍA
// ============================================================================

/**
 * Registro de interacción con el asistente
 */
export interface VoiceInteractionLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  transcription: string;
  intent: AssistantAction;
  parameters: AssistantQueryParameters;
  response: VoiceAssistantResponse;
  success: boolean;
  duration: number;     // Milisegundos
  timestamp: string;    // ISO 8601
}
