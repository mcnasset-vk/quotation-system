"use client";

import Link from "next/link";
import AnalysisPanel from "@/components/AnalysisPanel";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { useData } from "@/lib/data-context";
import { quoteTotal } from "@/lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-SG", {
    month: "long",
    year: "numeric",
  });
}

export default function Home() {
  const { customers, quotes, loading, error } = useData();

  const latestMonth =
    quotes.length === 0
      ? new Date().toISOString().slice(0, 7)
      : quotes.reduce(
          (max, q) => (q.createdAt.slice(0, 7) > max ? q.createdAt.slice(0, 7) : max),
          quotes[0].createdAt.slice(0, 7)
        );

  const quotesThisMonth = quotes.filter((q) => q.createdAt.startsWith(latestMonth));
  const closedQuotes = quotes.filter((q) => q.status === "Accepted" || q.status === "Rejected");
  const pendingQuotes = quotes.filter((q) => q.status === "Draft" || q.status === "Sent");

  const recentQuotes = [...quotes]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Overview for {formatMonthLabel(latestMonth)}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          + Create Quote
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-8 text-center text-sm text-zinc-500">
          Loading dashboard...
        </div>
      ) : (
      <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Quotes This Month"
          value={quotesThisMonth.length}
          hint={formatMonthLabel(latestMonth)}
        />
        <StatCard
          label="Closed"
          value={closedQuotes.length}
          hint="Accepted + Rejected"
        />
        <StatCard
          label="Pending"
          value={pendingQuotes.length}
          hint="Draft + Sent"
        />
        <StatCard label="Total Customers" value={customers.length} />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Recent Quotes</h2>
          <Link href="/quotes" className="text-sm text-indigo-400 hover:text-indigo-300">
            View all
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Quote #</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {recentQuotes.map((quote) => {
              const customer = customers.find((c) => c.id === quote.customerId);
              return (
                <tr key={quote.id} className="text-zinc-300">
                  <td className="px-5 py-3 font-medium text-zinc-100">{quote.quoteNumber}</td>
                  <td className="px-5 py-3">{customer?.companyName ?? "—"}</td>
                  <td className="px-5 py-3 text-zinc-400">{quote.createdAt}</td>
                  <td className="px-5 py-3">{formatCurrency(quoteTotal(quote))}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={quote.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnalysisPanel />
      </>
      )}
    </div>
  );
}
