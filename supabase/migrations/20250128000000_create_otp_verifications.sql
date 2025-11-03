-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0 NOT NULL
);

-- Add index for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON public.otp_verifications(phone);

-- Add index for cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for anon users (to create OTP requests)
CREATE POLICY "Allow anon insert OTP" ON public.otp_verifications
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow select for anon users (to verify OTP)
CREATE POLICY "Allow anon select OTP" ON public.otp_verifications
    FOR SELECT
    TO anon
    USING (true);

-- Policy: Allow update for anon users (to mark as verified)
CREATE POLICY "Allow anon update OTP" ON public.otp_verifications
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Policy: Allow delete for anon users (to cleanup expired OTPs)
CREATE POLICY "Allow anon delete OTP" ON public.otp_verifications
    FOR DELETE
    TO anon
    USING (true);

-- Add comment
COMMENT ON TABLE public.otp_verifications IS 'Stores OTP verification codes for phone authentication';

