"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#EEEDE8] px-3.5 text-[15px] text-[#1A1A16] outline-none placeholder:text-[#8A8780]";

export default function RiderLoginPage() {
  const router = useRouter();
  const { login } = useRiderAuth();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(phone);
      router.replace("/rider");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-5 py-10">
      <p className="text-center text-[12px] font-semibold tracking-[0.08em] text-[#8A8780] uppercase">
        Rider
      </p>
      <h1 className="mt-1 text-center font-display text-[26px] font-semibold tracking-[-0.03em]">
        Sign in to ride
      </h1>
      <p className="mt-2 text-center text-[14px] text-[#8A8780]">
        Use the phone number ops registered for you.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <input
          className={inputClass}
          placeholder="Phone number"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={busy}
        />
        {error ? (
          <p className="text-[13px] font-medium text-danger">{error}</p>
        ) : null}
        <Button type="submit" disabled={busy || !phone.trim()}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
