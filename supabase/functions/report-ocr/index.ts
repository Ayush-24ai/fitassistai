import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT = 10; // max requests per hour
const RATE_WINDOW_MS = 60 * 60 * 1000;

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;

    // Rate limiting
    if (!await checkRateLimit(serviceClient, userId, 'report-ocr')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    await recordRequest(serviceClient, userId, 'report-ocr');

    const { image } = await req.json();

    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit image payload size (~10MB base64)
    if (image.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Please use an image under 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing lab report image for OCR extraction...");

    // Use Lovable AI for OCR-style text extraction
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('AI service not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this medical lab report or health document image. Extract all visible test results and measurements.

Return ONLY a valid JSON object with this structure:
{
  "extractedValues": [
    {
      "name": "Test name (e.g., Glucose, Cholesterol, etc.)",
      "value": "numeric value as string",
      "unit": "unit of measurement",
      "normalRange": "normal range if visible"
    }
  ],
  "documentType": "Type of document (blood test, urine test, etc.)",
  "confidence": "high" or "medium" or "low",
  "notes": "Any important notes or observations from the document"
}

Extract all visible medical metrics including but not limited to:
- Blood sugar/glucose levels
- Cholesterol (total, LDL, HDL, triglycerides)
- Blood pressure readings
- Hemoglobin, RBC, WBC counts
- Liver function tests (ALT, AST, etc.)
- Kidney function (creatinine, BUN, etc.)
- Thyroid hormones
- Vitamin levels
- Any other visible test results

If the image is unclear or not a medical document, return an empty extractedValues array with low confidence.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error('Failed to extract data from image');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log("AI OCR response received, parsing...");

    // Parse the JSON response
    let extractionResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractionResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      extractionResult = {
        extractedValues: [],
        documentType: "Unknown",
        confidence: "low",
        notes: "Unable to extract values from the image. Please try with a clearer image or enter values manually."
      };
    }

    return new Response(
      JSON.stringify(extractionResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Report OCR error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process report image';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
