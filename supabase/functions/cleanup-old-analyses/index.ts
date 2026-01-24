import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    console.log(`Cleaning up analyses older than: ${cutoffDate}`);

    // Delete analyses older than 30 days
    const { data, error, count } = await supabase
      .from('analysis_history')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');

    if (error) {
      console.error('Error deleting old analyses:', error);
      throw error;
    }

    const deletedCount = data?.length || 0;
    console.log(`Successfully deleted ${deletedCount} old analyses`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: deletedCount,
        cutoffDate: cutoffDate 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Cleanup failed" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
