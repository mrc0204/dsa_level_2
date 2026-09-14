-- Migration: Add app_users and user_question_progress tables for NIAT ID Auth & Progress Tracking

-- 1. Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niat_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for NIAT ID lookups
CREATE INDEX IF NOT EXISTS idx_app_users_niat_id ON public.app_users (niat_id);

-- 2. Create user_question_progress table
CREATE TABLE IF NOT EXISTS public.user_question_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niat_id TEXT NOT NULL REFERENCES public.app_users(niat_id) ON DELETE CASCADE,
    question_id UUID NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (niat_id, question_id)
);

-- Indexes for progress lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_niat_id ON public.user_question_progress (niat_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON public.user_question_progress (question_id);

-- Trigger for auto updated_at
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

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_question_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow full access for hackathon / anon client auth)
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
