import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT = 10; // max requests per hour
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(serviceClient: any, userId: string, endpoint: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await serviceClient
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('requested_at', windowStart);
  return (count ?? 0) < RATE_LIMIT;
}

async function recordRequest(serviceClient: any, userId: string, endpoint: string) {
  await serviceClient.from('api_rate_limits').insert({ user_id: userId, endpoint });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Rate limiting
    if (!await checkRateLimit(serviceClient, userId, 'symptom-checker')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    await recordRequest(serviceClient, userId, 'symptom-checker');

    const { symptoms } = await req.json();
    
    if (!symptoms || typeof symptoms !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedSymptoms = symptoms.trim();

    if (trimmedSymptoms.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide symptoms to analyze" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedSymptoms.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Symptoms description too long. Please limit to 2000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medical triage assistant for Fitness Assist. Analyze symptoms and provide guidance. 

IMPORTANT RULES:
1. You do NOT provide medical diagnosis
2. Always recommend professional consultation
3. Be empathetic but clear about severity
4. For emergency symptoms, clearly indicate immediate action needed

Respond with a JSON object in this exact format:
{
  "severity": "emergency" | "urgent" | "moderate" | "mild",
  "doctorType": "recommended specialist or care type",
  "precautions": ["list of 3-4 precautions"],
  "doActions": ["list of 3-4 recommended actions"],
  "avoidActions": ["list of 3-4 things to avoid"],
  "explanation": "Brief explanation of assessment (2-3 sentences)"
}

Emergency indicators: chest pain, difficulty breathing, stroke symptoms, severe bleeding, loss of consciousness, severe allergic reaction, suicidal thoughts.

For emergencies, doctorType should be "Emergency Room / Call 911".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze these symptoms and provide guidance: ${trimmedSymptoms}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Symptom checker error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred analyzing symptoms" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
