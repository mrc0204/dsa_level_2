-- Migration: Add question_requests table for Role-Based Access Control & Approvals

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

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_question_requests_status ON public.question_requests (status);

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS set_question_requests_updated_at ON public.question_requests;
CREATE TRIGGER set_question_requests_updated_at
BEFORE UPDATE ON public.question_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.question_requests ENABLE ROW LEVEL SECURITY;

-- Allow full access (anon read/write for user request submissions and admin approvals)
CREATE POLICY "Allow full access to question_requests"
    ON public.question_requests
    FOR ALL
    USING (true)
    WITH CHECK (true);
