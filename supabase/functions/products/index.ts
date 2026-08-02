import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = req.headers.get("apikey") ?? "";
  if (!PUBLISHABLE_KEYS.includes(apiKey)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await db.from("products").select("*").order("name");
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { data, error } = await db
        .from("products")
        .insert({ name: body.name, unit_price: body.unit_price })
        .select()
        .single();
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { data, error } = await db
        .from("products")
        .update({ name: body.name, unit_price: body.unit_price })
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "DELETE") {
      const body = await req.json();
      const { error } = await db.from("products").delete().eq("id", body.id);
      if (error) throw error;
      return json({ data: { success: true } });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
