-- Make complaint number generation safe for concurrent inserts

CREATE TABLE IF NOT EXISTS public.complaint_number_sequences (
    day TEXT PRIMARY KEY,
    next_value INTEGER NOT NULL DEFAULT 1
);

CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
    today_prefix TEXT := 'RX-' || to_char(NOW(), 'YYYYMMDD') || '-';
    seq_number INT;
BEGIN
    INSERT INTO public.complaint_number_sequences (day, next_value)
    VALUES (to_char(NOW(), 'YYYYMMDD'), 1)
    ON CONFLICT (day) DO UPDATE
    SET next_value = public.complaint_number_sequences.next_value + 1
    RETURNING next_value INTO seq_number;

    NEW.complaint_number := today_prefix || lpad(seq_number::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
