/**
 * Servicio de Procesamiento de Lenguaje Natural (NLP)
 * Interpreta comandos de voz en español y los convierte en acciones estructuradas
 */

import {
  AssistantAction,
  AssistantActionCategory,
  AssistantQueryParameters,
  DetectedEntity,
  DetectedIntent,
  TimeParameters,
  TimeRange,
} from '../types/voice-assistant.types';

// ============================================================================
// PATRONES DE RECONOCIMIENTO
// ============================================================================

/**
 * Patrón para detectar intenciones
 */
interface IntentPattern {
  action: AssistantAction;
  category: AssistantActionCategory;
  keywords: string[];
  patterns: RegExp[];
  examples: string[];
}

/**
 * Catálogo de patrones de intenciones
 */
const INTENT_PATTERNS: IntentPattern[] = [
  // ÓRDENES DE MANTENIMIENTO
  {
    action: 'query_orders',
    category: 'query',
    keywords: ['órdenes', 'ordenes', 'mantenimiento', 'trabajos', 'servicios'],
    patterns: [
      /(?:muestra|dame|lista|ver)\s+(?:las\s+)?(?:órdenes|ordenes)/i,
      /(?:órdenes|ordenes)\s+de\s+mantenimiento/i,
      /(?:trabajos|servicios)\s+(?:pendientes|realizados|en proceso)/i,
    ],
    examples: [
      'Muestra las órdenes de mantenimiento',
      'Dame las órdenes pendientes',
      'Ver trabajos realizados',
    ],
  },
  {
    action: 'query_pending_orders',
    category: 'query',
    keywords: ['pendientes', 'por hacer', 'sin asignar', 'nuevas'],
    patterns: [
      /(?:órdenes|ordenes|trabajos)\s+pendientes/i,
      /(?:órdenes|ordenes)\s+(?:sin asignar|por asignar)/i,
      /(?:nuevas|recientes)\s+(?:órdenes|ordenes)/i,
    ],
    examples: [
      'Órdenes pendientes',
      'Trabajos sin asignar',
      'Nuevas órdenes',
    ],
  },
  {
    action: 'query_my_orders',
    category: 'query',
    keywords: ['mis órdenes', 'mis trabajos', 'asignadas a mi', 'mis tareas'],
    patterns: [
      /(?:mis|mi)\s+(?:órdenes|ordenes|trabajos|tareas)/i,
      /(?:órdenes|ordenes|trabajos)\s+(?:asignadas?\s+)?(?:a\s+)?(?:mi|mí)/i,
    ],
    examples: [
      'Mis órdenes',
      'Trabajos asignados a mí',
      'Mis tareas pendientes',
    ],
  },
  {
    action: 'query_orders_by_type',
    category: 'query',
    keywords: ['correctiva', 'preventiva', 'mejora', 'predictiva', 'tipo'],
    patterns: [
      /(?:órdenes|ordenes)\s+(?:de\s+tipo\s+)?(?:correctiva|preventiva|mejora|predictiva)/i,
      /mantenimiento\s+(?:correctivo|preventivo|predictivo)/i,
    ],
    examples: [
      'Órdenes de tipo correctiva',
      'Mantenimiento preventivo',
      'Órdenes de mejora',
    ],
  },
  {
    action: 'query_orders_by_executor',
    category: 'query',
    keywords: ['ejecutor', 'asignadas a', 'trabajos de', 'técnico'],
    patterns: [
      /(?:órdenes|ordenes|trabajos)\s+(?:asignadas?\s+)?(?:a|de|del)\s+(?:ejecutor\s+)?([A-Za-zÁ-ú\s]+)/i,
      /(?:trabajos|tareas)\s+(?:del?\s+)?(?:técnico|operador)\s+([A-Za-zÁ-ú\s]+)/i,
    ],
    examples: [
      'Órdenes asignadas a Juan Pérez',
      'Trabajos del técnico María',
      'Tareas de Carlos',
    ],
  },

  // INVENTARIO
  {
    action: 'query_inventory',
    category: 'query',
    keywords: ['inventario', 'productos', 'stock', 'existencias', 'almacén'],
    patterns: [
      /(?:muestra|dame|lista|ver)\s+(?:el\s+)?inventario/i,
      /(?:productos|existencias)\s+(?:disponibles|en stock)/i,
      /stock\s+(?:de\s+)?(?:productos|materiales)/i,
    ],
    examples: [
      'Muestra el inventario',
      'Productos disponibles',
      'Ver stock de productos',
    ],
  },
  {
    action: 'query_low_stock',
    category: 'query',
    keywords: ['stock bajo', 'poco inventario', 'escasos', 'por acabarse', 'mínimo'],
    patterns: [
      /(?:productos|materiales)\s+con\s+(?:stock|inventario)\s+bajo/i,
      /(?:productos|existencias)\s+(?:escasos|escasas|por acabarse)/i,
      /inventario\s+(?:mínimo|crítico|bajo)/i,
    ],
    examples: [
      'Productos con stock bajo',
      'Materiales escasos',
      'Inventario crítico',
    ],
  },
  {
    action: 'query_product_stock',
    category: 'query',
    keywords: ['stock de', 'existencias de', 'cuánto hay de', 'cantidad de'],
    patterns: [
      /(?:stock|existencias|cantidad)\s+(?:de|del)\s+(?:producto\s+)?([A-Za-z0-9\s\-]+)/i,
      /(?:cuánto|cuanto)\s+(?:hay|tenemos|queda)\s+(?:de|del)\s+([A-Za-z0-9\s\-]+)/i,
    ],
    examples: [
      'Stock de tornillos',
      'Cuánto hay de aceite',
      'Existencias del producto ABC',
    ],
  },
  {
    action: 'query_inventory_by_location',
    category: 'query',
    keywords: ['almacén', 'sucursal', 'ubicación', 'bodega'],
    patterns: [
      /(?:inventario|stock|productos)\s+(?:en|de|del)\s+(?:almacén|sucursal|bodega)\s+([A-Za-zÁ-ú\s]+)/i,
      /(?:existencias|productos)\s+(?:en|de)\s+([A-Za-zÁ-ú\s]+)/i,
    ],
    examples: [
      'Inventario en almacén Monterrey',
      'Productos de la sucursal norte',
      'Stock en bodega principal',
    ],
  },

  // BITÁCORAS
  {
    action: 'query_bitacoras',
    category: 'query',
    keywords: ['bitácoras', 'bitacoras', 'registros', 'mediciones'],
    patterns: [
      /(?:muestra|dame|lista|ver)\s+(?:las\s+)?(?:bitácoras|bitacoras)/i,
      /(?:registros|mediciones)\s+(?:recientes|de hoy|del día)/i,
    ],
    examples: [
      'Muestra las bitácoras',
      'Mediciones recientes',
      'Registros del día',
    ],
  },
  {
    action: 'query_recent_measurements',
    category: 'query',
    keywords: ['últimas mediciones', 'mediciones recientes', 'registros nuevos'],
    patterns: [
      /(?:últimas|ultimas|recientes)\s+(?:mediciones|registros)/i,
      /mediciones\s+(?:de\s+)?(?:hoy|esta semana|este mes)/i,
    ],
    examples: [
      'Últimas mediciones',
      'Mediciones de hoy',
      'Registros recientes',
    ],
  },
  {
    action: 'query_concept_history',
    category: 'query',
    keywords: ['historial', 'tendencia', 'evolución', 'histórico'],
    patterns: [
      /(?:historial|histórico|tendencia)\s+(?:de|del)\s+([A-Za-zÁ-ú\s]+)/i,
      /(?:evolución|comportamiento)\s+(?:de|del)\s+(?:concepto\s+)?([A-Za-zÁ-ú\s]+)/i,
    ],
    examples: [
      'Historial de temperatura',
      'Tendencia de presión',
      'Evolución del concepto',
    ],
  },

  // SOLICITUDES/COMPRAS
  {
    action: 'query_purchase_requests',
    category: 'query',
    keywords: ['solicitudes', 'compras', 'pedidos', 'requisiciones'],
    patterns: [
      /(?:muestra|dame|lista|ver)\s+(?:las\s+)?solicitudes/i,
      /(?:solicitudes|pedidos)\s+de\s+compra/i,
      /requisiciones\s+(?:pendientes|aprobadas)/i,
    ],
    examples: [
      'Muestra las solicitudes',
      'Solicitudes de compra',
      'Requisiciones pendientes',
    ],
  },
  {
    action: 'query_pending_approvals',
    category: 'query',
    keywords: ['por aprobar', 'por autorizar', 'pendientes de autorización'],
    patterns: [
      /(?:solicitudes|compras)\s+(?:por aprobar|pendientes de aprobación)/i,
      /(?:requisiciones|pedidos)\s+(?:por autorizar|sin autorizar)/i,
    ],
    examples: [
      'Solicitudes por aprobar',
      'Compras pendientes de aprobación',
      'Requisiciones sin autorizar',
    ],
  },
  {
    action: 'query_my_requests',
    category: 'query',
    keywords: ['mis solicitudes', 'mis compras', 'mis pedidos'],
    patterns: [
      /(?:mis|mi)\s+(?:solicitudes|compras|pedidos)/i,
      /(?:solicitudes|compras)\s+(?:que\s+)?(?:hice|realicé|solicité)/i,
    ],
    examples: [
      'Mis solicitudes',
      'Compras que hice',
      'Mis pedidos',
    ],
  },

  // REPORTES
  {
    action: 'report_sales',
    category: 'report',
    keywords: ['ventas', 'facturación', 'ingresos'],
    patterns: [
      /(?:reporte|informe)\s+de\s+ventas/i,
      /ventas\s+(?:de|del|en)\s+([A-Za-zÁ-ú\s]+)/i,
      /(?:facturación|ingresos)\s+(?:de|del)\s+([A-Za-zÁ-ú\s]+)/i,
    ],
    examples: [
      'Reporte de ventas',
      'Ventas de octubre',
      'Facturación del mes',
    ],
  },
  {
    action: 'report_maintenance_summary',
    category: 'report',
    keywords: ['resumen de mantenimiento', 'informe de órdenes'],
    patterns: [
      /(?:reporte|resumen|informe)\s+de\s+mantenimiento/i,
      /(?:reporte|resumen)\s+de\s+(?:órdenes|ordenes)/i,
    ],
    examples: [
      'Resumen de mantenimiento',
      'Informe de órdenes',
      'Reporte de mantenimiento del mes',
    ],
  },
  {
    action: 'report_inventory_status',
    category: 'report',
    keywords: ['estado del inventario', 'reporte de stock'],
    patterns: [
      /(?:reporte|estado|informe)\s+(?:de|del)\s+inventario/i,
      /(?:reporte|estado)\s+de\s+stock/i,
    ],
    examples: [
      'Estado del inventario',
      'Reporte de stock',
      'Informe del inventario',
    ],
  },
  {
    action: 'report_financial_summary',
    category: 'report',
    keywords: ['resumen financiero', 'estado financiero', 'finanzas'],
    patterns: [
      /(?:reporte|resumen|informe)\s+financiero/i,
      /(?:estado|situación)\s+financier[oa]/i,
      /finanzas\s+(?:de|del)\s+([A-Za-zÁ-ú\s]+)/i,
    ],
    examples: [
      'Resumen financiero',
      'Estado financiero',
      'Finanzas del mes pasado',
    ],
  },
  {
    action: 'report_top_clients',
    category: 'report',
    keywords: ['mejores clientes', 'top clientes', 'principales clientes'],
    patterns: [
      /(?:mejores|principales|top)\s+clientes/i,
      /clientes\s+(?:más|mas)\s+(?:importantes|frecuentes)/i,
    ],
    examples: [
      'Mejores clientes',
      'Top clientes del trimestre',
      'Principales clientes',
    ],
  },
  {
    action: 'report_monthly_summary',
    category: 'report',
    keywords: ['resumen mensual', 'resumen del mes'],
    patterns: [
      /resumen\s+(?:mensual|del mes)/i,
      /(?:reporte|informe)\s+(?:mensual|del mes)/i,
    ],
    examples: [
      'Resumen mensual',
      'Resumen del mes',
      'Informe mensual',
    ],
  },

  // ANÁLISIS
  {
    action: 'analyze_maintenance_performance',
    category: 'analysis',
    keywords: ['desempeño de mantenimiento', 'rendimiento', 'eficiencia'],
    patterns: [
      /(?:analiza|análisis|evalua)\s+(?:el\s+)?(?:desempeño|rendimiento)\s+(?:de|del)\s+mantenimiento/i,
      /eficiencia\s+(?:de|del)\s+mantenimiento/i,
    ],
    examples: [
      'Analiza el desempeño de mantenimiento',
      'Rendimiento del mantenimiento',
      'Eficiencia de mantenimiento',
    ],
  },
  {
    action: 'analyze_executor_efficiency',
    category: 'analysis',
    keywords: ['eficiencia del ejecutor', 'desempeño del técnico'],
    patterns: [
      /(?:eficiencia|desempeño)\s+(?:de|del)\s+(?:ejecutor|técnico|operador)/i,
      /(?:cómo|como)\s+(?:está|esta)\s+trabajando\s+([A-Za-zÁ-ú\s]+)/i,
    ],
    examples: [
      'Eficiencia del ejecutor',
      'Desempeño del técnico Juan',
      'Cómo está trabajando María',
    ],
  },
  {
    action: 'analyze_inventory_turnover',
    category: 'analysis',
    keywords: ['rotación de inventario', 'movimiento de productos'],
    patterns: [
      /(?:rotación|movimiento)\s+(?:de|del)\s+inventario/i,
      /(?:análisis|evalúa)\s+(?:de\s+)?(?:productos|inventario)/i,
    ],
    examples: [
      'Rotación de inventario',
      'Movimiento de productos',
      'Análisis de inventario',
    ],
  },
  {
    action: 'analyze_cost_trends',
    category: 'analysis',
    keywords: ['tendencia de costos', 'evolución de gastos'],
    patterns: [
      /tendencia\s+de\s+(?:costos|gastos)/i,
      /(?:evolución|comportamiento)\s+de\s+(?:costos|gastos)/i,
    ],
    examples: [
      'Tendencia de costos',
      'Evolución de gastos',
      'Comportamiento de costos',
    ],
  },

  // BÚSQUEDAS
  {
    action: 'search_product',
    category: 'search',
    keywords: ['buscar producto', 'encontrar producto', 'busca'],
    patterns: [
      /(?:busca|buscar|encontrar)\s+(?:el\s+)?producto\s+([A-Za-z0-9\s\-]+)/i,
      /(?:busca|buscar)\s+([A-Za-z0-9\s\-]+)/i,
    ],
    examples: [
      'Buscar producto tornillo',
      'Encontrar aceite lubricante',
      'Busca ABC-123',
    ],
  },
  {
    action: 'search_order',
    category: 'search',
    keywords: ['buscar orden', 'encontrar orden', 'orden número'],
    patterns: [
      /(?:busca|buscar|encontrar)\s+(?:la\s+)?orden\s+(?:número\s+)?(\d+)/i,
      /orden\s+(\d+)/i,
    ],
    examples: [
      'Buscar orden 1234',
      'Encontrar la orden número 5678',
      'Orden 999',
    ],
  },
  {
    action: 'search_user',
    category: 'search',
    keywords: ['buscar usuario', 'encontrar persona', 'buscar empleado'],
    patterns: [
      /(?:busca|buscar|encontrar)\s+(?:al\s+)?(?:usuario|empleado|técnico)\s+([A-Za-zÁ-ú\s]+)/i,
      /(?:quién es|quien es)\s+([A-Za-zÁ-ú\s]+)/i,
    ],
    examples: [
      'Buscar usuario Juan',
      'Encontrar empleado María',
      'Quién es Carlos Pérez',
    ],
  },
];

