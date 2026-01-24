-- Add explicit deny policy to otp_tokens for defense in depth
-- Service role bypasses RLS, so edge functions can still access the table
CREATE POLICY "otp_tokens_no_direct_access"
ON public.otp_tokens
AS RESTRICTIVE
FOR ALL
USING (false);

-- Document the security model
COMMENT ON TABLE public.otp_tokens IS 
'OTP tokens managed exclusively by edge functions using service role. RLS with explicit deny policy provides defense in depth.';