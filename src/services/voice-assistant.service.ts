/**
 * Servicio Principal del Asistente de Voz con IA
 * Orquesta NLP, consultas a Supabase y generación de respuestas
 */

import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { nlpService } from './nlp.service';
import { supabase } from './supabase';
import { ordersService } from './orders.service';
import { inventoryService } from './inventory.service';
import { bitacoraService } from './bitacora.service';
import { userService } from './user.service';
import { hasPermission } from '../constants/roles';
import type {
  VoiceAssistantRequest,
  VoiceAssistantResponse,
  ResponseStatus,
  UserContext,
  AssistantAction,
  AssistantQueryParameters,
  ResponseData,
  TableData,
  ChartData,
  MetricData,
  VoiceInteractionLog,
  TimeRange,
} from '../types/voice-assistant.types';

// ============================================================================
// UTILIDADES DE FECHA
// ============================================================================

/**
 * Convierte un TimeRange a fechas absolutas
 */
function resolveTimeRange(range: TimeRange): { startDate: string; endDate: string } {
  const now = dayjs();
  let startDate: dayjs.Dayjs;
  let endDate: dayjs.Dayjs = now;

  switch (range) {
    case 'today':
      startDate = now.startOf('day');
      endDate = now.endOf('day');
      break;
    case 'yesterday':
      startDate = now.subtract(1, 'day').startOf('day');
      endDate = now.subtract(1, 'day').endOf('day');
      break;
    case 'this_week':
      startDate = now.startOf('week');
      endDate = now.endOf('week');
      break;
    case 'last_week':
      startDate = now.subtract(1, 'week').startOf('week');
      endDate = now.subtract(1, 'week').endOf('week');
      break;
    case 'this_month':
      startDate = now.startOf('month');
      endDate = now.endOf('month');
      break;
    case 'last_month':
      startDate = now.subtract(1, 'month').startOf('month');
      endDate = now.subtract(1, 'month').endOf('month');
      break;
    case 'this_quarter':
      startDate = now.startOf('quarter');
      endDate = now.endOf('quarter');
      break;
    case 'last_quarter':
      startDate = now.subtract(1, 'quarter').startOf('quarter');
      endDate = now.subtract(1, 'quarter').endOf('quarter');
      break;
    case 'this_year':
      startDate = now.startOf('year');
      endDate = now.endOf('year');
      break;
    case 'last_year':
      startDate = now.subtract(1, 'year').startOf('year');
      endDate = now.subtract(1, 'year').endOf('year');
      break;
    default:
      startDate = now.subtract(30, 'days');
      endDate = now;
  }

  return {
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: endDate.format('YYYY-MM-DD'),
  };
}

/**
 * Obtiene el nombre del rango de tiempo en español
 */
function getTimeRangeName(range: TimeRange): string {
  const names: Record<TimeRange, string> = {
    today: 'hoy',
    yesterday: 'ayer',
    this_week: 'esta semana',
    last_week: 'la semana pasada',
    this_month: 'este mes',
    last_month: 'el mes pasado',
    this_quarter: 'este trimestre',
    last_quarter: 'el trimestre pasado',
    this_year: 'este año',
    last_year: 'el año pasado',
    custom: 'período personalizado',
  };
  return names[range] || 'período seleccionado';
}

// ============================================================================
// PROCESADORES DE ACCIONES
// ============================================================================

/**
 * Procesa consultas de órdenes de mantenimiento
 */
async function processOrdersQuery(
  action: AssistantAction,
  parameters: AssistantQueryParameters,
  userContext: UserContext
): Promise<ResponseData> {
  const filters: any = { ...parameters.orders };

  // Aplicar filtros temporales
  if (parameters.time?.range) {
    const { startDate, endDate } = resolveTimeRange(parameters.time.range);
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  // Filtros específicos por acción
  if (action === 'query_pending_orders') {
    filters.status = 'pendiente';
  } else if (action === 'query_my_orders') {
    // Según el rol, filtrar por ejecutor, solicitante o supervisor
    if (userContext.role === 'ejecutor' || userContext.role === 'operacion') {
      filters.executorId = userContext.userId;
    } else {
      filters.solicitanteId = userContext.userId;
    }
  }

  // Consultar órdenes
  const orders = await ordersService.list(filters);

  // Construir tabla
  const tableData: TableData = {
    columns: [
      { key: 'folio', label: 'Folio', type: 'number' },
      { key: 'tipo', label: 'Tipo', type: 'text' },
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'estado', label: 'Estado', type: 'text' },
      { key: 'prioridad', label: 'Prioridad', type: 'text' },
      { key: 'fecha_programada', label: 'Fecha', type: 'date' },
    ],
    rows: orders.map(order => ({
      folio: order.folio,
      tipo: order.tipo,
      titulo: order.titulo,
      estado: order.estado,
      prioridad: order.prioridad,
      fecha_programada: order.fecha_programada,
    })),
    totalRows: orders.length,
  };

  // Métricas
  const metrics: MetricData[] = [
    {
      label: 'Total de órdenes',
      value: orders.length,
    },
    {
      label: 'Pendientes',
      value: orders.filter(o => o.estado === 'pendiente').length,
    },
    {
      label: 'En proceso',
      value: orders.filter(o => o.estado === 'en_proceso').length,
    },
    {
      label: 'Completadas',
      value: orders.filter(o => o.estado === 'completado').length,
    },
  ];

  return {
    type: 'table',
    table: tableData,
    metrics,
  };
}

