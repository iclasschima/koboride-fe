"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import { useAdminRiders, useSetRiderApprovedMutation } from "@/lib/query/hooks";

export default function AdminRidersPage() {
  const { data: riders = [], isPending } = useAdminRiders();
  const setApproved = useSetRiderApprovedMutation();
  const [query, setQuery] = useState("");
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
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Riders
      </h1>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[14px] text-[#8A8780]">
          Add or deactivate riders. Open a rider to edit docs or remove them.
        </p>
        <Link
          href="/admin/riders/new"
          className="inline-flex h-9 w-fit items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-[#FAFAF7]"
        >
          Add rider
        </Link>
      </div>
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
                ? "Add a rider with name and phone. Docs can wait."
                : "Try a different name or phone."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-black/5 md:hidden">
              {rows.map((rider) => (
                <li key={rider.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/admin/riders/${rider.id}`}
                      className="flex min-w-0 items-start gap-3"
                    >
                      <Avatar
                        src={rider.photoUrl}
                        name={rider.name}
                        className="mt-0.5 h-10 w-10 shrink-0 text-[14px]"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] font-semibold">
                          {rider.name}
                          {rider.docsComplete === false ? (
                            <span className="ml-2 inline-flex rounded-full bg-[#F3E4D8] px-2 py-0.5 align-middle text-[10px] font-semibold text-[#8A4B1F]">
                              Docs missing
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[13px] text-brand">{rider.phone}</p>
                        <p className="mt-1 text-[12px] text-[#8A8780]">
                          {rider.zoneName ?? rider.zoneSlug ?? "Yaba"} · Added{" "}
                          {formatDate(rider.createdAt)}
                        </p>
                      </div>
                    </Link>
                    <ActiveToggle
                      active={rider.active ?? rider.approved}
                      pending={
                        setApproved.isPending && setApproved.variables?.riderId === rider.id
                      }
                      onToggle={() => {
                        setError("");
                        void setApproved
                          .mutateAsync({
                            riderId: rider.id,
                            approved: !(rider.active ?? rider.approved),
                          })
                          .catch((err) =>
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Could not update rider",
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
                    <th className="px-4 py-3 font-semibold">Zone</th>
                    <th className="px-4 py-3 font-semibold">Added</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((rider) => (
                    <tr key={rider.id} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/riders/${rider.id}`}
                          className="flex items-center gap-2.5 font-semibold text-brand hover:underline"
                        >
                          <Avatar
                            src={rider.photoUrl}
                            name={rider.name}
                            className="h-8 w-8 shrink-0 text-[12px]"
                          />
                          <span>{rider.name}</span>
                          {rider.docsComplete === false ? (
                            <span className="ml-1 inline-flex rounded-full bg-[#F3E4D8] px-2 py-0.5 text-[10px] font-semibold text-[#8A4B1F]">
                              Docs missing
                            </span>
                          ) : null}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{rider.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {rider.zoneName ?? rider.zoneSlug ?? "Yaba"}
                        {rider.zoneSlug ? (
                          <span className="ml-1 text-[#8A8780]">({rider.zoneSlug})</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#8A8780]">
                        {formatDate(rider.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ActiveToggle
                          active={rider.active ?? rider.approved}
                          pending={
                            setApproved.isPending &&
                            setApproved.variables?.riderId === rider.id
                          }
                          onToggle={() => {
                            setError("");
                            void setApproved
                              .mutateAsync({
                                riderId: rider.id,
                                approved: !(rider.active ?? rider.approved),
                              })
                              .catch((err) =>
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Could not update rider",
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
