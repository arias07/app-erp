export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMINISTRADOR: 'administrador',
  SUPERVISOR: 'supervisor',
  EMPLEADO: 'empleado',
  PROVEEDOR: 'proveedor',
  OWN: 'own',
  EJECUTOR: 'ejecutor',
  OPERACION: 'operacion',
} as const;

export const PERMISSIONS = {
  // Dashboards
  VIEW_DASHBOARD: ['superadmin', 'administrador', 'supervisor', 'empleado', 'own'],
  VIEW_ADVANCED_ANALYTICS: ['superadmin', 'administrador', 'supervisor'],

  // Inventarios
  VIEW_INVENTORY: ['superadmin', 'administrador', 'supervisor', 'empleado', 'own'],
  EDIT_INVENTORY: ['superadmin', 'administrador', 'supervisor'],

  // Órdenes de Mantenimiento
  CREATE_ORDER: ['empleado', 'supervisor', 'administrador', 'superadmin', 'ejecutor', 'operacion'],
  VIEW_ALL_ORDERS: ['superadmin', 'administrador', 'supervisor'],
  ASSIGN_SELF: ['empleado', 'ejecutor'],
  APPROVE_ORDER: ['supervisor', 'administrador', 'superadmin', 'operacion'],
  UPLOAD_EVIDENCE: ['empleado', 'ejecutor'],
  SIGN_COMPLETION: ['empleado', 'supervisor', 'ejecutor'],
  RATE_EXECUTOR: ['supervisor', 'administrador', 'superadmin', 'operacion'],
  RATE_OPERATION: ['empleado', 'ejecutor'],

  // Bitacoras
  CREATE_BITACORA: ['superadmin', 'administrador', 'supervisor', 'empleado', 'operacion', 'ejecutor'],
  VIEW_BITACORA: ['superadmin', 'administrador', 'supervisor', 'empleado', 'operacion', 'ejecutor', 'own'],
  VIEW_MANUALES: ['superadmin', 'administrador', 'supervisor', 'empleado', 'operacion', 'ejecutor', 'own'],

  // Órdenes de Compra
  VIEW_PURCHASE_ORDERS: ['superadmin', 'administrador', 'supervisor', 'own'],
  AUTHORIZE_PURCHASE: ['superadmin', 'administrador'],

  // Refacciones
  REQUEST_PARTS: ['empleado'],
  APPROVE_PARTS: ['supervisor', 'administrador', 'superadmin'],
};

export const hasPermission = (userRole: string, permission: keyof typeof PERMISSIONS): boolean => {
  const result = PERMISSIONS[permission].includes(userRole);
  console.log(`[hasPermission] role: "${userRole}", permission: "${permission}", result: ${result}`);
  return result;
};
