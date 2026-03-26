# P0.3 Supabase Audit

## Objetivo

- Detectar HOY los bloqueadores reales que pueden tirar la prueba funcional del `27/03`.
- Separar lo que es `OK`, `Riesgo` y `Critico`.
- Salir con una lista corta de fixes backend/frontend realmente necesarios antes de entrega.

## Regla de ejecucion

- Ejecutar en este orden exacto.
- No saltar bloques.
- Si aparece un hallazgo `Critico`, documentarlo y decidir remediation antes de seguir expandiendo alcance.

## Criterio de severidad

- `OK`: existe, responde y coincide con lo que consume frontend.
- `Riesgo`: existe pero esta desalineado, incompleto o dudoso.
- `Critico`: falta, da error, no tiene permiso o rompe flujo feliz.

## Evidencia minima a recolectar

- [ ] Screenshot de queries importantes.
- [ ] Resultado SQL exportable o copiable.
- [ ] Nota corta por hallazgo con impacto funcional.
- [ ] Clasificacion final: `OK`, `Riesgo` o `Critico`.

## Orden exacto de ejecucion

### Bloque 1 - Existencia de objetos criticos

Objetivo: confirmar que existen tablas, views, RPCs, buckets y realtime antes de auditar permisos.

- [ ] Verificar tablas/views: `perfiles`, `publicaciones`, `reportes`, `notificaciones`, `feed_posts`, `admin_reports`
- [ ] Verificar RPCs: `moderar_reporte`, `suspend_user`, `unsuspend_user`, `delete_own_account`, `get_dashboard_stats`
- [ ] Verificar buckets: `avatars`, `publicaciones`
- [ ] Verificar publicacion realtime para `notificaciones` y `reportes`

SQL sugerido:

```sql
select table_schema, table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in ('perfiles','publicaciones','reportes','notificaciones','feed_posts','admin_reports')
order by table_type, table_name;

select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('moderar_reporte','suspend_user','unsuspend_user','delete_own_account','get_dashboard_stats')
order by routine_name;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('avatars','publicaciones');

select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('notificaciones','reportes')
order by tablename;
```

### Bloque 2 - RLS y grants de tablas criticas

Objetivo: validar si el frontend esta apoyado en seguridad real o en fe.

Orden:

- [ ] `notificaciones`
- [ ] `perfiles`
- [ ] `publicaciones`
- [ ] `reportes`

SQL sugerido:

```sql
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('perfiles','publicaciones','reportes','notificaciones')
order by tablename, policyname;

select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('perfiles','publicaciones','reportes','notificaciones','feed_posts','admin_reports')
  and grantee in ('anon','authenticated')
order by table_name, grantee, privilege_type;
```

Chequeos prioritarios:

- [ ] `notificaciones`: el duenio puede leer, borrar y limpiar; terceros NO.
- [ ] `perfiles`: nadie cambia `rol_id`, `estado` o `fecha_suspension` sin control admin.
- [ ] `publicaciones`: autor crea lo suyo; no se aprueba/modera desde cliente comun.
- [ ] `reportes`: no hay `update/delete` abiertos indebidamente.

### Bloque 3 - Contrato real de datos

Objetivo: confirmar que el shape que consume el frontend existe de verdad.

Orden:

- [ ] `feed_posts`
- [ ] `admin_reports`
- [ ] `perfiles`
- [ ] `publicaciones`
- [ ] `reportes`
- [ ] `notificaciones`

SQL sugerido:

```sql
select id, titulo, tipo, fuente, estado, autor_id, autor_nombre, autor_apellidos, autor_foto_url, autor_carrera_id, autor_rol, creado
from public.feed_posts
order by creado desc, id desc
limit 10;

select id, estado, tipo_reporte, publicacion_id, comentario_id, autor_id, autor_nombre, informante_id, informante_nombre, pub_titulo, pub_tipo, com_contenido, creado
from public.admin_reports
order by creado desc
limit 10;

select id, nombre, apellidos, "correoInstitucional", rol_id, universidad_id, carrera_id, foto_url, estado, fecha_suspension, creado
from public.perfiles
order by creado desc nulls last
limit 5;

select id, titulo, tipo, estado, autor_id, imagen_url, imagenes_url, categoria, detalles, creado
from public.publicaciones
order by creado desc
limit 10;

select id, publicacion_id, comentario_id, tipo_reporte, reportado_por, motivo, descripcion, estado, resuelto_por, resuelto_en, resolucion, creado
from public.reportes
order by creado desc
limit 10;

select id, user_id, tipo, mensaje, leido, post_id, comentario_id, creado
from public.notificaciones
order by creado desc
limit 10;
```

