-- Add assignment metadata to complaints
ALTER TABLE public.complaints
    ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_complaints_assigned_by ON public.complaints(assigned_by);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_at ON public.complaints(assigned_at);
