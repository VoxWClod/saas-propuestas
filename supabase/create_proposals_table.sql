-- Tabla para guardar propuestas generadas
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content_html TEXT NOT NULL,
    file_docx TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- RLS (Row Level Security) - Los usuarios solo pueden ver sus propias propuestas
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo sus propias propuestas
CREATE POLICY "Users can view their own proposals"
    ON proposals FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias propuestas
CREATE POLICY "Users can insert their own proposals"
    ON proposals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias propuestas
CREATE POLICY "Users can update their own proposals"
    ON proposals FOR UPDATE
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden borrar sus propias propuestas
CREATE POLICY "Users can delete their own proposals"
    ON proposals FOR DELETE
    USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
