"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Admin = { id: number; email: string; name: string };
type Summary = { properties: { total: number; byStatus: Record<string, number>; placeholders: number } };
type State =
  | { kind: "loading" }
  | { kind: "ready"; admin: Admin; summary: Summary | null }
  | { kind: "error"; message: string };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const meRes = await fetch("/api/auth/me", { signal });
        if (meRes.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!meRes.ok) throw new Error(`Server responded with ${meRes.status}`);
        const { admin } = (await meRes.json()) as { admin: Admin };

        const sumRes = await fetch("/api/admin/summary", { signal });
        if (sumRes.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const summary = sumRes.ok ? ((await sumRes.json()) as Summary) : null;
        setState({ kind: "ready", admin, summary });
      } catch (err) {
        if (signal.aborted) return;
        setState({ kind: "error", message: err instanceof Error ? err.message : "Could not reach the server" });
      }
    }
    load();
    return () => controller.abort();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
  }

  if (state.kind === "loading") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p role="status" className="text-muted">Checking your session…</p>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p role="alert" className="text-red-700">Could not load the admin area: {state.message}</p>
      </main>
    );
  }

  const { admin, summary } = state;
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gold-dark">Cebu Properties by MCT</p>
          <h1 className="mt-1 font-serif text-4xl font-semibold">Welcome, {admin.name}</h1>
          <p className="mt-1 text-muted">{admin.email}</p>
        </div>
        <button onClick={logout} className="rounded-full border border-gold px-5 py-2 text-sm font-semibold text-gold-dark hover:bg-white">
          Log out
        </button>
      </div>

      <section className="mt-10 rounded-2xl bg-white p-7 shadow-card">
        <h2 className="font-serif text-2xl font-semibold">Listings</h2>
        {summary ? (
          <>
            <p className="mt-2 text-muted">
              {summary.properties.total} total, including drafts that visitors cannot see.
              {summary.properties.placeholders > 0 && ` ${summary.properties.placeholders} are placeholders.`}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {Object.entries(summary.properties.byStatus).map(([status, count]) => (
                <li key={status} className="rounded-full bg-cream px-4 py-1.5 text-sm">
                  {STATUS_LABELS[status] ?? status}: <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-muted">Listing counts are unavailable right now.</p>
        )}
        <Link href="/admin/properties" className="gold-btn mt-6 inline-block">
          Manage listings
        </Link>
      </section>
    </main>
  );
}
