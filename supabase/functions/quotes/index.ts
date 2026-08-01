import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

interface QuoteItemInput {
  description: string;
  quantity: number;
  unit_price: number;
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
        .from("quotes")
        .select("*, quote_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { data: quote, error: quoteError } = await db
        .from("quotes")
        .insert({
          quote_number: body.quote_number,
          customer_id: body.customer_id || null,
          status: body.status,
          quote_date: body.quote_date,
        })
        .select()
        .single();
      if (quoteError) throw quoteError;

      const items: QuoteItemInput[] = body.items ?? [];
      const { data: itemRows, error: itemsError } = await db
        .from("quote_items")
        .insert(
          items.map((item) => ({
            quote_id: quote.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }))
        )
        .select();
      if (itemsError) throw itemsError;

      return json({ data: { ...quote, quote_items: itemRows } });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
