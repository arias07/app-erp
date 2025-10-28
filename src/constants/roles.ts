export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMINISTRADOR: 'administrador',
  SUPERVISOR: 'supervisor',
  EMPLEADO: 'empleado',
  PROVEEDOR: 'proveedor',
  OWN: 'own',
} as const;

export const PERMISSIONS = {
  // Dashboards
  VIEW_DASHBOARD: ['superadmin', 'administrador', 'supervisor', 'empleado', 'own'],
  VIEW_ADVANCED_ANALYTICS: ['superadmin', 'administrador', 'supervisor'],

  // Inventarios
  VIEW_INVENTORY: ['superadmin', 'administrador', 'supervisor', 'empleado', 'own'],
  EDIT_INVENTORY: ['superadmin', 'administrador', 'supervisor'],

  // Órdenes de Mantenimiento
  CREATE_ORDER: ['empleado', 'supervisor', 'administrador', 'superadmin'],
  VIEW_ALL_ORDERS: ['superadmin', 'administrador', 'supervisor'],
  ASSIGN_SELF: ['empleado'],
  APPROVE_ORDER: ['supervisor', 'administrador', 'superadmin'],
  UPLOAD_EVIDENCE: ['empleado'],
  SIGN_COMPLETION: ['empleado', 'supervisor'],
  RATE_EXECUTOR: ['supervisor', 'administrador', 'superadmin'],
  RATE_OPERATION: ['empleado'],

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
