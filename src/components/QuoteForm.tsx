"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { commonQuoteItems } from "@/lib/mock-data";
import { generateQuotePdf } from "@/lib/generate-quote-pdf";
import { useData } from "@/lib/data-context";
import { Quote, QuoteItem, QuoteStatus } from "@/lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(amount);
}

let nextId = 100;
function newItemId() {
  nextId += 1;
  return `new-item-${nextId}`;
}

export default function QuoteForm() {
  const { customers, loading, addQuote } = useData();
  const searchParams = useSearchParams();
  const preselectedCustomer = searchParams.get("customer") ?? "";

  const [customerId, setCustomerId] = useState(preselectedCustomer);
  const [status, setStatus] = useState<QuoteStatus>("Draft");
  const [items, setItems] = useState<QuoteItem[]>([
    { id: newItemId(), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [savedQuote, setSavedQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function updateItem(id: string, patch: Partial<QuoteItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { id: newItemId(), description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const quoteNumber = `QT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      const quote = await addQuote({
        quoteNumber,
        customerId,
        items,
        status,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setSavedQuote(quote);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startNewQuote() {
    setCustomerId("");
    setStatus("Draft");
    setItems([{ id: newItemId(), description: "", quantity: 1, unitPrice: 0 }]);
    setSavedQuote(null);
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-8 text-center text-sm text-zinc-500">
        Loading customers...
      </div>
    );
  }

  if (savedQuote) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-sm font-medium text-emerald-400">Quote saved — view it in Quote Records</p>
        <p className="mt-2 text-2xl font-semibold text-zinc-50">{savedQuote.quoteNumber}</p>
        <p className="mt-1 text-sm text-zinc-400">Total: {formatCurrency(total)}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() =>
              generateQuotePdf(
                savedQuote,
                customers.find((c) => c.id === savedQuote.customerId)
              )
            }
            className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
          >
            Export PDF
          </button>
          <button
            onClick={startNewQuote}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Create Another Quote
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-300">Customer</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="" disabled>
                Select a customer...
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} — {c.contactPerson}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Line Items</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          <div className="grid grid-cols-12 gap-3 px-5 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <div className="col-span-6">Description</div>
            <div className="col-span-2">Quantity</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2 text-right">Line Total</div>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
              <div className="col-span-6">
                <input
                  required
                  list="quote-item-suggestions"
                  type="text"
                  placeholder="e.g. Private Room - Monthly Rate"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <input
                  required
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) })}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2 flex items-center justify-end gap-3">
                <span className="text-sm text-zinc-300">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="text-zinc-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-800 px-5 py-3">
          <button
            type="button"
            onClick={addItem}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            + Add Item
          </button>
        </div>
        <datalist id="quote-item-suggestions">
          {commonQuoteItems.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4">
        <span className="text-sm font-medium text-zinc-400">Grand Total</span>
        <span className="text-2xl font-semibold text-zinc-50">{formatCurrency(total)}</span>
      </div>

      {submitError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Quote"}
        </button>
      </div>
    </form>
  );
}
