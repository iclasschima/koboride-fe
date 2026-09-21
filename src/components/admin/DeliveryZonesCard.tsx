"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  useAdminZones,
  useCreateAdminZoneMutation,
  useDeleteAdminZoneMutation,
  useUpdateAdminZoneMutation,
} from "@/lib/query/hooks";
import type { PricingZone } from "@/types/user";

type Draft = {
  slug: string;
  name: string;
  centerLat: string;
  centerLng: string;
  radiusKm: string;
  active: boolean;
  adjacentSlugs: string[];
};

const emptyDraft: Draft = {
  slug: "",
  name: "",
  centerLat: "",
  centerLng: "",
  radiusKm: "4",
  active: false,
  adjacentSlugs: [],
};

const fieldClass =
  "h-10 w-full rounded-lg bg-[#FAF8F5] px-3 text-[14px] ring-1 ring-black/8 outline-none focus:ring-brand/40";

function draftFromZone(zone: PricingZone): Draft {
  return {
    slug: zone.slug,
    name: zone.name,
    centerLat: String(zone.centerLat),
    centerLng: String(zone.centerLng),
    radiusKm: String(zone.radiusKm),
    active: zone.active,
    adjacentSlugs: [...zone.adjacentSlugs],
  };
}

function parseDraft(draft: Draft): {
  slug: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  active: boolean;
  adjacentSlugs: string[];
} {
  const name = draft.name.trim();
  const slug = draft.slug.trim().toUpperCase();
  const centerLat = Number(draft.centerLat);
  const centerLng = Number(draft.centerLng);
  const radiusKm = Number(draft.radiusKm);
  if (name.length < 2) throw new Error("Give the zone a name.");
  if (!/^[A-Z0-9]{2,6}$/.test(slug)) {
    throw new Error("Slug must be 2–6 letters or numbers, like YAB.");
  }
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    throw new Error("Paste a map centre (latitude and longitude).");
  }
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 8) {
    throw new Error("Radius must be between 1 and 8 km.");
  }
  return {
    slug,
    name,
    centerLat,
    centerLng,
    radiusKm,
    active: draft.active,
    adjacentSlugs: draft.adjacentSlugs,
  };
}

