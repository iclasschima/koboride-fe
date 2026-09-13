"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { EnableNotifications } from "@/components/notify/EnableNotifications";
import { AddToHomeScreenCard } from "@/components/pwa/AddToHomeScreen";
import { WhatsAppSupport } from "@/components/support/WhatsAppSupport";
import { uploadRiderPhoto } from "@/lib/api/requests";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";

export default function RiderProfilePage() {
  const { user, updateUser, logout } = useRiderAuth();
  const name = user?.name?.trim() || "Rider";
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const result = await uploadRiderPhoto(file);
      updateUser({ photoUrl: result.user.photoUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="bg-[#FAFAF7] px-5 pt-8 pb-8">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="relative"
        aria-label="Upload profile photo"
      >
        <Avatar
          src={user?.photoUrl}
          name={name}
          className="h-16 w-16 text-[22px]"
        />
        <span className="absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1A16] text-[#FAFAF7] shadow-[0_4px_12px_rgba(15,61,46,0.2)]">
          <Camera className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      </button>
      <h1 className="mt-4 font-display text-[28px] font-semibold tracking-[-0.04em]">
        {name}
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">{user?.phone}</p>
      <p className="mt-2 text-[13px] text-[#8A8780]">
        {busy ? "Uploading photo…" : "Tap the photo to change it"}
      </p>
      {error ? (
        <p className="mt-2 text-[13px] font-medium text-danger">{error}</p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-[18px] font-semibold">Notifications</h2>
        <p className="mt-1 text-[14px] text-[#8A8780]">
          Alerts turn on when you sign in or go online.
        </p>
        <EnableNotifications role="rider" />
      </section>

      <AddToHomeScreenCard />

      <WhatsAppSupport className="mt-6" />

      <Button className="mt-3 w-full" variant="secondary" onClick={() => logout()}>
        Log out
      </Button>
    </div>
  );
}
