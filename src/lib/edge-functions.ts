import { supabase } from "./supabase";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function callEdgeFunction<T>(
  name: "customers" | "quotes" | "telegram-order",
  options: { method: Method; body?: Record<string, unknown> }
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, options);
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return (data as { data: T }).data;
}
