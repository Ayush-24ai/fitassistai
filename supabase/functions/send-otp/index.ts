import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  purpose: "signup" | "password_reset";
}

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    
    if (!gmailUser || !gmailAppPassword) {
      console.error("Gmail SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, purpose }: SendOtpRequest = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!purpose || !["signup", "password_reset"].includes(purpose)) {
      return new Response(
        JSON.stringify({ error: "Invalid purpose" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For signup, check if user already exists
    if (purpose === "signup") {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === email);
      if (userExists) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please sign in instead." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For password reset, check if user exists
    if (purpose === "password_reset") {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === email);
      if (!userExists) {
        // Don't reveal that user doesn't exist - still show success
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists, an OTP has been sent." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Rate limiting: Check for recent OTP requests (max 3 per 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOtps, error: rateError } = await supabase
      .from("otp_tokens")
      .select("id")
      .eq("email", email)
      .eq("purpose", purpose)
      .gte("created_at", tenMinutesAgo);

    if (rateError) {
      console.error("Rate limit check error:", rateError);
    } else if (recentOtps && recentOtps.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalidate any existing unused OTPs for this email/purpose
    await supabase
      .from("otp_tokens")
      .update({ used: true })
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("used", false);

    // Generate new OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    const { error: insertError } = await supabase
      .from("otp_tokens")
      .insert({
        email,
        otp_code: otpCode,
        purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP email using Gmail SMTP
    const subject = purpose === "signup" 
      ? "Verify your email - Fitness Assist" 
      : "Reset your password - Fitness Assist";

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #16a34a; margin: 0;">Fitness Assist</h1>
        </div>
        <h2 style="color: #1f2937; margin-bottom: 20px;">
          ${purpose === "signup" ? "Verify Your Email" : "Reset Your Password"}
        </h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
          ${purpose === "signup" 
            ? "Welcome to Fitness Assist! Use the following code to verify your email address:" 
            : "Use the following code to reset your password:"}
        </p>
        <div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin: 30px 0;">
          ${otpCode}
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code expires in <strong>10 minutes</strong>.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Fitness Assist. All rights reserved.
        </p>
      </div>
    `;

    try {
      const client = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: {
            username: gmailUser,
            password: gmailAppPassword,
          },
        },
      });

      await client.send({
        from: `Fitness Assist <${gmailUser}>`,
        to: email,
        subject,
        content: "Please view this email in an HTML-compatible email client.",
        html: htmlContent,
      });

      await client.close();
      
      console.log(`OTP sent successfully to ${email} for ${purpose}`);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Delete the OTP since email failed
      await supabase
        .from("otp_tokens")
        .delete()
        .eq("email", email)
        .eq("otp_code", otpCode);

      return new Response(
        JSON.stringify({ error: "Failed to send verification email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Send OTP error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
