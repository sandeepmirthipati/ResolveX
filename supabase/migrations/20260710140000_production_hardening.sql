-- Production hardening for settings, trigger execution, and duplicate policy cleanup.

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read app settings" ON public.app_settings;
CREATE POLICY "Admins can read app settings"
    ON public.app_settings FOR SELECT TO authenticated
    USING (public.get_auth_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings"
    ON public.app_settings FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'super_admin'))
    WITH CHECK (public.get_auth_role() IN ('admin', 'super_admin'));

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value)
VALUES (
    'company',
    jsonb_build_object(
        'name', '',
        'email', '',
        'phone', '',
        'website', '',
        'address', ''
    )
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.track_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        IF (NEW.status = 'resolved') THEN
            NEW.resolved_at := NOW();
        ELSE
            NEW.resolved_at := NULL;
        END IF;

        INSERT INTO public.complaint_status_history (complaint_id, previous_status, new_status, remarks, updated_by)
        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.resolution, 'Status updated by system/admin.'),
            COALESCE(NEW.assigned_to, NEW.user_id)
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_complaint_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.complaint_status_history (complaint_id, previous_status, new_status, remarks, updated_by)
    VALUES (NEW.id, NULL, NEW.status, 'Complaint registered.', NEW.user_id);
    RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
    ON public.notifications FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_sent_at
    ON public.notifications(recipient_id, sent_at DESC);