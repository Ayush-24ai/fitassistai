import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing lab report image for OCR extraction...");

    // Use Lovable AI for OCR-style text extraction
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('AI service not configured');
    }

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
