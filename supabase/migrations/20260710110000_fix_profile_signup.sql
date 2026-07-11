-- Fix profile creation on signup (RLS blocked handle_new_user trigger inserts)

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
        NEW.phone,
        'customer'::app_role,
        'active'::user_status
    );
    RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;
CREATE POLICY "Allow profile creation on signup"
    ON public.profiles FOR INSERT
    TO authenticated, service_role
    WITH CHECK (auth.uid() = id);

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO supabase_auth_admin;
