"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  useAddRiderMutation,
  useAdminUsers,
  useSetRiderApprovedMutation,
} from "@/lib/query/hooks";

export default function AdminRidersPage() {
  const { data: riders = [], isPending } = useAdminUsers();
  const addRider = useAddRiderMutation();
  const setApproved = useSetRiderApprovedMutation();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter((rider) =>
      `${rider.name} ${rider.phone}`.toLowerCase().includes(q),
    );
  }, [riders, query]);

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em]">
        Riders
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Add and approve riders. They cannot self-signup.
      </p>

      <form
        className="mt-5 flex flex-wrap items-end gap-2 rounded-xl border border-black/6 bg-white p-4"
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
          className="h-10 w-44 rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="h-10 w-44 rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none"
        />
        <Button type="submit" size="md" disabled={addRider.isPending}>
          {addRider.isPending ? "Saving…" : "Add rider"}
        </Button>
        {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}
      </form>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or phone"
        className="mt-5 h-10 w-full max-w-xs rounded-lg bg-white px-3 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780] focus:ring-brand/40"
      />

      <section className="mt-5 overflow-hidden rounded-xl border border-black/6 bg-white">
        {isPending ? (
          <div className="h-56 animate-pulse bg-[#EEEDE8]" />
        ) : rows.length === 0 ? (
          <EmptyState
            title={riders.length === 0 ? "No riders yet" : "No riders match"}
            description={
              riders.length === 0
                ? "Add an approved rider above. They cannot sign up themselves."
                : "Try a different name or phone."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="border-b border-black/6 bg-[#FAFAF7] text-[11px] font-semibold tracking-[0.05em] text-[#8A8780] uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rider</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Added</th>
                  <th className="px-4 py-3 font-semibold">Approved</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
