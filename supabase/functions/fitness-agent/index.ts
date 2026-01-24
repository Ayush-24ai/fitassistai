import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FitnessProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
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
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

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

    const profile: FitnessProfile = await req.json();
    
    if (!profile.age || !profile.height || !profile.weight) {
      return new Response(
        JSON.stringify({ error: "Please provide complete profile information" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate base metrics
    const heightInMeters = profile.height / 100;
    const bmi = Math.round((profile.weight / (heightInMeters * heightInMeters)) * 10) / 10;
    
    let bmiCategory = "Normal";
    if (bmi < 18.5) bmiCategory = "Underweight";
    else if (bmi >= 25 && bmi < 30) bmiCategory = "Overweight";
    else if (bmi >= 30) bmiCategory = "Obese";

    // BMR calculation (Mifflin-St Jeor)
    let bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
    bmr += profile.gender === "male" ? 5 : -161;

    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = Math.round(bmr * (activityMultipliers[profile.activityLevel] || 1.55));

    const systemPrompt = `You are a certified personal trainer and nutritionist for Fitness Assist. Create personalized fitness and nutrition plans.

User Profile:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- BMI: ${bmi} (${bmiCategory})
- Activity Level: ${profile.activityLevel}
- Goal: ${profile.goal}
- Calculated TDEE: ${tdee} calories/day

Respond with a JSON object in this exact format:
{
  "recommendedCalories": number (based on goal: -500 for lose, +300 for gain, TDEE for maintain),
  "proteinTarget": number (grams, calculate as 1.6-2.2g per kg body weight based on goal),
  "carbsTarget": number (grams),
  "fatTarget": number (grams),
  "workoutPlan": ["4-5 specific workout recommendations based on goal"],
  "mealSuggestions": ["4-5 specific meal suggestions with foods"],
  "weeklySchedule": {
    "monday": "workout focus",
    "tuesday": "workout focus",
    "wednesday": "workout focus",
    "thursday": "workout focus",
    "friday": "workout focus",
    "saturday": "workout focus",
    "sunday": "rest or active recovery"
  },
  "tips": ["3-4 personalized tips based on their profile and goal"]
}

Be specific and actionable. Tailor recommendations to their exact profile.`;

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
          { role: "user", content: `Create a personalized fitness and nutrition plan for me.` },
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

    const aiResult = JSON.parse(content);

    // Merge calculated values with AI response
    const result = {
      bmi,
      bmiCategory,
      bmr: Math.round(bmr),
      tdee,
      ...aiResult,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fitness agent error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred generating your plan" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