Chequeos prioritarios:

- [ ] `feed_posts` devuelve columnas exactas esperadas por frontend.
- [ ] `admin_reports` devuelve columnas exactas esperadas por frontend.
- [ ] No faltan campos funcionales criticos (`estado`, `comentario_id`, `post_id`, `rol_id`, etc.).

### Bloque 4 - RPCs criticas

Objetivo: detectar funciones que pueden romper admin, suspension o cuenta de usuario.

Orden:

- [ ] `get_dashboard_stats`
- [ ] `moderar_reporte`
- [ ] `suspend_user`
- [ ] `unsuspend_user`
- [ ] `delete_own_account`

SQL sugerido:

```sql
select p.proname, p.oid::regprocedure as signature, p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('moderar_reporte','suspend_user','unsuspend_user','delete_own_account','get_dashboard_stats')
order by p.proname;

select p.proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('moderar_reporte','suspend_user','unsuspend_user','delete_own_account','get_dashboard_stats')
order by p.proname;

select public.get_dashboard_stats(30);
```

Chequeos prioritarios:

- [ ] `get_dashboard_stats` devuelve las keys exactas esperadas por el dashboard.
- [ ] `moderar_reporte` hace lo que la UI promete.
- [ ] Caso `suspender_usuario` en `moderar_reporte` no queda desalineado con el modal admin.
- [ ] `suspend_user` y `unsuspend_user` tienen validacion admin-only.
- [ ] `delete_own_account` NO se ejecuta en prod sin revisar FKs reales.

FKs para `delete_own_account`:

```sql
select
  conrelid::regclass as tabla_hija,
  confrelid::regclass as tabla_padre,
  conname,
  pg_get_constraintdef(oid) as fk_def
from pg_constraint
where contype = 'f'
  and confrelid in ('public.perfiles'::regclass, 'auth.users'::regclass)
order by confrelid::regclass::text, conrelid::regclass::text;
```

### Bloque 5 - Storage

Objetivo: confirmar que uploads no van a romper avatar o publicaciones.

Orden:

- [ ] bucket `avatars`
- [ ] bucket `publicaciones`
- [ ] policies de `storage.objects`
- [ ] muestras recientes de objetos

SQL sugerido:

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('avatars','publicaciones');

select bucket_id, name, created_at, owner
from storage.objects
where bucket_id in ('avatars','publicaciones')
order by created_at desc
limit 20;

select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
```

Chequeos prioritarios:

- [ ] `avatars` existe y permite el flujo real del perfil.
- [ ] `publicaciones` existe y permite upload de imagenes.
- [ ] Los buckets tienen visibilidad/policies coherentes con el frontend actual.

### Bloque 6 - Realtime

Objetivo: validar que usuario y admin reciban eventos minimos esperados.

Orden:

- [ ] `notificaciones`
- [ ] `reportes`

SQL sugerido:

```sql
select pubname, schemaname, tablename
from pg_publication_tables
where pubname='supabase_realtime'
  and schemaname='public'
  and tablename in ('notificaciones','reportes');

select tc.table_name, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
where tc.table_schema='public'
  and tc.table_name in ('notificaciones','reportes')
  and tc.constraint_type='PRIMARY KEY';
```

Chequeos prioritarios:

- [ ] `notificaciones` esta en realtime y tiene PK.
- [ ] `reportes` esta en realtime y tiene PK.
- [ ] El equipo entiende que `reportes` realtime trae tabla base, no la view enriquecida `admin_reports`.

## Que revisar HOY MISMO

- [ ] `notificaciones` RLS de delete y clear all.
- [ ] `feed_posts` y `admin_reports` existen y responden.
- [ ] `moderar_reporte` hace lo que la UI admin promete.
- [ ] Buckets `avatars` y `publicaciones` existen y permiten upload real.
- [ ] Realtime de `notificaciones` y `reportes` esta publicado.

## Cierre de P0.3

Al terminar, salir con esto:

- [ ] Lista de hallazgos `Criticos` que bloquean entrega.
- [ ] Lista de hallazgos `Riesgo` que pueden esperar post-entrega.
- [ ] Decision clara de que se corrige en backend antes del `27/03`.
- [ ] Decision clara de que se corrige en frontend antes del `27/03`.
- [ ] Evidencia archivada para no volver a auditar lo mismo dos veces.
