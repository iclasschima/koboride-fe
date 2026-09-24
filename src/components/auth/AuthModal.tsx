"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { NigeriaPhoneField } from "@/components/auth/NigeriaPhoneField";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { NG_PHONE_ERROR, normalizeNgPhone } from "@/lib/phone";
import { activatePush, primePushPermission } from "@/lib/push";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#EEEDE8] px-3.5 text-[15px] text-[#1A1A16] outline-none placeholder:text-[#8A8780]";

const titleClass =
  "text-center font-display text-[26px] font-bold tracking-[-0.03em] text-[#1A1A16]";

const RESEND_SECONDS = 60;

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function AuthModal() {
  const pathname = usePathname();
  const { authOpen, closeAuth } = useAuth();
  const titleId = useId();

  useEffect(() => {
    if (!authOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authOpen]);

  if (!authOpen) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/rider")) return null;

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
          <ProfileForm titleId={titleId} />
        ) : (
          <LoginForm titleId={titleId} />
        )}
      </div>
    </div>
  );
}

function LoginForm({ titleId }: { titleId: string }) {
  const { sendOtp, verify } = useAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const e164 = normalizeNgPhone(phone);
  const resendIn = resendAt ? Math.max(0, Math.ceil((resendAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!resendAt) return;
    const id = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      if (next >= resendAt) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendAt]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!e164) {
      setError(NG_PHONE_ERROR);
      return;
    }
    setBusy(true);
    setError("");
    try {
      primePushPermission();
      const result = await sendOtp(e164);
      setDevCode(result.devCode ?? "");
      setCode("");
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
      setNow(Date.now());
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!e164 || code.length !== 4) return;
    setBusy(true);
    setError("");
    try {
      const user = await verify(e164, code);
      void activatePush(user.isRider ? "rider" : "customer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code");
    } finally {
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={onVerify} className="flex flex-col gap-3">
        <h2 id={titleId} className={titleClass}>
          Enter the code
        </h2>
        <p className="mb-1 text-center text-[14px] text-[#8A8780]">
          {`We sent a 4-digit code to +234 ${phone}.${devCode ? ` Demo code: ${devCode}.` : ""}`}
        </p>
        <input
          className={`${inputClass} text-center tracking-[0.28em]`}
          placeholder="••••"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
            if (error) setError("");
          }}
          required
          disabled={busy}
          aria-label="Verification code"
        />
        {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}
        <Button type="submit" disabled={busy || code.length !== 4}>
          {busy ? "Checking…" : "Verify"}
        </Button>
        <div className="flex items-center justify-between text-[13px] font-semibold">
          <button
            type="button"
            className="text-[#8A8780]"
            disabled={busy}
            onClick={() => {
              setStep("phone");
              setError("");
              setCode("");
            }}
          >
            Change number
          </button>
          <button
            type="button"
            className={resendIn > 0 ? "text-[#8A8780]" : "text-brand"}
            disabled={busy || resendIn > 0}
            onClick={() => void onSend()}
          >
            {resendIn > 0
              ? `Resend in ${formatCountdown(resendIn)}`
              : busy
                ? "Sending…"
                : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onSend} className="flex flex-col gap-3">
      <h2 id={titleId} className={titleClass}>
        Sign in to KoboRide
      </h2>
      <p className="mb-1 text-center text-[14px] text-[#8A8780]">
        We&apos;ll text you a code to confirm this number.
      </p>
      <NigeriaPhoneField
        value={phone}
        onChange={(next) => {
          setPhone(next);
          if (error) setError("");
        }}
        disabled={busy}
      />
      {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}
      <Button type="submit" disabled={busy || !e164}>
        {busy ? "Sending…" : "Send code"}
      </Button>
    </form>
  );
}

function ProfileForm({ titleId }: { titleId: string }) {
  const { saveProfile } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
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
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h2 id={titleId} className={titleClass}>
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
  );
}
