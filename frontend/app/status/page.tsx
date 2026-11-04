import ApiStatus from "@/components/ApiStatus";

// Setup check kept at /status so the Render + Vercel wiring can still be verified. Not linked from the site.
export default function StatusPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Cebu Properties by MCT</h1>
      <p className="text-zinc-600">
        Setup check: this temporary page confirms the frontend can reach the API.
      </p>
      <ApiStatus />
    </main>
  );
}
