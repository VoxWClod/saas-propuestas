-- Sincronizar Teléfono desde Metadata a Columna Phone
-- Ejecuta este script en el SQL Editor de Supabase para activar la copia automática.

-- 1. Crear la función que copia el dato
CREATE OR REPLACE FUNCTION public.sync_user_phone_from_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el teléfono viene vacío en la columna principal, pero existe en metadata (JSON)
  -- Lo copiamos automáticamente a la columna 'phone'
  IF NEW.phone IS NULL AND NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
    NEW.phone := NEW.raw_user_meta_data->>'phone';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el Trigger (Disparador) que se ejecuta ANTES de guardar el usuario
DROP TRIGGER IF EXISTS on_auth_user_created_sync_phone ON auth.users;

CREATE TRIGGER on_auth_user_created_sync_phone
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_phone_from_metadata();

-- Confirmación visual
SELECT 'Trigger de sincronización de teléfono activado correctamente' as confirmacion;
