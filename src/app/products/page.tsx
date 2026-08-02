"use client";

import { useEffect, useState } from "react";
import ProductModal from "@/components/ProductModal";
import { callEdgeFunction } from "@/lib/edge-functions";
import { mapProduct, ProductRow } from "@/lib/supabase-mappers";
import { Product } from "@/lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(amount);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await callEdgeFunction<ProductRow[]>("products", { method: "GET" });
        setProducts(rows.map(mapProduct));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products.");
      }
      setLoading(false);
    }
    load();
  }, []);

  function openAddModal() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  async function handleSubmit(input: Omit<Product, "id">) {
    try {
      setError(null);
      if (editingProduct) {
        const row = await callEdgeFunction<ProductRow>("products", {
          method: "PATCH",
          body: { id: editingProduct.id, name: input.name, unit_price: input.unitPrice },
        });
        const updated = mapProduct(row);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const row = await callEdgeFunction<ProductRow>("products", {
          method: "POST",
          body: { name: input.name, unit_price: input.unitPrice },
        });
        setProducts((prev) => [...prev, mapProduct(row)].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setError(null);
      await callEdgeFunction("products", { method: "DELETE", body: { id: product.id } });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Products</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {products.length} products — used for Telegram order price lookup
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-8 text-center text-sm text-zinc-500">
          Loading products...
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Product Name</th>
                <th className="px-5 py-3 font-medium">Unit Price</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((product) => (
                <tr key={product.id} className="text-zinc-300">
                  <td className="px-5 py-3 font-medium text-zinc-100">{product.name}</td>
                  <td className="px-5 py-3">{formatCurrency(product.unitPrice)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-sm text-zinc-400 hover:text-zinc-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-zinc-500">
                    No products yet. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ProductModal initial={editingProduct} onClose={closeModal} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
