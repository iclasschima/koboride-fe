"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  KIN_RELATIONSHIPS,
  RIDER_ID_TYPE_OPTIONS,
  type OpsUser,
  type RiderIdType,
} from "@/types/user";
import type { RiderWriteInput } from "@/lib/api/admin";

const inputClass =
  "h-10 w-full rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780]";

export function RiderVerificationForm({
  rider,
  pending,
  submitLabel,
  onSubmit,
}: {
  rider?: OpsUser;
  pending: boolean;
  submitLabel: string;
  onSubmit: (input: RiderWriteInput) => Promise<void>;
}) {
  const [name, setName] = useState(rider?.name ?? "");
  const [phone, setPhone] = useState(rider?.phone ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [idType, setIdType] = useState<RiderIdType>(rider?.idType ?? "nin");
  const [idNumber, setIdNumber] = useState(rider?.idNumber ?? "");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [nextOfKinName, setNextOfKinName] = useState(rider?.nextOfKinName ?? "");
  const [nextOfKinPhone, setNextOfKinPhone] = useState(rider?.nextOfKinPhone ?? "");
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState(
    rider?.nextOfKinRelationship ?? "",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rider) return;
    setName(rider.name);
    setPhone(rider.phone);
    setIdType(rider.idType ?? "nin");
    setIdNumber(rider.idNumber ?? "");
    setNextOfKinName(rider.nextOfKinName ?? "");
    setNextOfKinPhone(rider.nextOfKinPhone ?? "");
    setNextOfKinRelationship(rider.nextOfKinRelationship ?? "");
    setPhoto(null);
    setIdDocument(null);
  }, [rider]);

  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  const idPreview = useMemo(
    () => (idDocument ? URL.createObjectURL(idDocument) : null),
    [idDocument],
  );
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (idPreview) URL.revokeObjectURL(idPreview);
    };
  }, [photoPreview, idPreview]);

  const idHint =
    idType === "nin" ? "11-digit NIN" : "ID number as printed on the document";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const kinName = nextOfKinName.trim();
      const kinPhone = nextOfKinPhone.trim();
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        photo: photo ?? undefined,
        idType: idNumber.trim() ? idType : undefined,
        idNumber: idNumber.trim() || undefined,
        idDocument: idDocument ?? undefined,
        nextOfKinName: kinName || undefined,
        nextOfKinPhone: kinPhone || undefined,
        nextOfKinRelationship:
          kinName || kinPhone || nextOfKinRelationship
            ? nextOfKinRelationship || undefined
            : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save rider");
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      <fieldset>
        <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
          Rider
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={inputClass}
            required
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            inputMode="tel"
            className={inputClass}
            required
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
          Passport photograph
        </legend>
        <p className="mt-1 text-[13px] text-[#8A8780]">
          Optional for now. A clear face photo for the rider app and dispatch.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Avatar
            src={photoPreview ?? rider?.photoUrl}
            name={name || "Rider"}
            className="h-14 w-14 shrink-0 text-[16px]"
          />
          <label className="flex h-10 cursor-pointer items-center rounded-lg bg-[#FAFAF7] px-3 text-[13px] font-medium text-[#5C5A55] ring-1 ring-black/8">
            {photo || rider?.photoUrl ? "Change photo" : "Choose photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          {photo ? (
            <button type="button" className="text-[12px] font-semibold text-[#8A8780]" onClick={() => setPhoto(null)}>
              Remove
            </button>
          ) : null}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
          Government-issued ID
        </legend>
        <p className="mt-1 text-[13px] text-[#8A8780]">
          Optional for now. NIN is preferred. You can add this later on the
          rider profile.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value as RiderIdType)}
            className={inputClass}
          >
            {RIDER_ID_TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder={idHint}
            className={inputClass}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex h-10 cursor-pointer items-center rounded-lg bg-[#FAFAF7] px-3 text-[13px] font-medium text-[#5C5A55] ring-1 ring-black/8">
            {idDocument || rider?.idDocumentUrl ? "Change ID image" : "Upload ID image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              onChange={(e) => setIdDocument(e.target.files?.[0] ?? null)}
            />
          </label>
          {idDocument ? (
            <p className="truncate text-[13px] text-[#8A8780]">{idDocument.name}</p>
          ) : rider?.idDocumentUrl ? (
            <a
              href={rider.idDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] font-semibold text-brand"
            >
              View current ID
            </a>
          ) : null}
        </div>
        {idPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={idPreview}
            alt="ID preview"
            className="mt-3 max-h-40 rounded-lg object-contain"
          />
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
          Next of kin
        </legend>
        <p className="mt-1 text-[13px] text-[#8A8780]">
          Optional for now. Someone we can call if the rider goes dark — not a
          legal guarantor. You can add this later.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={nextOfKinName}
            onChange={(e) => setNextOfKinName(e.target.value)}
            placeholder="Name"
            className={inputClass}
          />
          <input
            value={nextOfKinPhone}
            onChange={(e) => setNextOfKinPhone(e.target.value)}
            placeholder="Phone"
            inputMode="tel"
            className={inputClass}
          />
          <select
            value={nextOfKinRelationship}
            onChange={(e) => setNextOfKinRelationship(e.target.value)}
            className={`${inputClass} sm:col-span-2`}
          >
            <option value="">Relationship</option>
            {KIN_RELATIONSHIPS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}

      <Button type="submit" size="md" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
