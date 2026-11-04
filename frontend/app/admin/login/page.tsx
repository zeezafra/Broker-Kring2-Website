import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="font-sans text-sm uppercase tracking-[0.2em] text-gold-dark">Cebu Properties by MCT</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold">Admin login</h1>
      <p className="mt-2 text-muted">For Marie Chris and Zee only.</p>
      <LoginForm />
    </main>
  );
}
