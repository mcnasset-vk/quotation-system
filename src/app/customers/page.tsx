"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CustomerModal from "@/components/CustomerModal";
import { useData } from "@/lib/data-context";
import { Customer } from "@/lib/types";

export default function CustomersPage() {
  const { customers, quotes, loading, error, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [search, customers]);

  function openAddModal() {
    setEditingCustomer(null);
    setModalOpen(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCustomer(null);
  }

  async function handleSubmit(input: Omit<Customer, "id">) {
    try {
      setActionError(null);
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, input);
      } else {
        await addCustomer(input);
      }
      closeModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(`Delete ${customer.companyName}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setActionError(null);
      await deleteCustomer(customer.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Customers</h1>
          <p className="mt-1 text-sm text-zinc-400">{customers.length} total customers</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={openAddModal}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {(error || actionError) && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error ?? actionError}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-8 text-center text-sm text-zinc-500">
          Loading customers...
        </div>
      ) : (
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3 font-medium">Company Name</th>
              <th className="px-5 py-3 font-medium">Contact Person</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Quotes</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((customer) => {
              const quoteCount = quotes.filter((q) => q.customerId === customer.id).length;
              return (
                <tr key={customer.id} className="text-zinc-300">
                  <td className="px-5 py-3 font-medium text-zinc-100">{customer.companyName}</td>
                  <td className="px-5 py-3">{customer.contactPerson}</td>
                  <td className="px-5 py-3 text-zinc-400">{customer.email}</td>
                  <td className="px-5 py-3 text-zinc-400">{customer.phone}</td>
                  <td className="px-5 py-3 text-zinc-400">{quoteCount}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/quotes/new?customer=${customer.id}`}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        New Quote
                      </Link>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="text-sm text-zinc-400 hover:text-zinc-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                  No customers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {modalOpen && (
        <CustomerModal initial={editingCustomer} onClose={closeModal} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
