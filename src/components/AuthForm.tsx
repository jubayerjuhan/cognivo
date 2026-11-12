"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignUp ? { name, email, password } : { email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="card w-full max-w-sm p-6">
      <h1 className="mb-1 text-xl font-bold">{isSignUp ? "Create your account" : "Welcome back"}</h1>
      <p className="mb-5 text-sm text-slate-500">
        {isSignUp ? "Sign up to start using Cognivo." : "Sign in to your Cognivo workspace."}
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        {isSignUp && (
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        )}
        <input className="input" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input className="input" type="password" placeholder="Password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full py-2" disabled={busy} type="submit">
          {busy ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {isSignUp ? (
          <>Already have an account? <Link href="/sign-in" className="text-indigo-600 hover:underline">Sign in</Link></>
        ) : (
          <>No account yet? <Link href="/sign-up" className="text-indigo-600 hover:underline">Sign up</Link></>
        )}
      </p>
    </div>
  );
}
