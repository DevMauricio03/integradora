# Guía de Integración - Sistema de Notificaciones

## Arquitectura de 4 Capas

### Layer 1: NotificationService
- **Archivo**: `core/services/notification.service.ts`
- **Responsabilidad**: CRUD directo en Supabase
- **Métodos**:
  - `getNotificaciones(userId)` - Obtener lista
  - `getUnreadCount(userId)` - Contar no leídas
  - `markAsRead(notificationId)` - Marcar como leída
  - `createNotificacion(data)` - Crear nueva
- **Características**:
  - ✅ SELECT explícito (no *)
  - ✅ Retorna `{ data, error }` pattern

### Layer 2: NotificationStoreService
- **Archivo**: `core/services/notification-store.service.ts`
- **Responsabilidad**: Estado global con Signals
- **Features**:
  - Caché automático
  - Promise Guards (deduplicación)
  - Optimistic updates (`markAsRead`)
  - Solicita permisos navegador
  - Detecta notificaciones nuevas
  - Muestra push automáticas

### Layer 3: BrowserNotificationService
- **Archivo**: `core/services/browser-notification.service.ts`
- **Responsabilidad**: Notification API del navegador
- **Métodos**:
  - `requestPermission()` - Una sola vez
  - `show(options)` - Mostrar notificación
  - `getPermission()` - Verificar estado
  - `isSupported()` - Detectar soporte

### Layer 4: Componentes
- **userLayout**: Badge en navbar (reactivo)
- **notificaciones page**: Lista completa

---

## Cómo Crear Notificaciones desde Admin Services

### Ejemplo 1: Rechazar Publicación

```typescript
// Ubicación: admin@publications-store.service.ts

import { Injectable, inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { BrowserNotificationService } from '../services/browser-notification.service';

@Injectable({ providedIn: 'root' })
export class AdminPublicationsService {
  private readonly notifService = inject(NotificationService);
  private readonly browserNotifService = inject(BrowserNotificationService);

  async rejectPublication(postId: string, authorId: string, reason: string) {
    // 1. Actualizar estado de la publicación
    // await this.db.from('publicaciones').update({ estado: 'rechazado' }).eq('id', postId);

    // 2. CREAR NOTIFICACIÓN EN BASE DE DATOS
    const { error } = await this.notifService.createNotificacion({
      user_id: authorId,
      tipo: 'post_rechazado',
      mensaje: `Tu publicación fue rechazada. Motivo: ${reason}`,
      leido: false,
    });

    if (!error) {
      // 3. MOSTRAR NOTIFICACIÓN PUSH DEL NAVEGADOR (opcional)
      this.browserNotifService.show({
        title: '❌ Tu publicación fue rechazada',
        body: `Motivo: ${reason}`,
        tag: 'post_rejected',
      });
    }
  }
}
```

### Ejemplo 2: Aprobar Publicación

```typescript
async approvePublication(postId: string, authorId: string) {
  // 1. Actualizar estado
  // ...

  // 2. CREAR NOTIFICACIÓN
  await this.notifService.createNotificacion({
    user_id: authorId,
    tipo: 'post_aceptado',
    mensaje: 'Tu publicación fue aprobada y es ahora visible para todos.',
    leido: false,
  });

  // 3. NOTIFICACIÓN PUSH
  this.browserNotifService.show({
    title: '✅ Tu publicación fue aprobada',
    body: 'Ahora es visible para todos los usuarios',
    tag: 'post_approved',
  });
}
```

### Ejemplo 3: Suspender Usuario

```typescript
async suspendUser(userId: string, duration: string) {
  // 1. Actualizar perfil (suspensión)
  // ...

  // 2. CREAR NOTIFICACIÓN
  await this.notifService.createNotificacion({
    user_id: userId,
    tipo: 'usuario_suspendido',
    mensaje: `Tu cuenta ha sido suspendida por ${duration}. Contacta con soporte para más información.`,
    leido: false,
  });

  // 3. NOTIFICACIÓN PUSH CON requireInteraction
  this.browserNotifService.show({
    title: '🔒 Tu cuenta ha sido suspendida',
    body: `Duración: ${duration}`,
    tag: 'user_suspended',
    requireInteraction: true, // El usuario debe interactuar
  });
}
```

### Ejemplo 4: Eliminar Comentario

