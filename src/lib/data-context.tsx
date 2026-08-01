"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { callEdgeFunction } from "./edge-functions";
import { CustomerRow, mapCustomer, mapQuote, QuoteRow } from "./supabase-mappers";
import { Customer, Quote } from "./types";

interface DataContextValue {
  customers: Customer[];
  quotes: Quote[];
  loading: boolean;
  error: string | null;
  addCustomer: (input: Omit<Customer, "id">) => Promise<Customer>;
  updateCustomer: (id: string, input: Omit<Customer, "id">) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addQuote: (input: Omit<Quote, "id">) => Promise<Quote>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [customerRows, quoteRows] = await Promise.all([
          callEdgeFunction<CustomerRow[]>("customers", { method: "GET" }),
          callEdgeFunction<QuoteRow[]>("quotes", { method: "GET" }),
        ]);
        setCustomers(customerRows.map(mapCustomer));
        setQuotes(quoteRows.map(mapQuote));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data.");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function addCustomer(input: Omit<Customer, "id">) {
    const row = await callEdgeFunction<CustomerRow>("customers", {
      method: "POST",
      body: {
        company_name: input.companyName,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
      },
    });
    const customer = mapCustomer(row);
    setCustomers((prev) => [customer, ...prev]);
    return customer;
  }

  async function updateCustomer(id: string, input: Omit<Customer, "id">) {
    await callEdgeFunction<CustomerRow>("customers", {
      method: "PATCH",
      body: {
        id,
        company_name: input.companyName,
        contact_person: input.contactPerson,
        email: input.email,
        phone: input.phone,
      },
    });
    setCustomers((prev) => prev.map((c) => (c.id === id ? { id, ...input } : c)));
  }

  async function deleteCustomer(id: string) {
    await callEdgeFunction("customers", { method: "DELETE", body: { id } });
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  async function addQuote(input: Omit<Quote, "id">) {
    const row = await callEdgeFunction<QuoteRow>("quotes", {
      method: "POST",
      body: {
        quote_number: input.quoteNumber,
        customer_id: input.customerId || null,
        status: input.status,
        quote_date: input.createdAt,
        items: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      },
    });
    const quote = mapQuote(row);
    setQuotes((prev) => [quote, ...prev]);
    return quote;
  }

  const value = useMemo(
    () => ({ customers, quotes, loading, error, addCustomer, updateCustomer, deleteCustomer, addQuote }),
    [customers, quotes, loading, error]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