// ============================================================================
// EXTRACCIÓN DE ENTIDADES
// ============================================================================

/**
 * Extrae fechas del texto
 */
function extractDateEntities(text: string): DetectedEntity[] {
  const entities: DetectedEntity[] = [];

  // Fechas específicas (DD/MM/YYYY, YYYY-MM-DD)
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,
    /(\d{4}-\d{2}-\d{2})/g,
  ];

  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'date',
        value: match[1],
        confidence: 1.0,
        position: { start: match.index, end: match.index + match[1].length },
      });
    }
  }

  // Fechas relativas
  const relativeDates: Array<{ pattern: RegExp; value: string }> = [
    { pattern: /\bhoy\b/i, value: 'today' },
    { pattern: /\bayer\b/i, value: 'yesterday' },
    { pattern: /esta semana/i, value: 'this_week' },
    { pattern: /la semana pasada/i, value: 'last_week' },
    { pattern: /este mes/i, value: 'this_month' },
    { pattern: /el mes pasado/i, value: 'last_month' },
    { pattern: /este trimestre/i, value: 'this_quarter' },
    { pattern: /el trimestre pasado/i, value: 'last_quarter' },
    { pattern: /este año/i, value: 'this_year' },
    { pattern: /el año pasado/i, value: 'last_year' },
  ];

  for (const relDate of relativeDates) {
    const match = text.match(relDate.pattern);
    if (match) {
      entities.push({
        type: 'date',
        value: relDate.value,
        confidence: 0.95,
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }
  }

  return entities;
}

/**
 * Extrae números del texto
 */
function extractNumberEntities(text: string): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  const numberPattern = /\b(\d+(?:\.\d+)?)\b/g;

  let match;
  while ((match = numberPattern.exec(text)) !== null) {
    entities.push({
      type: 'number',
      value: match[1],
      confidence: 1.0,
      position: { start: match.index, end: match.index + match[1].length },
    });
  }

  return entities;
}

