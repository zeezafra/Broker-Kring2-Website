"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

type Admin = { id: number; email: string; name: string };

// Wraps an admin page: confirms the session with the API (redirects to login if it is gone),
// then shows a slim top bar with navigation and log out.
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    adminFetch<{ admin: Admin }>("/api/auth/me")
      .then((r) => alive && setAdmin(r.admin))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
  }

  if (failed) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p role="alert" className="text-red-700">Could not load the admin area. Refresh the page or log in again.</p>
      </main>
    );
  }
  if (!admin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p role="status" className="text-muted">Checking your session…</p>
      </main>
    );
  }

  return (
    <>
      <div className="border-b border-[#e8e3dc] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 text-sm">
          <Link href="/admin" className="font-serif text-lg font-semibold">Admin</Link>
          <Link href="/admin/properties" className="font-semibold text-gold-dark hover:underline">Listings</Link>
          <Link href="/" className="text-muted hover:underline" target="_blank">View site</Link>
          <span className="ml-auto text-muted">{admin.name}</span>
          <button onClick={logout} className="rounded-full border border-gold px-4 py-1.5 font-semibold text-gold-dark hover:bg-cream">
            Log out
          </button>
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </>
  );
}
