/**
 * FUNCIÓN HELPER CRÍTICA: Normalizar timestamp de Supabase antes de parsear
 *
 * PROBLEMA REAL IDENTIFICADO:
 * - Supabase devuelve timestamps EN UTC
 * - El formato puede ser: "2026-03-19T20:01:00" o "2026-03-19T20:01:00Z"
 * - Si viene sin "Z", JavaScript lo parsea como LOCAL (ERROR)
 * - Si viene con "Z", JavaScript lo parsea como UTC (CORRECTO)
 * - toLocaleString() debe convertir UTC→Local
 */
function ensureUtcTimestamp(dateStr: string): string {
  if (typeof dateStr !== 'string') return dateStr as any;

  const trimmed = dateStr.trim();

  // Si ya termina en "Z" (UTC explícito), perfecto
  if (trimmed.endsWith('Z')) {
    return trimmed;
  }

  // Si termina en +00:00, también UTC explícito
  if (trimmed.endsWith('+00:00')) {
    return trimmed;
  }

  // Si es formato ISO sin Z (YYYY-MM-DDTHH:MM:SS), debe ser UTC
  // Agregamos Z para garantizar parsing correcto como UTC
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$/)) {
    const normalized = trimmed + 'Z';
    console.warn(
      '[DateUtil] TIMESTAMP SIN UTC DETECTADO - Normalizando:',
      trimmed,
      '→',
      normalized
    );
    return normalized;
  }

  return trimmed;
}

/**
 * Formatea una fecha como tiempo relativo.
 * Ejemplos: "Ahora", "4 min", "5 h", "3 Mar", "3 Mar 2025"
 *
 * @param dateStr ISO string UTC o Date (puede no tener "Z")
 * @returns Tiempo relativo formateado
 */
export function formatTimeAgo(dateStr: string | Date): string {
  try {
    // Garantizar que el timestamp está en UTC correcto
    const normalizedStr = typeof dateStr === 'string' ? ensureUtcTimestamp(dateStr) : dateStr;
    const date = normalizedStr instanceof Date ? normalizedStr : new Date(normalizedStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;

    // Para fechas más antiguas, mostrar fecha legible
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
    });
  } catch (error) {
    console.error('[DateUtil.formatTimeAgo] Error:', dateStr, error);
    return 'Fecha inválida';
  }
}

/**
 * Formatea una fecha en formato completo legible CON HORA.
 * Ejemplo: "19 mar 14:01"
 *
 * CRÍTICO: Convierte correctamente de UTC a hora local del navegador.
 * DEBUG AGRESIVO para identificar por qué está mostrando hora UTC en lugar de local.
 *
 * @param dateStr ISO string UTC o Date (puede no tener "Z")
 * @returns Fecha formateada completa con hora en hora local
 */
export function formatFullDate(dateStr: string | Date): string {
  try {
    // Garantizar que el timestamp está en UTC correcto
    const normalizedStr = typeof dateStr === 'string' ? ensureUtcTimestamp(dateStr) : dateStr;
    const date = normalizedStr instanceof Date ? normalizedStr : new Date(normalizedStr);

    // DEBUG AGRESIVO: Verificar exactamente qué está pasando
    console.log('═══════════════════════════════════════════════');
    console.log('[DateUtil.formatFullDate] DEBUG TIMESTAMP');
    console.log('Input:', dateStr);
    console.log('Normalized:', normalizedStr);
    console.log('Parsed. toISOString():', date.toISOString());
    console.log('Local toString():', date.toString());

    // Información de zona horaria
    const tzOffset = new Date().getTimezoneOffset();
    const tzHours = Math.floor(Math.abs(tzOffset) / 60);
    const tzMins = Math.abs(tzOffset) % 60;
    const tzSign = tzOffset <= 0 ? '+' : '-';
    const tzStr = `UTC${tzSign}${tzHours}:${String(tzMins).padStart(2, '0')}`;

    console.log('Timezone del navegador:', tzStr);
    console.log('TZ Offset (minutes):', tzOffset);

    // Método: toLocaleString() - USA LA ZONA HORARIA DEL NAVEGADOR AUTOMÁTICAMENTE
    // NO especificar timeZone para que use la zona local del usuario
    const localeStr = date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
      // NO AGREGAR timeZone aquí - usa la zona del navegador
    });
    console.log('toLocaleString() result:', localeStr);

    console.log('═══════════════════════════════════════════════');

    return localeStr;
  } catch (error) {
    console.error('[DateUtil.formatFullDate] ERROR CRÍTICO:', dateStr, error);
    return 'Fecha inválida';
  }
}

/**
 * Formatea solo la fecha (sin hora).
 * Ejemplo: "3 Mar 2026"
 *
 * @param dateStr ISO string UTC o Date (puede no tener "Z")
 * @returns Fecha formateada
 */
export function formatDateOnly(dateStr: string | Date): string {
  try {
    // Garantizar que el timestamp está en UTC correcto
    const normalizedStr = typeof dateStr === 'string' ? ensureUtcTimestamp(dateStr) : dateStr;
    const date = normalizedStr instanceof Date ? normalizedStr : new Date(normalizedStr);
    const now = new Date();

    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
    });
  } catch (error) {
    console.error('[DateUtil.formatDateOnly] Error:', dateStr, error);
    return 'Fecha inválida';
  }
}
