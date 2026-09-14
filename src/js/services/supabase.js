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

/**
 * Register a new user with NIAT ID & Password
 */
export async function registerAppUser(niatId, password) {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const formattedNiatId = niatId.trim().toUpperCase();

    // Check if user already exists
    const { data: existing } = await supabase
        .from('app_users')
        .select('id')
        .eq('niat_id', formattedNiatId)
        .maybeSingle();

    if (existing) {
        return { success: false, error: 'NIAT ID is already registered. Please sign in instead.' };
    }

    // Insert new user
    const { data, error } = await supabase
        .from('app_users')
        .insert([{
            niat_id: formattedNiatId,
            password_hash: password // Lightweight hash or plain password for demo
        }])
        .select()
        .single();

    if (error) {
        console.error('Supabase register user error:', error);
        return { success: false, error: error.message || 'Failed to create account.' };
    }
    return { success: true, user: { niatId: data.niat_id } };
}

/**
 * Log in user with NIAT ID & Password
 */
export async function loginAppUser(niatId, password) {
    if (!supabase) return { success: false, error: 'Supabase client not initialized' };

    const formattedNiatId = niatId.trim().toUpperCase();

    const { data, error } = await supabase
        .from('app_users')
        .select('niat_id, password_hash')
        .eq('niat_id', formattedNiatId)
        .maybeSingle();

    if (error || !data) {
        return { success: false, error: 'Invalid NIAT ID or user not found.' };
    }

    if (data.password_hash !== password) {
        return { success: false, error: 'Incorrect password.' };
    }

    return { success: true, user: { niatId: data.niat_id } };
}

/**
 * Fetch progress (completed question IDs) for a user
 */
export async function fetchUserProgress(niatId) {
    if (!supabase || !niatId) return [];

    const formattedNiatId = niatId.trim().toUpperCase();

    const { data, error } = await supabase
        .from('user_question_progress')
        .select('question_id, is_completed')
        .eq('niat_id', formattedNiatId)
        .eq('is_completed', true);

    if (error) {
        console.error('Supabase fetch user progress error:', error);
        return [];
    }
    return data.map(item => String(item.question_id));
}

/**
 * Toggle question completion progress for a user
 */
export async function toggleUserProgress(niatId, questionId, isCompleted) {
    if (!supabase || !niatId || !questionId) return false;

    const formattedNiatId = niatId.trim().toUpperCase();

    const { error } = await supabase
        .from('user_question_progress')
        .upsert({
            niat_id: formattedNiatId,
            question_id: questionId,
            is_completed: isCompleted,
            updated_at: new Date().toISOString()
        }, { onConflict: 'niat_id,question_id' });

    if (error) {
        console.error('Supabase toggle progress error:', error);
        return false;
    }
    return true;
}


