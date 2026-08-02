"use client";

import { useEffect, useMemo, useState } from "react";
import { callEdgeFunction } from "@/lib/edge-functions";
import { mapTelegramOrder, TelegramOrderRow } from "@/lib/supabase-mappers";
import { OrderStatus, TelegramOrder } from "@/lib/types";

const statusTabs: (OrderStatus | "All")[] = ["All", "New", "Processed"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(amount);
}

function customerLabel(order: TelegramOrder) {
  if (order.firstName && order.username) return `${order.firstName} (@${order.username})`;
  if (order.username) return `@${order.username}`;
  if (order.firstName) return order.firstName;
  return `Chat #${order.chatId}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<TelegramOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus | "All">("All");

  useEffect(() => {
    async function load() {
      try {
        const rows = await callEdgeFunction<TelegramOrderRow[]>("telegram-order", {
          method: "GET",
        });
        setOrders(rows.map(mapTelegramOrder));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders.");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(
    () => (activeTab === "All" ? orders : orders.filter((o) => o.status === activeTab)),
    [orders, activeTab]
  );

  async function markProcessed(order: TelegramOrder) {
    try {
      setError(null);
      await callEdgeFunction("telegram-order", {
        method: "PATCH",
        body: { id: order.id, status: "Processed" },
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "Processed" } : o))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Orders</h1>
        <p className="mt-1 text-sm text-zinc-400">{orders.length} orders received via Telegram</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

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
                ({orders.filter((o) => o.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-8 text-center text-sm text-zinc-500">
          Loading orders...
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Unit Price</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((order) => (
                <tr key={order.id} className="text-zinc-300">
                  <td className="px-5 py-3 text-zinc-400">
                    {new Date(order.createdAt).toLocaleString("en-SG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-3">{customerLabel(order)}</td>
                  <td className="px-5 py-3 font-medium text-zinc-100">{order.productName}</td>
                  <td className="px-5 py-3">{order.quantity}</td>
                  <td className="px-5 py-3">{formatCurrency(order.unitPrice)}</td>
                  <td className="px-5 py-3">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        order.status === "Processed"
                          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30"
                          : "bg-zinc-800 text-zinc-300 ring-1 ring-inset ring-zinc-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {order.status === "New" && (
                      <button
                        onClick={() => markProcessed(order)}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        Mark Processed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-500">
                    No orders in this status.
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
