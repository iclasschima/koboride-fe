"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DeliveryZonesCard } from "@/components/admin/DeliveryZonesCard";
import { useAdminSettings, useUpdateAdminSettingsMutation } from "@/lib/query/hooks";

export default function AdminSettingsPage() {
  const { data, isPending, isError } = useAdminSettings();
  const save = useUpdateAdminSettingsMutation();
  const [maxActiveOrders, setMaxActiveOrders] = useState("3");
  const [platformCutPercent, setPlatformCutPercent] = useState("15");
  const [baseFeeNgn, setBaseFeeNgn] = useState("400");
  const [perKmFeeNgn, setPerKmFeeNgn] = useState("250");
  const [minFareNgn, setMinFareNgn] = useState("650");
  const [onlinePaymentDiscountNgn, setOnlinePaymentDiscountNgn] = useState("50");
  const [stillLookingAfterMinutes, setStillLookingAfterMinutes] = useState("8");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setMaxActiveOrders(String(data.maxActiveOrders));
    setPlatformCutPercent(String(data.platformCutPercent ?? 15));
    setBaseFeeNgn(String(data.baseFeeNgn ?? 400));
    setPerKmFeeNgn(String(data.perKmFeeNgn ?? 250));
    setMinFareNgn(String(data.minFareNgn ?? 650));
    setOnlinePaymentDiscountNgn(String(data.onlinePaymentDiscountNgn ?? 50));
    setStillLookingAfterMinutes(String(data.stillLookingAfterMinutes ?? 8));
  }, [data]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const cap = Number.parseInt(maxActiveOrders, 10);
    const cut = Number.parseInt(platformCutPercent, 10);
    const base = Number.parseInt(baseFeeNgn, 10);
    const perKm = Number.parseInt(perKmFeeNgn, 10);
    const minFare = Number.parseInt(minFareNgn, 10);
    const onlineDiscount = Number.parseInt(onlinePaymentDiscountNgn, 10);
    const proposeAfter = Number.parseInt(stillLookingAfterMinutes, 10);
    if (!Number.isInteger(cap) || cap < 1 || cap > 50) {
      setError("Live order cap must be a whole number from 1 to 50.");
      return;
    }
    if (!Number.isInteger(cut) || cut < 0 || cut > 50) {
      setError("Platform cut must be 0–50 percent.");
      return;
    }
    if (!Number.isInteger(base) || base < 0 || base > 50_000) {
      setError("Base fare must be 0–50,000.");
      return;
    }
    if (!Number.isInteger(perKm) || perKm < 0 || perKm > 50_000) {
      setError("Per-km rate must be 0–50,000.");
      return;
    }
    if (!Number.isInteger(minFare) || minFare < 0 || minFare > 50_000) {
      setError("Minimum fare must be 0–50,000.");
      return;
    }
    if (!Number.isInteger(onlineDiscount) || onlineDiscount < 0 || onlineDiscount > 5_000) {
      setError("Online discount must be 0–5,000.");
      return;
    }
    if (!Number.isInteger(proposeAfter) || proposeAfter < 1 || proposeAfter > 120) {
      setError("Offer-after wait must be 1–120 minutes.");
      return;
    }
    try {
      await save.mutateAsync({
        maxActiveOrders: cap,
        platformCutPercent: cut,
        baseFeeNgn: base,
        perKmFeeNgn: perKm,
        minFareNgn: minFare,
        onlinePaymentDiscountNgn: onlineDiscount,
        stillLookingAfterMinutes: proposeAfter,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    }
  }

  const inputClass =
    "h-11 w-28 rounded-lg bg-[#FAF8F5] px-3 text-[16px] ring-1 ring-black/8 outline-none focus:ring-brand/40";

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Settings
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Limits you can change without a deploy.
      </p>

      <DeliveryZonesCard />

      {isPending ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-[#EFEBE6]" />
      ) : isError ? (
        <p className="mt-6 text-[13px] font-medium text-danger">
          Could not load settings.
        </p>
      ) : (
        <>
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
                className={`mt-2 ${inputClass}`}
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
                  className={inputClass}
                />
                <span className="text-[14px] text-[#8A8780]">%</span>
              </div>
              <p className="mt-2 text-[13px] text-[#8A8780]">
                Taken from each fare when a new order is created. Rider payout is
                the rest. Default is 15%. Already booked jobs keep the cut they
                were quoted with.
              </p>
            </div>

            <fieldset className="space-y-4 border-t border-black/6 pt-6">
              <legend className="text-[12px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase">
                Distance fare
              </legend>
              <p className="text-[13px] text-[#8A8780]">
                Fare = max(minimum, base + distance × per-km), then rounded to the
                nearest ₦50 for the customer. Online discount is taken from
                platform margin only — rider payout uses the full list fare.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="baseFeeNgn"
                    className="text-[12px] font-medium text-[#8A8780]"
                  >
                    Base (₦)
                  </label>
                  <input
                    id="baseFeeNgn"
                    type="number"
                    min={0}
                    max={50000}
                    step={1}
                    value={baseFeeNgn}
                    onChange={(e) => {
                      setSaved(false);
                      setBaseFeeNgn(e.target.value);
                    }}
                    className={`mt-1.5 ${inputClass} w-full`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="perKmFeeNgn"
                    className="text-[12px] font-medium text-[#8A8780]"
                  >
                    Per km (₦)
                  </label>
                  <input
                    id="perKmFeeNgn"
                    type="number"
                    min={0}
                    max={50000}
                    step={1}
                    value={perKmFeeNgn}
                    onChange={(e) => {
                      setSaved(false);
                      setPerKmFeeNgn(e.target.value);
                    }}
                    className={`mt-1.5 ${inputClass} w-full`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="minFareNgn"
                    className="text-[12px] font-medium text-[#8A8780]"
                  >
                    Minimum (₦)
                  </label>
                  <input
                    id="minFareNgn"
                    type="number"
                    min={0}
                    max={50000}
                    step={1}
                    value={minFareNgn}
                    onChange={(e) => {
                      setSaved(false);
                      setMinFareNgn(e.target.value);
                    }}
                    className={`mt-1.5 ${inputClass} w-full`}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="onlinePaymentDiscountNgn"
                  className="text-[12px] font-medium text-[#8A8780]"
                >
                  Online pay discount (₦)
                </label>
                <input
                  id="onlinePaymentDiscountNgn"
                  type="number"
                  min={0}
                  max={5000}
                  step={1}
                  value={onlinePaymentDiscountNgn}
                  onChange={(e) => {
                    setSaved(false);
                    setOnlinePaymentDiscountNgn(e.target.value);
                  }}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-t border-black/6 pt-6">
              <legend className="text-[12px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase">
                Cancel discount
              </legend>
              <p className="text-[13px] text-[#8A8780]">
                After this many minutes searching, Cancel may offer ₦100 off if
                they stay. Keep it below 15 minutes or the order may auto-cancel
                first.
              </p>
              <div>
                <label
                  htmlFor="stillLookingAfterMinutes"
                  className="text-[12px] font-medium text-[#8A8780]"
                >
                  Offer after (min)
                </label>
                <input
                  id="stillLookingAfterMinutes"
                  type="number"
                  min={1}
                  max={120}
                  step={1}
                  value={stillLookingAfterMinutes}
                  onChange={(e) => {
                    setSaved(false);
                    setStillLookingAfterMinutes(e.target.value);
                  }}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </fieldset>

            {error ? (
              <p className="text-[13px] font-medium text-danger">{error}</p>
            ) : saved ? (
              <p className="text-[13px] font-medium text-brand">Saved.</p>
            ) : null}

            <Button type="submit" size="md" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </form>

          <section className="mt-6 rounded-xl border border-black/6 bg-white px-4 py-5">
            <p className="text-[12px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase">
              Reload customer & rider apps
            </p>
            <p className="mt-2 text-[13px] text-[#8A8780]">
              After a deploy, tap this. Each phone reloads once on the next
              action, then that person is done. You do not turn anything off.
              Ops does not reload.
            </p>
            <Button
              type="button"
              size="md"
              variant="secondary"
              className="mt-4"
              disabled={save.isPending}
              onClick={() => {
                setError("");
                setSaved(false);
                void save
                  .mutateAsync({ bumpClientRefresh: true })
                  .then(() => setSaved(true))
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : "Could not request reload",
                    ),
                  );
              }}
            >
              {save.isPending ? "Sending…" : "Reload apps now"}
            </Button>
          </section>
        </>
      )}
    </div>
  );
}