```typescript
async deleteCommentByModerator(commentId: string, authorId: string) {
  // 1. Eliminar comentario
  // await this.db.from('comentarios').delete().eq('id', commentId);

  // 2. CREAR NOTIFICACIÓN
  await this.notifService.createNotificacion({
    user_id: authorId,
    tipo: 'comentario_eliminado',
    mensaje: 'Uno de tus comentarios fue removido por violar nuestras políticas.',
    leido: false,
  });

  // 3. NOTIFICACIÓN PUSH
  this.browserNotifService.show({
    title: '🗑️ Tu comentario fue eliminado',
    body: 'Violo nuestras políticas de comunidad',
    tag: 'comment_deleted',
  });
}
```

---

## Checklist de Implementación

### En tu servicio admin/moderador:

- [ ] **1. Importar servicios**
  ```typescript
  import { NotificationService } from '../services/notification.service';
  import { BrowserNotificationService } from '../services/browser-notification.service';
  ```

- [ ] **2. Inyectar en constructor**
  ```typescript
  private readonly notifService = inject(NotificationService);
  private readonly browserNotifService = inject(BrowserNotificationService);
  ```

- [ ] **3. Crear notificación en BD**
  ```typescript
  await this.notifService.createNotificacion({
    user_id: /* uuid del usuario */,
    tipo: /* string: post_aceptado, post_rechazado, etc */,
    mensaje: /* string: mensaje para mostrar */,
    leido: false
  });
  ```

- [ ] **4. Mostrar notificación push (opcional pero recomendado)**
  ```typescript
  this.browserNotifService.show({
    title: '✅ Acción completada',
    body: 'Detalles del evento',
    tag: 'unique-tag', // Evita duplicados
  });
  ```

- [ ] **5. Manejar errores**
  ```typescript
  try {
    await this.notifService.createNotificacion(...);
  } catch (err) {
    console.error('Error creando notificación:', err);
  }
  ```

---

## Tipos de Notificaciones Disponibles

| Tipo | Emoji | Uso |
|------|-------|-----|
| `post_aceptado` | ✅ | Publicación fue aprobada |
| `post_rechazado` | ❌ | Publicación fue rechazada |
| `comentario_eliminado` | 🗑️ | Comentario removido por moderación |
| `post_eliminado` | 🗑️ | Publicación eliminada por reporte |
| `usuario_suspendido` | 🔒 | Cuenta suspendida |
| `admin_action` | ⚙️ | Otra acción administrativa |

---

## Notas Importantes

### Notificaciones en BD
- Se crean inmediatamente en Supabase
- El usuario verá actualización en navbar cuando:
  - Recargue la página
  - Navegue a `/user/notificaciones`
  - El Store detecte cambios

### Notificaciones Push del Navegador
- Se solicita permiso **UNA SOLA VEZ** al cargar userLayout
- Solo funcionan en **HTTPS** (o localhost)
- Se muestran cuando la página está en **segundo plano**
- El navegador maneja la visualización (no Angular)

### Permiso Notification API
- Solicitado automáticamente en `BrowserNotificationService.requestPermission()`
- No se pide múltiples veces (gestión automática)
- Estados: `'default'` | `'granted'` | `'denied'`

---

## Futuro: Supabase Realtime

Para actualizaciones en **tiempo real** (sin recargar):

```typescript
supabase
  .channel('notifications')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notificaciones' },
    (payload) => {
      // Nueva notificación llegó en tiempo real
      this.notificationStore.addNewNotification(payload.new);
      this.browserNotifService.show({
        title: 'Nueva notificación',
        body: payload.new.mensaje,
        tag: `notif-${payload.new.id}`
      });
    }
  )
  .subscribe();
```

---

## Preguntas Frecuentes

### ¿Qué sucede si el usuario deniega permisos de notificaciones?
Las notificaciones en BD se crean de todas formas. Solo las push del navegador no se mostrarán.

### ¿Se pueden mostrar múltiples notificaciones push simultáneamente?
Sí, pero si tienen el mismo `tag`, la nueva reemplaza a la anterior (evita spam).

### ¿Qué pasa si no pongo `tag` en la notificación?
Cada notificación se mostrará separadamente (posible spam si hay muchas).

### ¿Cómo accedo a las notificaciones desde el componente?
Simplemente haz clic en el badge de campana en navbar → `/user/notificaciones`

### ¿Puedo enviar notificaciones desde el backend (Node.js)?
Sí, solo haz INSERT en la tabla `notificaciones` directamente desde tu backend:
```sql
INSERT INTO notificaciones (user_id, tipo, mensaje, leido, creado)
VALUES ('user-uuid', 'tipo', 'mensaje', false, now());
```
