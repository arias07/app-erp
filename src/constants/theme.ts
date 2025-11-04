/**
 * ERPHYX Brand Identity
 * Colores corporativos y configuración de tema
 */

export const BRAND_COLORS = {
  // Colores primarios de la marca
  primary: '#A3C400', // Verde lima ERPHYX
  primaryDark: '#8BA800', // Verde lima oscuro
  secondary: '#1E3B33', // Verde oscuro ERPHYX
  secondaryLight: '#2A5247',

  // Colores de estado (mantener los definidos)
  success: '#388e3c',
  warning: '#ef6c00',
  error: '#d32f2f',
  info: '#1976d2',

  // Colores de UI
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#1E3B33',
  textSecondary: '#666666',
  border: '#e0e0e0',

  // Colores de estado de órdenes (ya definidos)
  orderStatus: {
    pendiente: '#ef6c00',
    en_proceso: '#1976d2',
    completado: '#388e3c',
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'Satoshi',
  fontWeights: {
    regular: '400',
    medium: '500',
    bold: '700',
    black: '900',
  },
} as const;

export const THEME = {
  colors: BRAND_COLORS,
  typography: TYPOGRAPHY,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
} as const;
