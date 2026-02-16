-- Arreglo de Permisos (RLS) para Propuestas
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Habilitar seguridad a nivel de fila
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas (por si acaso están mal definidas)
DROP POLICY IF EXISTS "Users can view their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can insert their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete their own proposals" ON proposals;

-- 3. Crear políticas correctas

-- Permiso para VER (Select)
CREATE POLICY "Users can view their own proposals"
    ON proposals FOR SELECT
    USING (auth.uid() = user_id);

-- Permiso para GUARDAR (Insert)
CREATE POLICY "Users can insert their own proposals"
    ON proposals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Permiso para ACTUALIZAR (Update)
CREATE POLICY "Users can update their own proposals"
    ON proposals FOR UPDATE
    USING (auth.uid() = user_id);

-- Permiso para BORRAR (Delete)
CREATE POLICY "Users can delete their own proposals"
    ON proposals FOR DELETE
    USING (auth.uid() = user_id);
