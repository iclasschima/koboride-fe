"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { loginAdmin } from "@/lib/api/client";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#EEEDE8] px-3.5 text-[15px] text-[#1A1A16] outline-none placeholder:text-[#8A8780]";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginAdmin(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_16px_48px_rgba(15,61,46,0.12)]"
      >
        <p className="text-[12px] font-semibold tracking-[0.08em] text-[#8A8780] uppercase">
          KoboRide
        </p>
        <h1 className="mt-1 font-display text-[26px] font-semibold tracking-[-0.03em]">
          Ops sign in
        </h1>
        <p className="mt-1 text-[14px] text-[#8A8780]">
          Staff only.
        </p>
        <input
          className={`${inputClass} mt-5`}
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
        <input
          className={`${inputClass} mt-2`}
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={busy}
        />
        {error ? (
          <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
        ) : null}
        <Button type="submit" className="mt-5 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
