"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { activatePush, primePushPermission } from "@/lib/push";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#EEEDE8] px-3.5 text-[15px] text-[#1A1A16] outline-none placeholder:text-[#8A8780]";

export function AuthModal() {
  const pathname = usePathname();
  const { authOpen, closeAuth, login, saveProfile } = useAuth();
  const titleId = useId();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authOpen]);

  useEffect(() => {
    if (authOpen === "login") setError("");
  }, [authOpen]);

  if (!authOpen) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/rider")) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      primePushPermission();
      await login(phone);
      void activatePush("customer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveProfile({ name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={closeAuth}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-[28px] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        style={{ animation: "kb-sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D5D7DB]" aria-hidden />

        {authOpen === "profile" ? (
          <form onSubmit={handleProfile} className="flex flex-col gap-3">
            <h2
              id={titleId}
              className="text-center font-display text-[26px] font-bold tracking-[-0.03em] text-[#1A1A16]"
            >
              Finish your profile
            </h2>
            <p className="mb-1 text-center text-[14px] text-[#8A8780]">
              So riders know who they&apos;re picking up for.
            </p>
            <input
              className={inputClass}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={busy}
            />
            {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? "Saving…" : "Continue"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <h2
              id={titleId}
              className="text-center font-display text-[26px] font-bold tracking-[-0.03em] text-[#1A1A16]"
            >
              Sign in to KoboRide
            </h2>
            <p className="mb-1 text-center text-[14px] text-[#8A8780]">
              Continue with a phone number.
            </p>
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
            {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}
            <Button type="submit" disabled={busy || !phone.trim()}>
              {busy ? "Signing in…" : "Continue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
