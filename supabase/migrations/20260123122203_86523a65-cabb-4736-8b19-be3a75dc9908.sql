-- Create OTP tokens table for signup and password reset
CREATE TABLE public.otp_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX idx_otp_tokens_email_purpose ON public.otp_tokens(email, purpose);
CREATE INDEX idx_otp_tokens_expires_at ON public.otp_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.otp_tokens ENABLE ROW LEVEL SECURITY;

-- No direct access - only through edge functions with service role
-- This ensures OTPs can only be managed server-side