/**
 * Extrae ubicaciones del texto
 */
function extractLocationEntities(text: string): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  const locationKeywords = [
    'almacén',
    'almacen',
    'sucursal',
    'bodega',
    'ubicación',
    'ubicacion',
  ];

  for (const keyword of locationKeywords) {
    const pattern = new RegExp(`${keyword}\\s+([A-Za-zÁ-ú\\s]+?)(?:\\s|$|,|\\.)`, 'i');
    const match = text.match(pattern);
    if (match) {
      entities.push({
        type: 'location',
        value: match[1].trim(),
        confidence: 0.9,
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }
  }

  return entities;
}

/**
 * Extrae personas del texto
 */
function extractPersonEntities(text: string): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  const personKeywords = [
    'ejecutor',
    'técnico',
    'tecnico',
    'operador',
    'usuario',
    'empleado',
  ];

  for (const keyword of personKeywords) {
    const pattern = new RegExp(`${keyword}\\s+([A-Za-zÁ-ú\\s]{3,30})(?:\\s|$|,|\\.)`, 'i');
    const match = text.match(pattern);
    if (match) {
      entities.push({
        type: 'person',
        value: match[1].trim(),
        confidence: 0.85,
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }
  }

  return entities;
}

/**
 * Extrae estados del texto
 */
function extractStatusEntities(text: string): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  const statusKeywords = [
    { pattern: /\bpendiente[s]?\b/i, value: 'pendiente' },
    { pattern: /\ben\s+proceso\b/i, value: 'en_proceso' },
    { pattern: /\bcompletad[oa][s]?\b/i, value: 'completado' },
    { pattern: /\baprobad[oa][s]?\b/i, value: 'aprobada' },
    { pattern: /\brechazad[oa][s]?\b/i, value: 'rechazada' },
    { pattern: /\bcancelad[oa][s]?\b/i, value: 'cancelada' },
  ];

  for (const status of statusKeywords) {
    const match = text.match(status.pattern);
    if (match) {
      entities.push({
        type: 'status',
        value: status.value,
        confidence: 0.95,
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }
  }

  return entities;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class NLPService {
  /**
   * Procesa un texto y detecta la intención del usuario
   */
  public async processInput(text: string): Promise<DetectedIntent | null> {
    const normalizedText = this.normalizeText(text);

    // Detectar intención
    const intent = this.detectIntent(normalizedText);
    if (!intent) {
      return null;
    }

    // Extraer entidades
    const entities = this.extractEntities(normalizedText);

    // Construir parámetros basados en entidades
    const parameters = this.buildParameters(intent.action, entities);

    return {
      action: intent.action,
      category: intent.category,
      confidence: intent.confidence,
      entities,
      parameters,
    };
  }

  /**
   * Normaliza el texto para procesamiento
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Detecta la intención principal del texto
   */
  private detectIntent(text: string): { action: AssistantAction; category: AssistantActionCategory; confidence: number } | null {
    let bestMatch: { action: AssistantAction; category: AssistantActionCategory; confidence: number } | null = null;
    let highestScore = 0;

    for (const intentPattern of INTENT_PATTERNS) {
      let score = 0;

      // Verificar keywords
      const keywordMatches = intentPattern.keywords.filter(keyword =>
        text.includes(keyword.toLowerCase())
      );
      score += keywordMatches.length * 0.3;

      // Verificar patrones regex
      for (const pattern of intentPattern.patterns) {
        if (pattern.test(text)) {
          score += 0.7;
          break;
        }
      }

      // Actualizar mejor coincidencia
      if (score > highestScore && score > 0.3) {
        highestScore = score;
        bestMatch = {
          action: intentPattern.action,
          category: intentPattern.category,
          confidence: Math.min(score, 1.0),
        };
      }
    }

    return bestMatch;
  }

  /**
   * Extrae todas las entidades del texto
   */
  private extractEntities(text: string): DetectedEntity[] {
    const entities: DetectedEntity[] = [];

    entities.push(...extractDateEntities(text));
    entities.push(...extractNumberEntities(text));
    entities.push(...extractLocationEntities(text));
    entities.push(...extractPersonEntities(text));
    entities.push(...extractStatusEntities(text));

    return entities;
  }

  /**
   * Construye parámetros estructurados basados en entidades detectadas
   */
  private buildParameters(
    action: AssistantAction,
    entities: DetectedEntity[]
  ): Partial<AssistantQueryParameters> {
    const parameters: Partial<AssistantQueryParameters> = {};

    // Procesar fechas
    const dateEntities = entities.filter(e => e.type === 'date');
    if (dateEntities.length > 0) {
      const timeParams: TimeParameters = {};
      const dateValue = dateEntities[0].value;

      // Si es una fecha relativa (today, this_month, etc.)
      if (dateValue.includes('_')) {
        timeParams.range = dateValue as TimeRange;
      } else {
        // Si es una fecha específica
        timeParams.range = 'custom';
        timeParams.startDate = this.parseDate(dateValue);
      }

      parameters.time = timeParams;
    }

    // Procesar ubicaciones
    const locationEntities = entities.filter(e => e.type === 'location');
    if (locationEntities.length > 0) {
      if (action.includes('inventory') || action.includes('product')) {
        parameters.inventory = { ...parameters.inventory };
        // Se necesitaría buscar el ID de la ubicación por nombre
      }
    }

    // Procesar estados
    const statusEntities = entities.filter(e => e.type === 'status');
    if (statusEntities.length > 0) {
      const status = statusEntities[0].value;
      if (action.includes('order')) {
        parameters.orders = { ...parameters.orders, status: status as any };
      } else if (action.includes('purchase')) {
        parameters.purchases = { ...parameters.purchases, status };
      }
    }

    // Procesar números (para límites, thresholds, etc.)
    const numberEntities = entities.filter(e => e.type === 'number');
    if (numberEntities.length > 0 && action.includes('low_stock')) {
      parameters.inventory = {
        ...parameters.inventory,
        stockThreshold: parseFloat(numberEntities[0].value),
      };
    }

    return parameters;
  }

  /**
   * Convierte una fecha en texto a formato ISO
   */
  private parseDate(dateString: string): string {
    // Formato DD/MM/YYYY
    const ddmmyyyyMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Formato YYYY-MM-DD (ya está en ISO)
    const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return dateString;
    }

    // Si no se puede parsear, retornar fecha actual
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Obtiene sugerencias basadas en el contexto
   */
  public getSuggestions(partialText: string): string[] {
    const suggestions: string[] = [];
    const normalizedText = this.normalizeText(partialText);

    // Buscar patrones que coincidan parcialmente
    for (const intentPattern of INTENT_PATTERNS) {
      const keywordMatch = intentPattern.keywords.some(keyword =>
        keyword.includes(normalizedText) || normalizedText.includes(keyword)
      );

      if (keywordMatch && suggestions.length < 5) {
        suggestions.push(...intentPattern.examples.slice(0, 1));
      }
    }

    return suggestions;
  }
}

export const nlpService = new NLPService();
