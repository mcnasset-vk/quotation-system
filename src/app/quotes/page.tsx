"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { generateQuotePdf } from "@/lib/generate-quote-pdf";
import { useData } from "@/lib/data-context";
import { QuoteStatus, quoteTotal } from "@/lib/types";

const statusTabs: (QuoteStatus | "All")[] = ["All", "Draft", "Sent", "Accepted", "Rejected"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(amount);
}

export default function QuoteRecordsPage() {
  const { quotes, customers, loading, error } = useData();
  const [activeTab, setActiveTab] = useState<QuoteStatus | "All">("All");

  const filtered = useMemo(() => {
    const list = activeTab === "All" ? quotes : quotes.filter((q) => q.status === activeTab);
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [activeTab, quotes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Quote Records</h1>
          <p className="mt-1 text-sm text-zinc-400">{quotes.length} quotes total</p>
        </div>
        <Link
          href="/quotes/new"
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          + Create Quote
        </Link>
      </div>

      <div className="flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            {tab}
            {tab !== "All" && (
              <span className="ml-1.5 text-xs text-zinc-500">
                ({quotes.filter((q) => q.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-8 text-center text-sm text-zinc-500">
          Loading quotes...
        </div>
      ) : (
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Quote #</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((quote) => {
              const customer = customers.find((c) => c.id === quote.customerId);
              return (
                <tr key={quote.id} className="text-zinc-300">
                  <td className="px-5 py-3 font-medium text-zinc-100">{quote.quoteNumber}</td>
                  <td className="px-5 py-3">{customer?.companyName ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-400">{quote.createdAt}</td>
                  <td className="px-5 py-3 text-zinc-400">{quote.items.length}</td>
                  <td className="px-5 py-3">{formatCurrency(quoteTotal(quote))}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={quote.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => generateQuotePdf(quote, customer)}
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                  No quotes in this status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
