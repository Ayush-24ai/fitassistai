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

    console.log("Processing food image for calorie analysis...");

    // Use Lovable AI to analyze the food image
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('AI service not configured');
    }

    const response = await fetch('https://ai.lovable.dev/api/v1/chat/completions', {
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
                text: `Analyze this food image and provide nutritional estimates. Return ONLY a valid JSON object with this exact structure:
{
  "foodName": "Name of the food item(s)",
  "calories": estimated_calories_number,
  "caloriesMin": minimum_estimate_number,
  "caloriesMax": maximum_estimate_number,
  "confidence": "high" or "medium" or "low",
  "servingSize": "estimated portion description",
  "macros": {
    "protein": grams_number,
    "carbs": grams_number,
    "fat": grams_number
  },
  "healthNotes": ["note 1", "note 2", "note 3"]
}

Be specific about the food identified. Provide realistic calorie ranges based on typical serving sizes. Include relevant health notes about the food.`
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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error('Failed to analyze food image');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from the response (handle potential markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a default response if parsing fails
      analysisResult = {
        foodName: "Unknown Food",
        calories: 200,
        caloriesMin: 150,
        caloriesMax: 300,
        confidence: "low",
        servingSize: "1 serving",
        macros: {
          protein: 10,
          carbs: 25,
          fat: 8
        },
        healthNotes: [
          "Unable to identify the food precisely",
          "Please verify nutritional information manually"
        ]
      };
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Food scanner error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze food image';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
