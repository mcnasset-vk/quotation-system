import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEY = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
const PUBLISHABLE_KEYS = Object.values(
  JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")!)
) as string[];

const db = createClient(SUPABASE_URL, SECRET_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// One-time bootstrap: creates the first (and only) admin account, then permanently
// refuses further calls once any user exists. Safe to leave deployed.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = req.headers.get("apikey") ?? "";
  if (!PUBLISHABLE_KEYS.includes(apiKey)) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const existing = await db.auth.admin.listUsers();
    if (existing.error) throw existing.error;
    if (existing.data.users.length > 0) {
      return json({ error: "An account already exists. Bootstrap is disabled." }, 403);
    }

    const body = await req.json();
    const { data, error } = await db.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });
    if (error) throw error;

    return json({ data: { id: data.user.id, email: data.user.email } });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
