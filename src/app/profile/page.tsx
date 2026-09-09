"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";

const inputClass =
  "h-12 w-full rounded-2xl bg-[#EEEDE8] px-3.5 text-[15px] text-[#1A1A16] outline-none placeholder:text-[#8A8780]";

export default function ProfilePage() {
  const { authenticated, openAuth, user, saveProfile, logout, ready } =
    useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
  }, [user]);

  if (!ready) {
    return (
      <div className="bg-[#FAFAF7] px-4 pt-5 pb-8">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.04em] text-[#1A1A16]">
          Account
        </h1>
        <div className="mt-4 space-y-3">
          <div className="h-12 animate-pulse rounded-2xl bg-[#EEEDE8]" />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center bg-[#FAFAF7] px-6 pt-16 text-center">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.03em] text-[#1A1A16]">
          Account
        </h1>
        <p className="mt-2 text-[14px] text-[#8A8780]">
          Sign in to manage your name.
        </p>
        <Button className="mt-5" onClick={() => openAuth("login")}>
          Sign in
        </Button>
      </div>
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveProfile({ name });
      setMessage("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-[#FAFAF7] px-4 pt-5 pb-8">
      <header className="mb-6">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand font-display text-[22px] font-bold text-[#FAFAF7]">
          {(user?.name ?? "You").trim().charAt(0).toUpperCase()}
        </div>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.04em] text-[#1A1A16]">
          Account
        </h1>
        <p className="mt-1 text-[14px] text-[#8A8780]">{user?.phone}</p>
      </header>

      <form onSubmit={onSave} className="space-y-3">
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
        {message ? (
          <p className="text-[13px] font-medium text-success">{message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </form>

      <Button
        className="mt-6 w-full"
        variant="secondary"
        onClick={() => void logout()}
      >
        Log out
      </Button>
    </div>
  );
}
