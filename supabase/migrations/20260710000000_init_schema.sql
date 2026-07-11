-- =========================================================================
-- 1. ENUMS AND EXTENSIONS
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE app_role AS ENUM ('customer', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended');
CREATE TYPE complaint_status AS ENUM ('pending', 'assigned', 'in-progress', 'resolved', 'closed', 'rejected');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notification_type AS ENUM ('sms', 'whatsapp');
CREATE TYPE delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- =========================================================================
-- 2. TABLES CREATION
-- =========================================================================

-- Public Profiles Table (Relates directly to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    role app_role NOT NULL DEFAULT 'customer',
    status user_status NOT NULL DEFAULT 'active',
    profile_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Complaints Table
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority complaint_priority NOT NULL DEFAULT 'medium',
    status complaint_status NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    CONSTRAINT check_resolved_at CHECK (
        (status = 'resolved' AND resolved_at IS NOT NULL) OR 
        (status != 'resolved')
    )
);

-- Complaint Status History (Audit Trail)
CREATE TABLE public.complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    previous_status complaint_status,
    new_status complaint_status NOT NULL,
    remarks TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications (SMS/WhatsApp outbox logs)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    message TEXT NOT NULL,
    delivery_status delivery_status NOT NULL DEFAULT 'pending',
    api_response JSONB,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Activity Logs (Read-only for security audits)
CREATE TABLE public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attachments Table
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone_number);

CREATE INDEX idx_complaints_number ON public.complaints(complaint_number);
CREATE INDEX idx_complaints_user ON public.complaints(user_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_category ON public.complaints(category_id);
CREATE INDEX idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at);
CREATE INDEX idx_complaints_resolved_at ON public.complaints(resolved_at);

CREATE INDEX idx_status_history_complaint ON public.complaint_status_history(complaint_id);
CREATE INDEX idx_status_history_created_at ON public.complaint_status_history(created_at);

CREATE INDEX idx_notifications_complaint ON public.notifications(complaint_id);
CREATE INDEX idx_notifications_sent_at ON public.notifications(sent_at);

CREATE INDEX idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at);

CREATE INDEX idx_attachments_complaint ON public.attachments(complaint_id);

-- =========================================================================
-- 4. HELPER TRIGGERS AND FUNCTIONS
-- =========================================================================

-- Trigger to sync user profiles with auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone_number, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        NEW.phone,
        COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'::app_role),
        'active'::user_status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-generate human-readable Complaint Numbers (RX-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
    today_prefix TEXT;
    seq_number INT;
BEGIN
    today_prefix := 'RX-' || to_char(NOW(), 'YYYYMMDD') || '-';
    
    -- Find the count of complaints raised today
    SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_number
    FROM public.complaints
    WHERE complaint_number LIKE today_prefix || '%';
    
    NEW.complaint_number := today_prefix || lpad(seq_number::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pre_complaint_insert
    BEFORE INSERT ON public.complaints
    FOR EACH ROW
    WHEN (NEW.complaint_number IS NULL OR NEW.complaint_number = '')
    EXECUTE FUNCTION public.generate_complaint_number();

-- Trigger to automatically track status transitions
CREATE OR REPLACE FUNCTION public.track_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Auto-set resolved_at if status becomes resolved
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_complaint_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.complaint_status_history (complaint_id, previous_status, new_status, remarks, updated_by)
    VALUES (NEW.id, NULL, NEW.status, 'Complaint registered.', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_complaint_status_update
    BEFORE UPDATE OF status ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.track_complaint_status_change();

CREATE TRIGGER on_complaint_created
    AFTER INSERT ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.log_complaint_created();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Helper to check user role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS app_role AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM public.profiles WHERE id = auth.uid()),
        'customer'::app_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Allow public read-access to categories"
    ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage categories"
    ON public.categories FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'super_admin'));

CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT TO authenticated
    USING (auth.uid() = id OR public.get_auth_role() IN ('admin', 'super_admin'));

CREATE POLICY "Users can edit their own profile details"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- block role tampering

CREATE POLICY "Super admin has full control over profiles"
    ON public.profiles FOR ALL TO authenticated
    USING (public.get_auth_role() = 'super_admin');

-- Complaints Policies
CREATE POLICY "Customers can view only their complaints"
    ON public.complaints FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.get_auth_role() IN ('admin', 'super_admin'));

CREATE POLICY "Customers can create complaints"
    ON public.complaints FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers cannot modify complaints once resolved/closed/rejected"
    ON public.complaints FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() AND 
        status NOT IN ('resolved', 'closed', 'rejected')
    )
    WITH CHECK (
        user_id = auth.uid() AND
        status NOT IN ('resolved', 'closed', 'rejected') AND
        assigned_to = (SELECT assigned_to FROM public.complaints WHERE id = id) -- block agent tampering
    );

CREATE POLICY "Admins/Agents can view and manage all complaints"
    ON public.complaints FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'super_admin'));

-- Timeline history policies
CREATE POLICY "View status history for associated complaints"
    ON public.complaint_status_history FOR SELECT TO authenticated
    USING (
        complaint_id IN (SELECT id FROM public.complaints WHERE user_id = auth.uid()) OR
        public.get_auth_role() IN ('admin', 'super_admin')
    );

CREATE POLICY "Admins can insert history logs"
    ON public.complaint_status_history FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_role() IN ('admin', 'super_admin'));

-- Notifications policies
CREATE POLICY "Users can view logs of notifications sent to them"
    ON public.notifications FOR SELECT TO authenticated
    USING (
        recipient_id = auth.uid() OR
        public.get_auth_role() IN ('admin', 'super_admin')
    );

CREATE POLICY "Admins can manage notifications"
    ON public.notifications FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'super_admin'));

-- Attachments policies
CREATE POLICY "View attachments for associated complaints"
    ON public.attachments FOR SELECT TO authenticated
    USING (
        complaint_id IN (SELECT id FROM public.complaints WHERE user_id = auth.uid()) OR
        public.get_auth_role() IN ('admin', 'super_admin')
    );

CREATE POLICY "Upload attachments for own complaints"
    ON public.attachments FOR INSERT TO authenticated
    WITH CHECK (
        complaint_id IN (SELECT id FROM public.complaints WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage attachments"
    ON public.attachments FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'super_admin'));

-- Admin logs policies
CREATE POLICY "Admins can view admin logs"
    ON public.admin_logs FOR SELECT TO authenticated
    USING (public.get_auth_role() IN ('admin', 'super_admin'));

-- =========================================================================
-- 6. STORAGE BUCKET CONFIGURATION (Supabase Storage schema integration)
-- =========================================================================

-- Create a storage bucket for complaints
INSERT INTO storage.buckets (id, name, public) 
VALUES ('complaint-attachments', 'complaint-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Allow authenticated users to upload files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'complaint-attachments');

CREATE POLICY "Allow public read access to uploads"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'complaint-attachments');

-- =========================================================================
-- 7. SEED DATA FOR CATEGORIES
-- =========================================================================
INSERT INTO public.categories (name, description) VALUES
('Billing', 'Invoicing, duplicate charges, refunds, subscription plans'),
('Maintenance', 'Hardware repair, facility operations, device upkeep'),
('IT Support', 'Software access, login failures, app crashes, bug reports'),
('HR Inquiry', 'Employee relations, payroll queries, benefits questions'),
('Security & Compliance', 'SLA breaches, data privacy, access violations, security incidents'),
('Others', 'Miscellaneous issues and uncategorized requests')
ON CONFLICT (name) DO NOTHING;
