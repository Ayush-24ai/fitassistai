import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LabValue {
  name: string;
  value: number;
  unit?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { labValues }: { labValues: LabValue[] } = await req.json();
    
    if (!labValues || labValues.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide lab values to analyze" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const labValuesText = labValues
      .map(lv => `${lv.name}: ${lv.value}${lv.unit ? ` ${lv.unit}` : ''}`)
      .join('\n');

    const systemPrompt = `You are a health education specialist for Fitness Assist. Analyze lab values and provide educational guidance.

IMPORTANT RULES:
1. You do NOT provide medical diagnosis
2. Always recommend consulting a healthcare provider
3. Provide educational context about what values mean
4. Give practical diet and activity suggestions
5. Be reassuring for normal values, gently informative for abnormal ones

For each lab value provided, respond with a JSON array of objects in this exact format:
{
  "results": [
    {
      "name": "test name",
      "value": number,
      "unit": "unit of measurement",
      "status": "high" | "low" | "normal",
      "normalRange": "X - Y unit",
      "explanation": "What this value means in plain language (2-3 sentences)",
      "dietGuidance": "Specific dietary suggestions (2-3 sentences)",
      "activityGuidance": "Exercise and activity suggestions (2-3 sentences)"
    }
  ]
}

Common reference ranges to use:
- Glucose (fasting): 70-100 mg/dL
- Total Cholesterol: <200 mg/dL
- HDL Cholesterol: >40 mg/dL (men), >50 mg/dL (women)
- LDL Cholesterol: <100 mg/dL
- Triglycerides: <150 mg/dL
- Hemoglobin: 12-17 g/dL
- Blood Pressure Systolic: 90-120 mmHg
- Blood Pressure Diastolic: 60-80 mmHg
- BMI: 18.5-24.9 kg/m²
- Vitamin D: 30-100 ng/mL
- Iron: 60-170 mcg/dL

Use your knowledge for other tests not listed.`;

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
          { role: "user", content: `Analyze these lab values and provide educational guidance:\n${labValuesText}` },
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
    console.error("Health report error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred analyzing your report" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
