// Follow the Deno deploy instructions at https://deno.com/deploy/docs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  merchant_id: string;
  refresh_token: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Handle the token refresh for Square
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const squareAppId = Deno.env.get("SQUARE_APP_ID") ?? "";
    const squareAppSecret = Deno.env.get("SQUARE_APP_SECRET") ?? "";
    
    // Determine if we're using sandbox or production
    const isSandbox = squareAppId.startsWith("sandbox-");
    const apiUrl = isSandbox 
      ? "https://connect.squareupsandbox.com/oauth2/token"
      : "https://connect.squareup.com/oauth2/token";
    
    if (req.method === "POST") {
      // Parse the request body to get the merchant ID or integration ID
      const { merchantId, integrationId } = await req.json();
      
      if (!merchantId && !integrationId) {
        return new Response(
          JSON.stringify({ error: "Either merchant ID or integration ID is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      
      // Fetch the refresh token from the database
      let query = `${supabaseUrl}/rest/v1/integrations?provider=eq.square&`;
      if (merchantId) {
        query += `merchant_id=eq.${encodeURIComponent(merchantId)}`;
      } else {
        query += `id=eq.${encodeURIComponent(integrationId)}`;
      }
      
      const fetchResponse = await fetch(query, {
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
      });
      
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
      const refreshToken = integration.refresh_token;
      
      // Refresh the token with Square
      const tokenResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: squareAppId,
          client_secret: squareAppSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Square token refresh error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to refresh token", details: errorData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: tokenResponse.status }
        );
      }
      
      const tokenData: RefreshTokenResponse = await tokenResponse.json();
      
      // Update the tokens in Supabase
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/integrations?id=eq.${integration.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: tokenData.expires_at,
          updated_at: new Date().toISOString(),
        }),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error("Supabase update error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to update tokens", details: errorData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: updateResponse.status }
        );
      }
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          merchant_id: tokenData.merchant_id,
          expires_at: tokenData.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle GET requests for testing
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ message: "Square token refresh endpoint ready" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