/**
 * Procesa consultas de inventario
 */
async function processInventoryQuery(
  action: AssistantAction,
  parameters: AssistantQueryParameters,
  userContext: UserContext
): Promise<ResponseData> {
  const filters: any = { ...parameters.inventory };

  if (action === 'query_low_stock') {
    filters.belowMinimum = true;
  } else if (action === 'query_product_stock') {
    // El ID del producto vendría en los parámetros
    if (!filters.productId) {
      throw new Error('Se requiere especificar el producto');
    }
  }

  // Consultar inventario
  const inventory = await inventoryService.getAll(filters);

  // Construir tabla
  const tableData: TableData = {
    columns: [
      { key: 'producto', label: 'Producto', type: 'text' },
      { key: 'ubicacion', label: 'Ubicación', type: 'text' },
      { key: 'stock', label: 'Stock', type: 'number' },
      { key: 'costo_unitario', label: 'Costo', type: 'currency' },
    ],
    rows: inventory.map(item => ({
      producto: item.productos_pos?.nombre || 'N/A',
      ubicacion: item.ubicaciones?.descripcion || 'N/A',
      stock: item.stock,
      costo_unitario: item.costo_unitario,
    })),
    totalRows: inventory.length,
  };

  // Métrica total
  const totalStock = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.stock || 0) * (item.costo_unitario || 0),
    0
  );

  const metrics: MetricData[] = [
    {
      label: 'Total de productos',
      value: inventory.length,
    },
    {
      label: 'Stock total',
      value: totalStock,
      unit: 'unidades',
    },
    {
      label: 'Valor del inventario',
      value: totalValue.toFixed(2),
      unit: 'MXN',
    },
  ];

  return {
    type: 'table',
    table: tableData,
    metrics,
  };
}

/**
 * Procesa consultas de bitácoras
 */
async function processBitacoraQuery(
  action: AssistantAction,
  parameters: AssistantQueryParameters,
  userContext: UserContext
): Promise<ResponseData> {
  const limit = parameters.limit || 50;
  const conceptoId = parameters.bitacoras?.conceptId;

  // Consultar bitácoras
  const bitacoras = await bitacoraService.getMediciones(conceptoId, limit);

  // Construir tabla
  const tableData: TableData = {
    columns: [
      { key: 'concepto', label: 'Concepto', type: 'text' },
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'registrado_por', label: 'Registrado por', type: 'text' },
      { key: 'observaciones', label: 'Observaciones', type: 'text' },
    ],
    rows: bitacoras.map(b => ({
      concepto: b.concepto_nombre || 'N/A',
      fecha: b.fecha_medicion,
      registrado_por: b.registrado_por_nombre || 'N/A',
      observaciones: b.observaciones || '-',
    })),
    totalRows: bitacoras.length,
  };

  const metrics: MetricData[] = [
    {
      label: 'Total de registros',
      value: bitacoras.length,
    },
  ];

  return {
    type: 'table',
    table: tableData,
    metrics,
  };
}

/**
 * Procesa reportes ejecutivos
 */