function ZoneForm({
  draft,
  zones,
  slugLocked,
  pending,
  error,
  onChange,
  onCancel,
  onSave,
  onRemove,
}: {
  draft: Draft;
  zones: PricingZone[];
  slugLocked: boolean;
  pending: boolean;
  error: string;
  onChange: (next: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  onRemove?: () => void;
}) {
  const others = zones.filter((zone) => zone.slug !== draft.slug);
  return (
    <div className="space-y-3 border-t border-black/5 bg-[#FAF8F5]/70 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-medium text-[#8A8780]">Name</span>
          <input
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            className={`mt-1 ${fieldClass}`}
            placeholder="Surulere"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[#8A8780]">Slug</span>
          <input
            value={draft.slug}
            onChange={(e) => onChange({ ...draft, slug: e.target.value.toUpperCase() })}
            className={`mt-1 ${fieldClass}`}
            placeholder="SRL"
            disabled={slugLocked}
            maxLength={6}
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[12px] font-medium text-[#8A8780]">Lat</span>
          <input
            value={draft.centerLat}
            onChange={(e) => onChange({ ...draft, centerLat: e.target.value })}
            className={`mt-1 ${fieldClass}`}
            inputMode="decimal"
            placeholder="6.50"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[#8A8780]">Lng</span>
          <input
            value={draft.centerLng}
            onChange={(e) => onChange({ ...draft, centerLng: e.target.value })}
            className={`mt-1 ${fieldClass}`}
            inputMode="decimal"
            placeholder="3.38"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[#8A8780]">Radius km</span>
          <input
            value={draft.radiusKm}
            onChange={(e) => onChange({ ...draft, radiusKm: e.target.value })}
            className={`mt-1 ${fieldClass}`}
            inputMode="decimal"
            type="number"
            min={1}
            max={8}
            step={0.5}
          />
        </label>
      </div>
      <p className="text-[12px] text-[#8A8780]">
        Centre is the neighbourhood pin. Right-click Google Maps → copy coordinates.
      </p>
      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => onChange({ ...draft, active: e.target.checked })}
        />
        Live for booking
      </label>
      {others.length > 0 ? (
        <fieldset>
          <legend className="text-[12px] font-medium text-[#8A8780]">
            Adjacent zones
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {others.map((zone) => {
              const checked = draft.adjacentSlugs.includes(zone.slug);
              return (
                <label
                  key={zone.slug}
                  className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] ring-1 ring-black/8"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        ...draft,
                        adjacentSlugs: checked
                          ? draft.adjacentSlugs.filter((item) => item !== zone.slug)
                          : [...draft.adjacentSlugs, zone.slug],
                      })
                    }
                  />
                  {zone.name}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="md" disabled={pending} onClick={onSave}>
          {pending ? "Saving…" : "Save zone"}
        </Button>
        <Button type="button" size="md" variant="secondary" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        {onRemove ? (
          <Button
            type="button"
            size="md"
            variant="ghost"
            className="text-danger"
            disabled={pending}
            onClick={onRemove}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function DeliveryZonesCard() {
  const { data: zones, isPending, isError } = useAdminZones();
  const createZone = useCreateAdminZoneMutation();
  const updateZone = useUpdateAdminZoneMutation();
  const deleteZone = useDeleteAdminZoneMutation();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");

  const catalog = zones ?? [];
  const busy = createZone.isPending || updateZone.isPending || deleteZone.isPending;

  function openCreate() {
    setError("");
    setDraft(emptyDraft);
    setEditing("new");
  }

  function openEdit(zone: PricingZone) {
    setError("");
    setDraft(draftFromZone(zone));
    setEditing(zone.slug);
  }

  function close() {
    setEditing(null);
    setError("");
    setDraft(emptyDraft);
  }

  async function save() {
    setError("");
    try {
      const parsed = parseDraft(draft);
      if (editing === "new") {
        await createZone.mutateAsync(parsed);
      } else if (editing) {
        await updateZone.mutateAsync({
          slug: editing,
          input: {
            name: parsed.name,
            centerLat: parsed.centerLat,
            centerLng: parsed.centerLng,
            radiusKm: parsed.radiusKm,
            active: parsed.active,
            adjacentSlugs: parsed.adjacentSlugs,
          },
        });
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save zone");
    }
  }

  async function toggleLive(zone: PricingZone) {
    setError("");
    try {
      await updateZone.mutateAsync({
        slug: zone.slug,
        input: { active: !zone.active },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update zone");
    }
  }

  async function remove(slug: string) {
    if (!window.confirm("Remove this delivery zone?")) return;
    setError("");
    try {
      await deleteZone.mutateAsync(slug);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove zone");
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-black/6 bg-white">
      <div className="border-b border-black/6 px-4 py-3">
        <h2 className="font-display text-[16px] font-semibold">Delivery zones</h2>
        <p className="mt-1 text-[13px] text-[#8A8780]">
          Each live zone has its own bicycle radius and rider pool. Pickup and
          drop-off must be in the same zone, or two adjacent ones.
        </p>
      </div>
      {isPending ? (
        <div className="h-40 animate-pulse bg-[#EFEBE6]" />
      ) : isError ? (
        <p className="px-4 py-4 text-[13px] font-medium text-danger">
          Could not load zones.
        </p>
      ) : (
        <>
          {error && !editing ? (
            <p className="border-b border-black/5 px-4 py-2 text-[13px] font-medium text-danger">
              {error}
            </p>
          ) : null}
          <ul className="divide-y divide-black/5">
            {catalog.map((zone) => (
              <li key={zone.slug}>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() =>
                      editing === zone.slug ? close() : openEdit(zone)
                    }
                  >
                    <p className="font-display text-[15px] font-semibold">
                      {zone.name}{" "}
                      <span className="font-sans text-[12px] font-medium text-[#8A8780]">
                        {zone.slug}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#8A8780]">
                      {zone.radiusKm}km radius
                      {zone.adjacentSlugs.length
                        ? ` · adjacent ${zone.adjacentSlugs.join(", ")}`
                        : ""}
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleLive(zone)}
                    className={
                      zone.active
                        ? "rounded-full bg-[#DCEEE4] px-2 py-0.5 text-[11px] font-semibold text-success"
                        : "rounded-full bg-[#EEEDE8] px-2 py-0.5 text-[11px] font-semibold text-[#8A8780]"
                    }
                  >
                    {zone.active ? "Live" : "Off"}
                  </button>
                </div>
                {editing === zone.slug ? (
                  <ZoneForm
                    draft={draft}
                    zones={catalog}
                    slugLocked
                    pending={busy}
                    error={error}
                    onChange={setDraft}
                    onCancel={close}
                    onSave={() => void save()}
                    onRemove={() => void remove(zone.slug)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          {editing === "new" ? (
            <ZoneForm
              draft={draft}
              zones={catalog}
              slugLocked={false}
              pending={busy}
              error={error}
              onChange={setDraft}
              onCancel={close}
              onSave={() => void save()}
            />
          ) : (
            <div className="border-t border-black/5 px-4 py-3">
              <Button type="button" size="md" variant="secondary" onClick={openCreate}>
                Add zone
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
