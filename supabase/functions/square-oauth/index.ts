// Follow the Deno deploy instructions at https://deno.com/deploy/docs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ExchangeTokenResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  merchant_id: string;
  refresh_token: string;
  subscription_id?: string;
  plan_id?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Handle the OAuth callback from Square
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
      // Parse the request body to get the authorization code
      const { code, redirectUri } = await req.json();
      
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Authorization code is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      
      // Exchange the authorization code for tokens
      const tokenResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: squareAppId,
          client_secret: squareAppSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Square token exchange error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to exchange authorization code", details: errorData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: tokenResponse.status }
        );
      }
      
      const tokenData: ExchangeTokenResponse = await tokenResponse.json();
      
      // Store the tokens in Supabase
      const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/integrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          provider: "square",
          merchant_id: tokenData.merchant_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: tokenData.expires_at,
          scope: [], // Square doesn't return scopes in the token response, so we can't populate this
          metadata: {
            token_type: tokenData.token_type,
            subscription_id: tokenData.subscription_id,
            plan_id: tokenData.plan_id,
            environment: isSandbox ? "sandbox" : "production"
          }
        }),
      });
      
      if (!supabaseResponse.ok) {
        const errorData = await supabaseResponse.json();
        console.error("Supabase storage error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to store tokens", details: errorData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: supabaseResponse.status }
        );
      }
      
      // Return success response with some basic info (no tokens!)
      return new Response(
        JSON.stringify({
          success: true,
          merchant_id: tokenData.merchant_id,
          expires_at: tokenData.expires_at,
          environment: isSandbox ? "sandbox" : "production"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } 
    
    // Handle GET requests - for testing
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ message: "Square OAuth endpoint ready" }),
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
