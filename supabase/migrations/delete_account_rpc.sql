-- ============================================================
-- Eliminar Cuenta de Usuario (Eliminación Definitiva)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  -- Obtenemos el ID del usuario autenticado actual
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- 1. Eliminar el registro de perfiles (si no hay CASCADE, evitamos error de FK)
  -- Nota: Eliminar el perfil puede eliminar en cascada publicaciones o comentarios 
  -- dependiendo de cómo se hayan definido las llaves foráneas.
  DELETE FROM public.perfiles WHERE id = v_uid;
  
  -- 2. Eliminar el usuario de Supabase Auth
  -- Esto invalida la cuenta completamente y permite que el correo sea registrado nuevamente.
  DELETE FROM auth.users WHERE id = v_uid;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Otorgar permiso de ejecución solo a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- Notificamos a PostgREST para que actualice la caché del schema y exponga el RPC
NOTIFY pgrst, 'reload schema';
