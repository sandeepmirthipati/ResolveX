-- Notification deduplication and retry tracking
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS event_key TEXT,
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_notifications_dedup
    ON public.notifications(complaint_id, recipient_id, notification_type, event_key);

-- Store phone from signup metadata when auth.users.phone is null
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone_number, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        COALESCE(
            NULLIF(NEW.phone, ''),
            NULLIF(NEW.raw_user_meta_data->>'phone_number', '')
        ),
        'customer'::app_role,
        'active'::user_status
    );
    RETURN NEW;
END;
$$;
