import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: () => void;  // NUEVO: Acción ejecutada al hacer clic en el toast
}

/**
 * Servicio para mostrar toasts de notificación.
 * Mantiene una lista reactiva de toasts que se auto-dimite después de N segundos.
 *
 * Soporta:
 * - show(): Toast individual inmediato
 * - showBatched(): Agrupa múltiples notificaciones en un período corto (batching)
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private _toastIdCounter = 0;

  // ── Batching de notificaciones ────────────────────────────────
  private _batchBuffer: number = 0;  // Contador para mostrar "N nuevas notificaciones"
  private _batchTimer: ReturnType<typeof setTimeout> | null = null;
  private _batchAction: (() => void) | undefined = undefined;  // NUEVO: Acción a ejecutar en el toast agrupado
  private readonly BATCH_DELAY = 1500;  // 1.5 segundos para agrupar (evita 2 batches si llegan en 0ms, 300ms, 700ms, 1200ms)

  readonly toasts = this._toasts.asReadonly();

  /**
   * Mostrar un toast de notificación.
   * Se auto-dimite después del duration especificado (por defecto 5000ms).
   *
   * @param action - Función opcional a ejecutar cuando se hace clic en el toast
   */
  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000, action?: () => void): string {
    const id = `toast-${++this._toastIdCounter}`;
    const toast: Toast = { id, message, type, duration, action };

    // Agregar toast
    this._toasts.update(prev => [...prev, toast]);

    // Auto-dimite después del duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * NUEVO: Mostrar toasts agrupados.
   * Si llegan múltiples notificaciones en un período corto (BATCH_DELAY ms),
   * se muestran como un solo toast: "N nuevas notificaciones"
   *
   * Esto evita spam visual cuando llegan múltiples notificaciones seguidas.
   *
   * @param action - Función opcional a ejecutar cuando se hace clic en el toast agrupado
   */
  showBatched(action?: () => void): void {
    // Incrementar contador del batch
    this._batchBuffer++;

    // Guardar la acción (la primera que llega)
    if (!this._batchAction && action) {
      this._batchAction = action;
    }

    // Si ya hay un timer activo, solo incrementamos y esperamos
    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
    }

    // Crear nuevo timer que mostrará el toast agrupado
    this._batchTimer = setTimeout(() => {
      const count = this._batchBuffer;

      if (count === 1) {
        // Si solo llegó 1, mostrar mensaje individual
        this.show('Nueva notificación', 'info', 5000, this._batchAction);
      } else {
        // Si llegaron múltiples, mostrar resumen
        this.show(`${count} nuevas notificaciones`, 'info', 5000, this._batchAction);
      }

      // Reset del buffer
      this._batchBuffer = 0;
      this._batchAction = undefined;
      this._batchTimer = null;
    }, this.BATCH_DELAY);
  }

  /**
   * Remover un toast específico por ID.
   */
  dismiss(id: string): void {
    this._toasts.update(prev => prev.filter(t => t.id !== id));
  }

  /**
   * Remover todos los toasts.
   */
  dismissAll(): void {
    this._toasts.set([]);
  }
}
