import { QuoteStatus } from "@/lib/types";

const styles: Record<QuoteStatus, string> = {
  Draft: "bg-zinc-800 text-zinc-300 ring-1 ring-inset ring-zinc-700",
  Sent: "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/30",
  Accepted: "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
  Rejected: "bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/30",
};

export default function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
