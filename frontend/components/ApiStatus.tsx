"use client";

import { useEffect, useState } from "react";

type Health = { status: string; database: "up" | "down"; time: string };
type State =
  | { kind: "loading" }
  | { kind: "ok"; data: Health }
  | { kind: "error"; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ApiStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`API responded with ${res.status}`);
        return res.json() as Promise<Health>;
      })
      .then((data) => setState({ kind: "ok", data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Could not reach the API",
        });
      });
    return () => controller.abort();
  }, []);

  return (
    <div role="status" className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="text-lg font-semibold">Backend connection</h2>
      {state.kind === "loading" && <p className="mt-2 text-zinc-500">Checking…</p>}
      {state.kind === "error" && (
        <p className="mt-2 text-red-700">API unreachable: {state.message}</p>
      )}
      {state.kind === "ok" && (
        <ul className="mt-2 space-y-1 text-zinc-700">
          <li>API: {state.data.status}</li>
          <li>Database: {state.data.database}</li>
          <li className="text-sm text-zinc-500">Server time: {state.data.time}</li>
        </ul>
      )}
    </div>
  );
}
