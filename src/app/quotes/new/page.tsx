import { Suspense } from "react";
import QuoteForm from "@/components/QuoteForm";

export default function NewQuotePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Create Quote</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Pick a customer, add line items, and the total is calculated automatically.
        </p>
      </div>
      <Suspense fallback={null}>
        <QuoteForm />
      </Suspense>
    </div>
  );
}
