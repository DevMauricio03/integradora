-- =============================================================
--  Índices para optimizar feed_posts VIEW
--  NOTA: Se eliminó CONCURRENTLY porque el SQL Editor de Supabase
--        ejecuta dentro de una transacción y no es compatible.
--
--  Impacto de no usar CONCURRENTLY:
--  - La tabla se bloquea para escrituras solo durante la creación.
--  - Con volumen bajo (< miles de filas) el bloqueo dura < 1 segundo.
--  - Seguro de ejecutar en desarrollo y producción con tráfico bajo.
-- =============================================================


-- ── publicaciones ─────────────────────────────────────────────

-- Cubre: WHERE estado='activo' ORDER BY creado DESC LIMIT 5
CREATE INDEX IF NOT EXISTS idx_publicaciones_estado_creado
  ON publicaciones (estado, creado DESC);

-- Cubre: LEFT JOIN perfiles ON perf.id = p.autor_id
CREATE INDEX IF NOT EXISTS idx_publicaciones_autor_id
  ON publicaciones (autor_id);


-- ── anuncios ──────────────────────────────────────────────────

-- Cubre: WHERE estado='activo' ORDER BY creado DESC LIMIT 5
CREATE INDEX IF NOT EXISTS idx_anuncios_estado_creado
  ON anuncios (estado, creado DESC);


-- ── perfiles ──────────────────────────────────────────────────

-- Cubre: LEFT JOIN roles ON rol.id = perf.rol_id
CREATE INDEX IF NOT EXISTS idx_perfiles_rol_id
  ON perfiles (rol_id);


-- =============================================================
--  Verificar índices creados:
-- =============================================================
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('publicaciones', 'anuncios', 'perfiles')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
