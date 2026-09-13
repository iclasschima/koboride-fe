"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAdminSettings, useUpdateAdminSettingsMutation } from "@/lib/query/hooks";

export default function AdminSettingsPage() {
  const { data, isPending, isError } = useAdminSettings();
  const save = useUpdateAdminSettingsMutation();
  const [maxActiveOrders, setMaxActiveOrders] = useState("3");
  const [platformCutPercent, setPlatformCutPercent] = useState("15");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setMaxActiveOrders(String(data.maxActiveOrders));
    setPlatformCutPercent(String(data.platformCutPercent ?? 15));
  }, [data]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const cap = Number.parseInt(maxActiveOrders, 10);
    const cut = Number.parseInt(platformCutPercent, 10);
    if (!Number.isInteger(cap) || cap < 1 || cap > 50) {
      setError("Live order cap must be a whole number from 1 to 50.");
      return;
    }
    if (!Number.isInteger(cut) || cut < 0 || cut > 50) {
      setError("Platform cut must be 0–50 percent.");
      return;
    }
    try {
      await save.mutateAsync({
        maxActiveOrders: cap,
        platformCutPercent: cut,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Settings
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Limits you can change without a deploy.
      </p>

      {isPending ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-[#EEEDE8]" />
      ) : isError ? (
        <p className="mt-6 text-[13px] font-medium text-danger">
          Could not load settings.
        </p>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="mt-6 space-y-6 rounded-xl border border-black/6 bg-white px-4 py-5"
        >
          <div>
            <label
              htmlFor="maxActiveOrders"
              className="text-[12px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase"
            >
              Live orders per customer
            </label>
            <input
              id="maxActiveOrders"
              type="number"
              min={1}
              max={50}
              step={1}
              value={maxActiveOrders}
              onChange={(e) => {
                setSaved(false);
                setMaxActiveOrders(e.target.value);
              }}
              className="mt-2 h-11 w-28 rounded-lg bg-[#FAFAF7] px-3 text-[16px] ring-1 ring-black/8 outline-none focus:ring-brand/40"
            />
            <p className="mt-2 text-[13px] text-[#8A8780]">
              A customer cannot start another pickup while they already have this
              many live orders.
            </p>
          </div>

          <div>
            <label
              htmlFor="platformCutPercent"
              className="text-[12px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase"
            >
              Platform cut
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="platformCutPercent"
                type="number"
                min={0}
                max={50}
                step={1}
                value={platformCutPercent}
                onChange={(e) => {
                  setSaved(false);
                  setPlatformCutPercent(e.target.value);
                }}
                className="h-11 w-28 rounded-lg bg-[#FAFAF7] px-3 text-[16px] ring-1 ring-black/8 outline-none focus:ring-brand/40"
              />
              <span className="text-[14px] text-[#8A8780]">%</span>
            </div>
            <p className="mt-2 text-[13px] text-[#8A8780]">
              Taken from each fare when a new order is created. Rider payout is
              the rest. Default is 15%. Already booked jobs keep the cut they
              were quoted with.
            </p>
          </div>

          {error ? (
            <p className="text-[13px] font-medium text-danger">{error}</p>
          ) : saved ? (
            <p className="text-[13px] font-medium text-brand">Saved.</p>
          ) : null}

          <Button type="submit" size="md" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </div>
  );
}
