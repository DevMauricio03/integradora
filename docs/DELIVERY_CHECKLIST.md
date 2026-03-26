# Tuunka Delivery Checklist

## Contexto

- Fecha limite de cambios: `26/03 23:59`
- Fecha de pruebas/entrega funcional: `27/03 08:00`
- Objetivo inmediato: que el proyecto NO se caiga en pruebas.
- Objetivo secundario: dejar el camino correcto para integrar Stripe sin romper la entrega.

## Regla de decision

- Hasta la entrega, se prioriza `estabilidad > refactor profundo > mejoras cosmeticas`.
- Solo se aceptan cambios de alto impacto y bajo/medio radio de explosion.
- No se hacen refactors grandes de arquitectura si antes no protegen un flujo critico.

## Checklist critica pre-entrega

### 1. Config y entorno

- [ ] Sacar `supabaseUrl` hardcodeada de `src/app/core/services/supabase-client.service.ts`.
- [ ] Sacar `publishableKey` hardcodeada de `src/app/core/services/supabase-client.service.ts`.
- [ ] Sacar `redirectTo` hardcodeado a `localhost` de `src/app/core/services/auth.service.ts`.
- [ ] Definir `appBaseUrl` real para recovery/reset password por ambiente.
- [ ] Validar que login, logout y reset password funcionen en el entorno real de prueba.
- [ ] Confirmar que `base href` y `manifest.webmanifest` no rompan rutas si el deploy no vive en `/`.

### 2. Dependencias y baseline segura

- [ ] Subir Angular desde `21.2.1` a patch seguro (`21.2.5+`).
- [ ] NO actualizar `@supabase/supabase-js` antes de la entrega salvo bloqueo real.
- [ ] Regenerar `package-lock.json` y validar instalacion limpia.
- [ ] Confirmar que build, serve y tests sigan funcionando tras el upgrade.
- [ ] Dejar registradas las versiones finales de `Node`, `npm`, `Angular` y `Supabase SDK`.

### 3. Supabase: bloqueadores funcionales

- [ ] Verificar RLS de `notificaciones` para permitir borrar individual y `clear all` al usuario duenio.
- [ ] Verificar RLS de `perfiles` para evitar cambios indebidos de `rol_id`, `estado` y `fecha_suspension`.
- [ ] Verificar RLS de `publicaciones` para impedir crear/aprobar/moderar fuera de reglas.
- [ ] Verificar RLS de `reportes` para impedir `update/delete` indebidos desde cliente.
- [ ] Confirmar que `feed_posts` existe, responde y devuelve el shape exacto esperado por frontend.
- [ ] Confirmar que `admin_reports` existe, responde y devuelve el shape exacto esperado por frontend.
- [ ] Confirmar que `avatars` y `publicaciones` existen como buckets y aceptan uploads reales.
- [ ] Confirmar que `notificaciones` y `reportes` estan publicadas en `supabase_realtime`.

### 4. RPCs criticas

- [ ] Auditar `moderar_reporte` y confirmar que hace exactamente lo que promete la UI admin.
- [ ] Verificar caso `suspender_usuario` en `moderar_reporte`: hoy hay evidencia de desalineacion semantica.
- [ ] Auditar `suspend_user` y `unsuspend_user`: admin-only, validacion server-side y sin auto-suspension indebida.
- [ ] Auditar `delete_own_account` y revisar FKs reales antes de usarlo en pruebas.
- [ ] Auditar `get_dashboard_stats` y confirmar que devuelve todas las keys esperadas por el dashboard.

### 5. Flujos criticos que NO pueden fallar el 27

- [ ] Inicio de sesion usuario.
- [ ] Inicio de sesion admin.
- [ ] Registro.
- [ ] Recuperacion/cambio de password.
- [ ] Feed principal.
- [ ] Crear publicacion.
- [ ] Subir avatar.
- [ ] Ver y limpiar notificaciones.
- [ ] Moderar reportes desde admin.
- [ ] Dashboard admin carga sin errores ni metricas rotas.

### 6. Bugs y deuda que pegan directo a QA

- [ ] Reemplazar `src/app/app.spec.ts` roto por una prueba real minima.
- [ ] Agregar smoke tests para `App` y guards (`auth`, `admin`, `user`).
- [ ] Corregir la ruta compartida rota en `src/app/shared/components/Post-card/post-card/post-card.ts` (`/user/post/:id`).
- [ ] Corregir la semantica del dashboard admin: no puede decir `vs dia anterior` si el dato esta agrupado en buckets.
- [ ] Quitar logs sensibles/invasivos en auth, guards, reportes, notificaciones y uploads.

### 7. Cambios que SI conviene hacer antes del 27

- [ ] Refactors chicos y localizados en config/runtime.
- [ ] Ajustes puntuales en guards si corrigen un bug funcional comprobado.
- [ ] Tests minimos de humo para auth y routing.
- [ ] Fixes de contratos Supabase que rompan flujos reales.
- [ ] Correcciones puntuales en dashboard admin si afectan lectura funcional.

### 8. Cambios que NO conviene hacer antes del 27

- [ ] NO partir `SupabaseService` completo antes de entrega.
- [ ] NO rehacer stores grandes (`post-store`, `notification-store`) sin red minima.
- [ ] NO migrar de estrategia de auth o realtime entera.
- [ ] NO actualizar Supabase SDK sin causa fuerte.
- [ ] NO meter Stripe completo en produccion sin contrato backend cerrado.

## Stripe: prioridad real antes y despues de entrega

### Antes del 27

- [ ] Definir alcance: `Checkout Session` vs `Payment Intents`.
- [ ] Confirmar donde se va a crear la intencion de pago: backend/Edge Function, nunca desde frontend puro.
- [ ] Definir variables de entorno necesarias para Stripe (`publishable key`, `secret key`, webhook secret).
- [ ] Definir flujo funcional esperado: crear pago, volver a app, marcar estado, manejar cancelacion.
- [ ] Definir modelo de persistencia: donde se guarda `payment_intent_id`, `checkout_session_id`, estado y referencia de usuario/publicacion.
- [ ] Identificar tabla/entidad que representara pagos o boosts para no improvisarla luego.

### Despues del 27

- [ ] Crear backend seguro para Stripe (API server, Edge Function o backend dedicado).
- [ ] Procesar confirmacion por webhook, no confiar en frontend como fuente de verdad.
- [ ] Guardar estado de pago server-side y reconciliarlo con UI.
- [ ] Agregar expiracion, reintentos y manejo de pagos fallidos/cancelados.
- [ ] Agregar pruebas de integracion del flujo de pago.

## Orden recomendado de ejecucion

1. Config/runtime (`Supabase` + recovery redirect).
2. Upgrade patch de Angular.
3. Auditoria express de Supabase sobre RLS, RPCs, buckets y Realtime.
4. Correccion de bloqueadores funcionales detectados.
5. Test gate minimo (`App` + guards + smoke auth).
6. Fixes de QA directos (`Post-card` route, dashboard semantico, logs excesivos).
7. Definicion tecnica de Stripe sin implementacion completa en produccion.

## Criterio de salida antes del 27

- [ ] No hay `localhost` hardcodeado en recovery.
- [ ] Angular queda en baseline segura.
- [ ] Supabase no bloquea login/feed/publicacion/notificaciones/admin.
- [ ] Los flujos criticos pasan prueba manual.
- [ ] Existe al menos una red minima de validacion automatica.
- [ ] Stripe queda definido tecnicamente, pero no compromete la entrega funcional.
