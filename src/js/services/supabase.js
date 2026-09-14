import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Fetch all questions from Supabase public.questions table
 */
export async function fetchQuestions() {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('added_at', { ascending: false });

    if (error) {
        console.error('Supabase fetch error:', error);
        return null;
    }
    return data.map(q => ({
        id: q.id,
        title: q.title,
        titleKey: q.title_key,
        description: q.description || '',
        category: q.category,
        count: q.count,
        addedAt: new Date(q.added_at).getTime()
    }));
}

/**
 * Insert a question to Supabase public.questions table
 */
export async function insertQuestion(item) {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('questions')
        .insert([{
            title: item.title,
            title_key: item.titleKey || item.title.toLowerCase().replace(/[^a-z0-9]/g, ''),
            description: item.description || '',
            category: item.category,
            count: item.count || 1,
            added_at: item.addedAt ? new Date(item.addedAt).toISOString() : new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Supabase insert error:', error);
        return null;
    }
    return data;
}

/**
 * Update a question in Supabase
 */
export async function updateQuestion(id, updates) {
    if (!supabase) return null;

    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.titleKey !== undefined) payload.title_key = updates.titleKey;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.count !== undefined) payload.count = updates.count;

    const { data, error } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Supabase update error:', error);
        return null;
    }
    return data;
}

/**
 * Delete a question from Supabase
 */
export async function deleteQuestion(id) {
    if (!supabase) return null;
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Supabase delete error:', error);
        return false;
    }
    return true;
}

/**
 * Fetch pending question requests
 */
export async function fetchQuestionRequests() {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('question_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase fetch question_requests error:', error);
        return [];
    }
    return data.map(r => ({
        id: r.id,
        title: r.title,
        titleKey: r.title_key,
        description: r.description || '',
        category: r.category,
        requestedBy: r.requested_by || 'User',
        status: r.status,
        createdAt: new Date(r.created_at).getTime()
    }));
}

/**
 * Insert a question request (for normal users)
 */
export async function insertQuestionRequest(item) {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('question_requests')
        .insert([{
            title: item.title,
            title_key: item.titleKey || item.title.toLowerCase().replace(/[^a-z0-9]/g, ''),
            description: item.description || '',
            category: item.category,
            requested_by: item.requestedBy || 'Normal User',
            status: 'pending'
        }])
        .select()
        .single();

    if (error) {
        console.error('Supabase insert question_requests error:', error);
        return null;
    }
    return data;
}

/**
 * Update a question request status ('approved' or 'rejected')
 */
export async function updateQuestionRequestStatus(id, status) {
    if (!supabase) return false;
    const { error } = await supabase
        .from('question_requests')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Supabase update question_requests status error:', error);
        return false;
    }
    return true;
}

