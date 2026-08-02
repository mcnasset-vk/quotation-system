import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
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
      const { data, error } = await db
        .from("telegram_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { data, error } = await db
        .from("telegram_orders")
        .update({ status: body.status })
        .eq("id", body.id)
        .select()
        .single();
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const productName: string = body.product_name;
      const quantity: number = body.quantity;

      let match = await db
        .from("products")
        .select("*")
        .ilike("name", productName)
        .limit(1)
        .maybeSingle();

      if (!match.data) {
        const partial = await db
          .from("products")
          .select("*")
          .ilike("name", `%${productName}%`)
          .limit(5);
        if (partial.error) throw partial.error;
        match = {
          data: (partial.data ?? []).sort((a, b) => a.name.length - b.name.length)[0] ?? null,
          error: null,
        };
      }

      if (!match.data) {
        return json({ data: { found: false } });
      }

      const product = match.data;
      const total = quantity * Number(product.unit_price);

      const { error: insertError } = await db.from("telegram_orders").insert({
        chat_id: body.chat_id,
        username: body.username ?? null,
        first_name: body.first_name ?? null,
        product_name: product.name,
        quantity,
        unit_price: product.unit_price,
        total,
        raw_message: body.raw_message,
      });
      if (insertError) throw insertError;

      return json({
        data: {
          found: true,
          product: product.name,
          quantity,
          unitPrice: Number(product.unit_price),
          total,
        },
      });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