async function processReport(
  action: AssistantAction,
  parameters: AssistantQueryParameters,
  userContext: UserContext
): Promise<ResponseData> {
  // Resolver rango de tiempo
  const timeRange = parameters.time?.range || 'this_month';
  const { startDate, endDate } = resolveTimeRange(timeRange);

  // Llamar a función RPC según el tipo de reporte
  let result: any;

  switch (action) {
    case 'report_maintenance_summary':
      result = await supabase.rpc('asistente_reporte_mantenimiento', {
        p_fecha_inicio: startDate,
        p_fecha_fin: endDate,
      });
      break;

    case 'report_inventory_status':
      result = await supabase.rpc('asistente_reporte_inventario');
      break;

    case 'report_sales':
      result = await supabase.rpc('asistente_reporte_ventas', {
        p_fecha_inicio: startDate,
        p_fecha_fin: endDate,
      });
      break;

    default:
      throw new Error('Reporte no implementado');
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  // Los datos vienen estructurados desde el RPC
  const reportData = result.data || [];

  // Construir respuesta según el tipo de reporte
  if (reportData.length === 0) {
    return {
      type: 'text',
      text: 'No se encontraron datos para el período seleccionado.',
    };
  }

  // Generar tabla genérica
  const columns = Object.keys(reportData[0]).map(key => ({
    key,
    label: key.replace(/_/g, ' ').toUpperCase(),
    type: typeof reportData[0][key] === 'number' ? 'number' : 'text',
  }));

  const tableData: TableData = {
    columns,
    rows: reportData,
    totalRows: reportData.length,
  };

  return {
    type: 'table',
    table: tableData,
  };
}

/**
 * Procesa análisis y métricas
 */
async function processAnalysis(
  action: AssistantAction,
  parameters: AssistantQueryParameters,
  userContext: UserContext
): Promise<ResponseData> {
  // Análisis requieren funciones RPC específicas
  const timeRange = parameters.time?.range || 'this_month';
  const { startDate, endDate } = resolveTimeRange(timeRange);

  let result: any;

  switch (action) {
    case 'analyze_maintenance_performance':
      result = await supabase.rpc('asistente_analizar_desempeno_mtto', {
        p_fecha_inicio: startDate,
        p_fecha_fin: endDate,
      });
      break;

    case 'analyze_executor_efficiency':
      result = await supabase.rpc('asistente_analizar_ejecutores', {
        p_fecha_inicio: startDate,
        p_fecha_fin: endDate,
      });
      break;

    default:
      throw new Error('Análisis no implementado');
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  const analysisData = result.data || {};

  // Convertir a métricas
  const metrics: MetricData[] = Object.keys(analysisData).map(key => ({
    label: key.replace(/_/g, ' '),
    value: analysisData[key],
  }));

  return {
    type: 'metric',
    metrics,
  };
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class VoiceAssistantService {
  /**
   * Procesa una solicitud de voz del usuario
   */
  public async processVoiceInput(
    input: string,
    userContext: UserContext
  ): Promise<VoiceAssistantResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      // 1. Interpretar con NLP
      const intent = await nlpService.processInput(input);

      if (!intent) {
        return this.createErrorResponse(
          'unsupported_request',
          'No pude entender tu solicitud. Por favor, intenta reformularla.',
          requestId,
          startTime
        );
      }

      // 2. Verificar permisos
      const hasPermissionToAction = this.checkPermission(intent.action, userContext);
      if (!hasPermissionToAction) {
        return this.createErrorResponse(
          'unauthorized',
          'No tienes permisos para realizar esta acción.',
          requestId,
          startTime
        );
      }

      // 3. Validar parámetros
      const missingParams = this.validateParameters(intent.action, intent.parameters);
      if (missingParams.length > 0) {
        return {
          status: 'missing_parameters',
          message: 'Necesito más información para completar tu solicitud.',
          missingParameters: missingParams,
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            dataSource: 'database',
          },
        };
      }

      // 4. Ejecutar acción
      const data = await this.executeAction(intent.action, intent.parameters, userContext);

      // 5. Generar mensaje de respuesta
      const message = this.generateResponseMessage(intent.action, intent.parameters, data);

      // 6. Registrar interacción
      await this.logInteraction({
        id: requestId,
        userId: userContext.userId,
        userName: userContext.userName,
        userRole: userContext.role,
        transcription: input,
        intent: intent.action,
        parameters: intent.parameters,
        response: {
          status: 'success',
          message,
          data,
        } as any,
        success: true,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      return {
        status: 'success',
        message,
        data,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          dataSource: 'database',
        },
      };
    } catch (error: any) {
      console.error('[VoiceAssistant] Error:', error);

      return this.createErrorResponse(
        'error',
        'Ocurrió un error al procesar tu solicitud.',
        requestId,
        startTime,
        error
      );
    }
  }

  /**
   * Verifica si el usuario tiene permiso para ejecutar una acción
   */
  private checkPermission(action: AssistantAction, userContext: UserContext): boolean {
    // Mapear acciones a permisos
    const permissionMap: Record<string, string> = {
      query_orders: 'VIEW_ALL_ORDERS',
      query_my_orders: 'CREATE_ORDER',
      query_inventory: 'VIEW_INVENTORY',
      query_bitacoras: 'VIEW_BITACORA',
      query_purchase_requests: 'VIEW_PURCHASE_ORDERS',
      report_sales: 'VIEW_ADVANCED_ANALYTICS',
      report_maintenance_summary: 'VIEW_ALL_ORDERS',
      report_inventory_status: 'VIEW_INVENTORY',
      analyze_maintenance_performance: 'VIEW_ADVANCED_ANALYTICS',
    };

    const requiredPermission = permissionMap[action];
    if (!requiredPermission) {
      return true; // Si no hay permiso específico, permitir
    }

    return hasPermission(userContext.role, requiredPermission as any);
  }

  /**
   * Valida que los parámetros requeridos estén presentes
   */
  private validateParameters(
    action: AssistantAction,
    parameters: Partial<AssistantQueryParameters>
  ): any[] {
    const missingParams: any[] = [];

    // Validaciones específicas por acción
    if (action === 'query_product_stock') {
      if (!parameters.inventory?.productId) {
        missingParams.push({
          field: 'productId',
          description: '¿De qué producto quieres consultar el stock?',
          type: 'text',
          required: true,
        });
      }
    }

    return missingParams;
  }

  /**
   * Ejecuta la acción solicitada
   */
  private async executeAction(
    action: AssistantAction,
    parameters: Partial<AssistantQueryParameters>,
    userContext: UserContext
  ): Promise<ResponseData> {
    const fullParams: AssistantQueryParameters = {
      ...parameters,
      limit: parameters.limit || 50,
    };

    // Enrutar según categoría
    if (action.startsWith('query_orders') || action.includes('order')) {
      return processOrdersQuery(action, fullParams, userContext);
    } else if (action.startsWith('query_inventory') || action.includes('product') || action.includes('stock')) {
      return processInventoryQuery(action, fullParams, userContext);
    } else if (action.startsWith('query_bitacora') || action.includes('measurement')) {
      return processBitacoraQuery(action, fullParams, userContext);
    } else if (action.startsWith('report_')) {
      return processReport(action, fullParams, userContext);
    } else if (action.startsWith('analyze_')) {
      return processAnalysis(action, fullParams, userContext);
    } else {
      throw new Error('Acción no implementada');
    }
  }

  /**
   * Genera un mensaje de respuesta en lenguaje natural
   */
  private generateResponseMessage(
    action: AssistantAction,
    parameters: Partial<AssistantQueryParameters>,
    data: ResponseData
  ): string {
    const timeRange = parameters.time?.range;
    const timeStr = timeRange ? ` para ${getTimeRangeName(timeRange)}` : '';

    // Mensajes base por acción
    const messages: Record<string, string> = {
      query_orders: `Encontré ${data.metrics?.[0]?.value || 0} órdenes de mantenimiento${timeStr}.`,
      query_pending_orders: `Hay ${data.metrics?.[0]?.value || 0} órdenes pendientes${timeStr}.`,
      query_my_orders: `Tienes ${data.metrics?.[0]?.value || 0} órdenes asignadas${timeStr}.`,
      query_inventory: `Encontré ${data.table?.totalRows || 0} productos en inventario.`,
      query_low_stock: `Hay ${data.table?.totalRows || 0} productos con stock bajo.`,
      query_bitacoras: `Encontré ${data.table?.totalRows || 0} registros de bitácoras${timeStr}.`,
      report_maintenance_summary: `Aquí está el resumen de mantenimiento${timeStr}.`,
      report_inventory_status: `Este es el estado actual del inventario.`,
      analyze_maintenance_performance: `Análisis de desempeño de mantenimiento${timeStr}.`,
    };

    return messages[action] || 'Aquí están los resultados de tu consulta.';
  }

  /**
   * Crea una respuesta de error
   */
  private createErrorResponse(
    status: ResponseStatus,
    message: string,
    requestId: string,
    startTime: number,
    error?: any
  ): VoiceAssistantResponse {
    return {
      status,
      message,
      error: error
        ? {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'Error desconocido',
            details: error,
          }
        : undefined,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        dataSource: 'database',
      },
    };
  }

  /**
   * Registra la interacción en la base de datos
   */
  private async logInteraction(log: VoiceInteractionLog): Promise<void> {
    try {
      await supabase.from('voice_interactions').insert({
        id: log.id,
        user_id: log.userId,
        user_name: log.userName,
        user_role: log.userRole,
        transcription: log.transcription,
        intent: log.intent,
        parameters: log.parameters,
        response: log.response,
        success: log.success,
        duration: log.duration,
        created_at: log.timestamp,
      });
    } catch (error) {
      console.error('[VoiceAssistant] Error logging interaction:', error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Obtiene sugerencias de comandos
   */
  public getSuggestions(partialInput: string): string[] {
    return nlpService.getSuggestions(partialInput);
  }
}

export const voiceAssistantService = new VoiceAssistantService();
