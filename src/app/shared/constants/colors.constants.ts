/**
 * Constantes de colores del proyecto.
 * Sincronizadas con las variables CSS en src/styles.css
 *
 * Usar estas constantes en lugar de valores hardcodeados para garantizar
 * consistencia visual en toda la aplicación.
 */
export const APP_COLORS = {
  PRIMARY: '#135BEC',        // --primary: Azul predeterminado del proyecto
  PRIMARY_HOVER: '#0D4FD8',  // --primary-hover
  SECONDARY_PURPLE: '#8B5CF6',

  // Colores semánticos para notificaciones
  SUCCESS_BLUE: '#135BEC',   // Para aprobaciones
  SUCCESS_GREEN: '#10b981',  // Para reportes resueltos
  ERROR_RED: '#ef4444',      // Para rechazos y eliminaciones
  WARNING_ORANGE: '#f97316', // Para eliminaciones de comentarios
  ALERT_AMBER: '#f59e0b',    // Para suspensiones
} as const;
