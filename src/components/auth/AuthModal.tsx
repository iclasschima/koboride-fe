"use client";

import { useEffect, useId, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#EEEDE8] px-3.5 text-[15px] text-[#1A1A16] outline-none placeholder:text-[#8A8780]";

export function AuthModal() {
  const {
    authOpen,
    closeAuth,
    sendOtp,
    verify,
    saveProfile,
  } = useAuth();
  const titleId = useId();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  useEffect(() => {
    if (!authOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authOpen]);

  useEffect(() => {
    if (authOpen === "login") {
      setStep("phone");
      setError("");
    }
  }, [authOpen]);

  if (!authOpen) return null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await sendOtp(phone);
      if (result.token) return;
      setDevCode(result.devCode ?? "");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verify(phone, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
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
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D5D7DB]"
          aria-hidden
        />

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
            {error ? (
              <p className="text-[13px] font-medium text-danger">{error}</p>
            ) : null}
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? "Saving…" : "Continue"}
            </Button>
          </form>
        ) : step === "phone" ? (
          <form onSubmit={handleSend} className="flex flex-col gap-3">
            <h2
              id={titleId}
              className="text-center font-display text-[26px] font-bold tracking-[-0.03em] text-[#1A1A16]"
            >
              Sign in to KoboRide
            </h2>
            <p className="mb-1 text-center text-[14px] text-[#8A8780]">
              Continue with a phone number. OTP is off for now.
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
            {error ? (
              <p className="text-[13px] font-medium text-danger">{error}</p>
            ) : null}
            <Button type="submit" disabled={busy || !phone.trim()}>
              {busy ? "Signing in…" : "Continue"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <h2
              id={titleId}
              className="text-center font-display text-[26px] font-bold tracking-[-0.03em] text-[#1A1A16]"
            >
              Enter OTP
            </h2>
            <p className="mb-1 text-center text-[14px] text-[#8A8780]">
              Code sent to {phone}
              {devCode ? `. Demo code: ${devCode}` : "."}
            </p>
            <input
              className={`${inputClass} num tracking-[0.24em]`}
              placeholder="5-digit code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={busy}
            />
            {error ? (
              <p className="text-[13px] font-medium text-danger">{error}</p>
            ) : null}
            <Button type="submit" disabled={busy || code.trim().length < 5}>
              {busy ? "Checking…" : "Verify"}
            </Button>
            <button
              type="button"
              className="text-[13px] font-semibold text-brand"
              onClick={() => setStep("phone")}
            >
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
