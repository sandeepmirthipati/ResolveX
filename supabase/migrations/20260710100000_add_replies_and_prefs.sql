-- Admin replies on complaints
CREATE TABLE IF NOT EXISTS public.complaint_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_name TEXT NOT NULL DEFAULT 'Admin',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_replies_complaint ON public.complaint_replies(complaint_id);

ALTER TABLE public.complaint_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View replies for associated complaints"
    ON public.complaint_replies FOR SELECT TO authenticated
    USING (
        complaint_id IN (SELECT id FROM public.complaints WHERE user_id = auth.uid()) OR
        public.get_auth_role() IN ('admin', 'super_admin')
    );

CREATE POLICY "Admins can insert replies"
    ON public.complaint_replies FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_role() IN ('admin', 'super_admin'));

-- Notification preferences on profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS notification_sms BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS notification_whatsapp BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS notification_email BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS notification_marketing BOOLEAN NOT NULL DEFAULT false;

-- Allow service role / backend to insert notification logs
CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_role() IN ('admin', 'super_admin'));
