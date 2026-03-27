# Stripe — Implementación pendiente

## Contexto

- Fecha actual: `27/03`
- La entrega funcional ya consumió el tiempo crítico de estabilización.
- La pasarela de pagos con Stripe quedó pendiente y ahora es prioridad alta.
- Ya existe cuenta de Stripe, pero todavía NO hay integración segura completa.

## Estado actual del proyecto

## Ya existe en base de datos

- Tabla `boosts`
  - `id`
  - `publicacion_id`
  - `fecha_inicio`
  - `fecha_fin`
  - `monto`
  - `estado`

- Tabla `pagos`
  - `id`
  - `user_id`
  - `boost_id`
  - `stripe_payment_id`
  - `monto`
  - `estado`
  - `creado`

## Lo que NO existe aún de forma segura

- backend/edge function para crear sesión de Stripe
- webhook para confirmar pagos
- reconciliación server-side del estado del pago
- flujo seguro de activación de boost luego del pago

## Decisión técnica correcta

## NO hacer

- NO confirmar pagos solo desde frontend
- NO guardar `secret key` de Stripe en Angular
- NO marcar `pagos.estado = aprobado` desde el cliente
- NO activar boosts solo porque el usuario volvió de Stripe

## SÍ hacer

- Crear sesión de pago desde backend seguro
- Confirmar pago desde webhook
- Actualizar `pagos` y `boosts` desde backend
- Dejar al frontend solo como disparador y visualizador del estado

## Arquitectura recomendada

### Flujo mínimo correcto

1. Usuario elige impulsar publicación.
2. Frontend llama backend/edge function `create_checkout_session`.
3. Backend:
   - valida usuario autenticado
   - valida que la publicación le pertenezca
   - calcula monto real
   - crea o prepara fila en `boosts`
   - crea o prepara fila en `pagos`
   - llama a Stripe Checkout Session
   - devuelve `checkoutUrl` o `sessionId`
4. Frontend redirige a Stripe Checkout.
5. Stripe procesa pago.
6. Webhook recibe evento (`checkout.session.completed` o `payment_intent.succeeded`).
7. Backend:
   - verifica firma del webhook
   - actualiza `pagos.estado`
   - guarda `stripe_payment_id` / `checkout_session_id`
   - activa `boosts.estado`
   - define `fecha_inicio` y `fecha_fin`
8. Frontend consulta estado actualizado y lo muestra.

## Cambios recomendados en base de datos

## Tabla `pagos`

Agregar idealmente:

- `stripe_checkout_session_id`
- `moneda`
- `actualizado`
- `error_message` (opcional)

## Tabla `boosts`

Definir claramente estados permitidos, por ejemplo:

- `pendiente_pago`
- `activo`
- `expirado`
- `cancelado`

## Checklist de implementación

### Fase 1 — Preparación técnica

- [ ] Definir precio real del boost
- [ ] Definir duración del boost
- [ ] Confirmar qué publicación puede impulsarse
- [ ] Confirmar reglas de negocio (una publicación puede tener más de un boost o no)
- [ ] Confirmar dominio real donde volverá Stripe (`success_url`, `cancel_url`)

### Fase 2 — Stripe Dashboard

- [ ] Obtener `Publishable key`
- [ ] Obtener `Secret key`
- [ ] Configurar `Webhook signing secret`
- [ ] Definir modo `test`
- [ ] Configurar URLs de retorno

### Fase 3 — Backend seguro

- [ ] Crear endpoint o edge function `create_checkout_session`
- [ ] Validar usuario autenticado
- [ ] Validar propiedad de la publicación
- [ ] Crear registro `boosts` inicial
- [ ] Crear registro `pagos` inicial
- [ ] Crear sesión de Stripe con metadata útil

### Fase 4 — Webhook

- [ ] Crear endpoint o edge function `stripe_webhook`
- [ ] Verificar firma del webhook
- [ ] Manejar al menos:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
- [ ] Actualizar `pagos.estado`
- [ ] Actualizar `boosts.estado`
- [ ] Persistir identificadores Stripe

### Fase 5 — Frontend

- [ ] Crear CTA clara para impulsar publicación
- [ ] Llamar backend para iniciar checkout
- [ ] Redirigir a Stripe
- [ ] Mostrar estado al volver (`éxito`, `cancelado`, `pendiente`)
- [ ] Consultar estado real desde backend, no asumir éxito por URL

### Fase 6 — QA mínimo

- [ ] Pago exitoso en modo test
- [ ] Pago cancelado
- [ ] Pago fallido
- [ ] Usuario intenta pagar boost de publicación ajena
- [ ] Webhook repetido no duplica activación
- [ ] Boost queda activo solo después de confirmación real

## Variables necesarias

## Frontend

- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `APP_BASE_URL`

## Backend / Edge Function

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

## Riesgos si se implementa mal

- usuario activa boost sin pagar
- frontend marca pagos como exitosos sin confirmación real
- exposición de secret key
- pagos duplicados
- boosts activos incorrectamente
- inconsistencia entre `pagos` y `boosts`

## Recomendación final

- Si quieren algo entregable de verdad, Stripe debe entrar con backend/webhook, no solo con Angular.
- El frontend puede quedar listo rápido, pero la verdad del pago debe vivir server-side.
- La ruta más segura es construir primero el flujo backend y recién después enchufar UI.

## Siguiente paso recomendado

1. Definir si usarán:
   - Supabase Edge Functions
   - backend propio
2. Diseñar contrato mínimo:
   - `create_checkout_session`
   - `stripe_webhook`
3. Recién después implementar la UI de “Impulsar publicación”.
