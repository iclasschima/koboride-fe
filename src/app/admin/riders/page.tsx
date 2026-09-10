"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  useAddRiderMutation,
  useAdminRiders,
  useRemoveRiderMutation,
  useSetRiderApprovedMutation,
} from "@/lib/query/hooks";

export default function AdminRidersPage() {
  const { data: riders = [], isPending } = useAdminRiders();
  const addRider = useAddRiderMutation();
  const setApproved = useSetRiderApprovedMutation();
  const removeRider = useRemoveRiderMutation();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter((rider) =>
      `${rider.name} ${rider.phone}`.toLowerCase().includes(q),
    );
  }, [riders, query]);

  return (
    <div>
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Riders
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Add, approve, or remove riders. They sign in on the rider app with that
        phone number — not as a customer.
      </p>

      <form
        className="mt-5 flex flex-col gap-2 rounded-xl border border-black/6 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          void addRider
            .mutateAsync({ name, phone })
            .then(() => {
              setName("");
              setPhone("");
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : "Could not add rider"),
            );
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-10 w-full rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none sm:w-44"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          inputMode="tel"
          className="h-10 w-full rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none sm:w-44"
        />
        <Button type="submit" size="md" className="w-full sm:w-auto" disabled={addRider.isPending}>
          {addRider.isPending ? "Saving…" : "Add rider"}
        </Button>
      </form>
      {error ? (
        <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
      ) : null}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or phone"
        className="mt-5 h-10 w-full rounded-lg bg-white px-3 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780] focus:ring-brand/40 md:max-w-xs"
      />

      <section className="mt-5 overflow-hidden rounded-xl border border-black/6 bg-white">
        {isPending ? (
          <div className="h-56 animate-pulse bg-[#EEEDE8]" />
        ) : rows.length === 0 ? (
          <EmptyState
            title={riders.length === 0 ? "No riders yet" : "No riders match"}
            description={
              riders.length === 0
                ? "Add an approved rider above. They sign in on the rider app with that phone."
                : "Try a different name or phone."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-black/5 md:hidden">
              {rows.map((rider) => (
                <li key={rider.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[15px] font-semibold">
                        {rider.name}
                      </p>
                      <a
                        href={`tel:${rider.phone}`}
                        className="mt-0.5 inline-block text-[13px] text-brand"
                      >
                        {rider.phone}
                      </a>
                      <p className="mt-1 text-[12px] text-[#8A8780]">
                        Added {formatDate(rider.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        rider.approved
                          ? "bg-[#DCEEE4] text-success"
                          : "bg-[#F8D4D4] text-danger",
                      )}
                      onClick={() =>
                        void setApproved.mutateAsync({
                          riderId: rider.id,
                          approved: !rider.approved,
                        })
                      }
                    >
                      {rider.approved ? "Approved" : "Not approved"}
                    </button>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <RiderRemoveAction
                      confirming={confirmId === rider.id}
                      pending={removeRider.isPending}
                      onAsk={() => {
                        setError("");
                        setConfirmId(rider.id);
                      }}
                      onCancel={() => setConfirmId(null)}
                      onConfirm={() => {
                        setError("");
                        void removeRider
                          .mutateAsync(rider.id)
                          .then(() => setConfirmId(null))
                          .catch((err) =>
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Could not remove rider",
                            ),
                          );
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="border-b border-black/6 bg-[#FAFAF7] text-[11px] font-semibold tracking-[0.05em] text-[#8A8780] uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Rider</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Added</th>
                    <th className="px-4 py-3 font-semibold">Approved</th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((rider) => (
                    <tr key={rider.id} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 font-semibold">{rider.name}</td>
                      <td className="px-4 py-3">{rider.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#8A8780]">
                        {formatDate(rider.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            rider.approved
                              ? "bg-[#DCEEE4] text-success"
                              : "bg-[#F8D4D4] text-danger",
                          )}
                          onClick={() =>
                            void setApproved.mutateAsync({
                              riderId: rider.id,
                              approved: !rider.approved,
                            })
                          }
                        >
                          {rider.approved ? "Approved" : "Not approved"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RiderRemoveAction
                          confirming={confirmId === rider.id}
                          pending={removeRider.isPending}
                          onAsk={() => {
                            setError("");
                            setConfirmId(rider.id);
                          }}
                          onCancel={() => setConfirmId(null)}
                          onConfirm={() => {
                            setError("");
                            void removeRider
                              .mutateAsync(rider.id)
                              .then(() => setConfirmId(null))
                              .catch((err) =>
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Could not remove rider",
                                ),
                              );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function RiderRemoveAction({
  confirming,
  pending,
  onAsk,
  onCancel,
  onConfirm,
}: {
  confirming: boolean;
  pending: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="text-[12px] font-semibold text-[#8A8780]"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="text-[12px] font-semibold text-danger"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Removing…" : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="text-[12px] font-semibold text-danger"
      onClick={onAsk}
    >
      Remove
    </button>
  );
}
