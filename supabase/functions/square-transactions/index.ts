// Follow the Deno deploy instructions at https://deno.com/deploy/docs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Handle retrieving transactions from Square
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      const missing = [];
      if (!supabaseUrl) missing.push("SUPABASE_URL");
      if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: `Missing environment variables: ${missing.join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Only allow GET requests
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }
    
    // Parse the query parameters
    const url = new URL(req.url);
    const merchantId = url.searchParams.get("merchantId");
    
    if (!merchantId) {
      return new Response(
        JSON.stringify({ error: "Merchant ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Fetch the access token from the database
    const fetchResponse = await fetch(
      `${supabaseUrl}/rest/v1/integrations?provider=eq.square&merchant_id=eq.${encodeURIComponent(merchantId)}`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json();
      console.error("Supabase fetch error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch integration data", details: errorData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: fetchResponse.status }
      );
    }
    
    const integrations = await fetchResponse.json();
    if (!integrations.length) {
      return new Response(
        JSON.stringify({ error: "No matching integration found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    const integration = integrations[0];
    const accessToken = integration.access_token;
    const isSandbox = integration.metadata?.environment === "sandbox";
    
    // Check if the token has expired
    if (new Date(integration.token_expiry) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Access token has expired, please refresh" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    // Make the request to Square API to fetch transactions
    const baseUrl = isSandbox 
      ? "https://connect.squareupsandbox.com" 
      : "https://connect.squareup.com";
    
    // This is a simplified example - in a real app, you'd specify date ranges, pagination, etc.
    const transactionsResponse = await fetch(`${baseUrl}/v2/payments`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2023-10-18", // Use the appropriate version
      },
    });
    
    if (!transactionsResponse.ok) {
      const errorData = await transactionsResponse.json();
      console.error("Square API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Square transactions", details: errorData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: transactionsResponse.status }
      );
    }
    
    const transactionsData = await transactionsResponse.json();
    
    // Return the transactions data
    return new Response(
      JSON.stringify({
        success: true,
        data: transactionsData,
        environment: isSandbox ? "sandbox" : "production"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});