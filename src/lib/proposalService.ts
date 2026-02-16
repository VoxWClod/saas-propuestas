import { supabase } from './supabase';

export interface Proposal {
    id: string;
    user_id: string;
    name: string;
    content_html: string;
    file_docx: string;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface CreateProposalData {
    name: string;
    content_html: string;
    file_docx: string;
    metadata?: any;
}

/**
 * Guardar una nueva propuesta en Supabase
 */
export async function saveProposal(data: CreateProposalData): Promise<Proposal> {
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('Debes iniciar sesión para guardar propuestas');
    }

    // Insertar la propuesta
    const { data: proposal, error } = await supabase
        .from('proposals')
        .insert([
            {
                user_id: user.id,
                name: data.name,
                content_html: data.content_html,
                file_docx: data.file_docx,
                metadata: data.metadata || {}
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error guardando propuesta:', error);
        throw new Error('No se pudo guardar la propuesta: ' + error.message);
    }

    return proposal;
}

/**
 * Obtener todas las propuestas del usuario actual
 */
export async function getUserProposals(): Promise<Proposal[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('Debes iniciar sesión para ver propuestas');
    }

    const { data: proposals, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo propuestas:', error);
        throw new Error('No se pudieron cargar las propuestas: ' + error.message);
    }

    return proposals || [];
}

/**
 * Obtener una propuesta específica por ID
 */
export async function getProposalById(id: string): Promise<Proposal | null> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('Debes iniciar sesión para ver propuestas');
    }

    const { data: proposal, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // No encontrada
        }
        console.error('Error obteniendo propuesta:', error);
        throw new Error('No se pudo cargar la propuesta: ' + error.message);
    }

    return proposal;
}

/**
 * Actualizar una propuesta existente
 */
export async function updateProposal(id: string, data: Partial<CreateProposalData>): Promise<Proposal> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('Debes iniciar sesión para actualizar propuestas');
    }

    const { data: proposal, error } = await supabase
        .from('proposals')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error actualizando propuesta:', error);
        throw new Error('No se pudo actualizar la propuesta: ' + error.message);
    }

    return proposal;
}

/**
 * Eliminar una propuesta
 */
export async function deleteProposal(id: string): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error('Debes iniciar sesión para eliminar propuestas');
    }

    const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error eliminando propuesta:', error);
        throw new Error('No se pudo eliminar la propuesta: ' + error.message);
    }
}
