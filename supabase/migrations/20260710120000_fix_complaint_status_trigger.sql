-- Fix status history FK violation: log initial status after complaint insert

CREATE OR REPLACE FUNCTION public.track_complaint_status_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_complaint_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.complaint_status_history (complaint_id, previous_status, new_status, remarks, updated_by)
    VALUES (NEW.id, NULL, NEW.status, 'Complaint registered.', NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_complaint_status_upsert ON public.complaints;
DROP TRIGGER IF EXISTS on_complaint_status_update ON public.complaints;
DROP TRIGGER IF EXISTS on_complaint_created ON public.complaints;

CREATE TRIGGER on_complaint_status_update
    BEFORE UPDATE OF status ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.track_complaint_status_change();

CREATE TRIGGER on_complaint_created
    AFTER INSERT ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.log_complaint_created();
