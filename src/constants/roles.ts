export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMINISTRADOR: 'administrador',
  SUPERVISOR: 'supervisor',
  EMPLEADO: 'empleado',
  PROVEEDOR: 'proveedor',
  OWN: 'own',
  EJECUTOR: 'ejecutor',
} as const;

export const PERMISSIONS = {
  // Dashboards
  VIEW_DASHBOARD: ['superadmin', 'administrador', 'supervisor', 'empleado', 'own'],
  VIEW_ADVANCED_ANALYTICS: ['superadmin', 'administrador', 'supervisor'],

  // Inventarios
  VIEW_INVENTORY: ['superadmin', 'administrador', 'supervisor', 'empleado', 'own'],
  EDIT_INVENTORY: ['superadmin', 'administrador', 'supervisor'],

  // Órdenes de Mantenimiento
  CREATE_ORDER: ['empleado', 'supervisor', 'administrador', 'superadmin', 'ejecutor'],
  VIEW_ALL_ORDERS: ['superadmin', 'administrador', 'supervisor'],
  ASSIGN_SELF: ['empleado', 'ejecutor'],
  APPROVE_ORDER: ['supervisor', 'administrador', 'superadmin'],
  UPLOAD_EVIDENCE: ['empleado', 'ejecutor'],
  SIGN_COMPLETION: ['empleado', 'supervisor', 'ejecutor'],
  RATE_EXECUTOR: ['supervisor', 'administrador', 'superadmin'],
  RATE_OPERATION: ['empleado'],

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
  return PERMISSIONS[permission].includes(userRole);
};
