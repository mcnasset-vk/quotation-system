"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/quotes/new", label: "Create Quote" },
  { href: "/quotes", label: "Quote Records" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-5 py-5">
        <p className="text-sm font-semibold text-zinc-50">Serenity Co-Living</p>
        <p className="text-xs text-zinc-500">Quotation System</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 px-5 py-4">
        <p className="text-xs font-medium text-zinc-300">Boss Account</p>
        <button
          onClick={handleLogout}
          className="mt-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
