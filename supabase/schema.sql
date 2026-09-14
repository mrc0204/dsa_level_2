-- Migration: Create DSA Vault Tables
-- Description: Creates questions table, user_settings table, indexes, updated_at triggers, and Row Level Security (RLS) policies.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_key TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
    show_decrease BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Indexes for efficient lookup & sorting
CREATE INDEX IF NOT EXISTS idx_questions_title_key ON public.questions (title_key);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions (category);
CREATE INDEX IF NOT EXISTS idx_questions_added_at ON public.questions (added_at DESC);

-- 4. Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_questions_updated_at ON public.questions;
CREATE TRIGGER set_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies (Allow anon read/write for single-user/hackathon app)
CREATE POLICY "Allow full access to questions"
    ON public.questions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to user_settings"
    ON public.user_settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. Create question_requests table for User Requests & Admin Approvals
CREATE TABLE IF NOT EXISTS public.question_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_key TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by TEXT DEFAULT 'User',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_requests_status ON public.question_requests (status);

DROP TRIGGER IF EXISTS set_question_requests_updated_at ON public.question_requests;
CREATE TRIGGER set_question_requests_updated_at
BEFORE UPDATE ON public.question_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.question_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to question_requests"
    ON public.question_requests
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. Create app_users table for NIAT ID Auth
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niat_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_niat_id ON public.app_users (niat_id);

-- 9. Create user_question_progress table
CREATE TABLE IF NOT EXISTS public.user_question_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niat_id TEXT NOT NULL REFERENCES public.app_users(niat_id) ON DELETE CASCADE,
    question_id UUID NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (niat_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_niat_id ON public.user_question_progress (niat_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON public.user_question_progress (question_id);

DROP TRIGGER IF EXISTS set_app_users_updated_at ON public.app_users;
CREATE TRIGGER set_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_user_question_progress_updated_at ON public.user_question_progress;
CREATE TRIGGER set_user_question_progress_updated_at
BEFORE UPDATE ON public.user_question_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to app_users"
    ON public.app_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow full access to user_question_progress"
    ON public.user_question_progress
    FOR ALL
    USING (true)
    WITH CHECK (true);


