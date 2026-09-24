"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { KpiCard } from "@/components/admin/KpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { useAdminCustomers, useSetCustomerActiveMutation } from "@/lib/query/hooks";

export default function AdminUsersPage() {
  const { data: customers = [], isPending } = useAdminCustomers();
  const setActive = useSetCustomerActiveMutation();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((user) =>
      `${user.name ?? ""} ${user.phone}`.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const active = customers.filter((user) => user.active).length;
  const onHold = customers.filter((user) => user.cancelLimited).length;
  const orders = customers.reduce((sum, user) => sum + user.ordersCount, 0);
  const spent = customers.reduce((sum, user) => sum + user.spentNgn, 0);

  return (
    <div>
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Users
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Everyone who has signed in on the customer app. Inactive users cannot
        log in or book.
      </p>
      {error ? (
        <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Users"
          value={isPending ? "—" : String(customers.length)}
          hint={`${active} active`}
        />
        <KpiCard
          label="On hold"
          value={isPending ? "—" : String(onHold)}
          hint="Cancel limit reached"
          tone={onHold > 0 ? "amber" : "default"}
        />
        <KpiCard
          label="Orders"
          value={isPending ? "—" : String(orders)}
        />
        <KpiCard
          label="Spent"
          value={isPending ? "—" : formatNaira(spent)}
        />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or phone"
        className="mt-5 h-10 w-full rounded-lg bg-white px-3 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780] focus:ring-brand/40 md:max-w-xs"
      />

      <section className="mt-5 overflow-hidden rounded-xl border border-black/6 bg-white">
        <div className="border-b border-black/6 px-4 py-3 text-[12px] text-[#8A8780]">
          {isPending ? "Loading…" : `${rows.length} users`}
        </div>
        {isPending ? (
          <div className="h-56 animate-pulse bg-[#EEEDE8]" />
        ) : rows.length === 0 ? (
          <EmptyState
            title={customers.length === 0 ? "No users yet" : "No users match"}
            description={
              customers.length === 0
                ? "When someone signs in with a phone number, they show up here."
                : "Try a different name or phone."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-black/5 md:hidden">
              {rows.map((user) => (
                <li key={user.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/admin/users/${user.id}`} className="min-w-0">
                      <p className="truncate font-display text-[15px] font-semibold">
                        {user.name?.trim() || "No name"}
                        {user.isRider ? (
                          <span className="ml-2 inline-flex rounded-full bg-[#DCEEE4] px-2 py-0.5 align-middle text-[10px] font-semibold text-brand">
                            Rider
                          </span>
                        ) : null}
                        {user.cancelLimited ? (
                          <span className="ml-2 inline-flex rounded-full bg-[#F3E4D8] px-2 py-0.5 align-middle text-[10px] font-semibold text-[#8A4B1F]">
                            Booking hold
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#8A8780]">{user.phone}</p>
                    </Link>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="num text-[13px] font-semibold text-accent">
                        {formatNaira(user.spentNgn)}
                      </p>
                      <ActiveToggle
                        active={user.active}
                        pending={setActive.isPending}
                        onToggle={() => {
                          setError("");
                          void setActive
                            .mutateAsync({
                              customerId: user.id,
                              active: !user.active,
                            })
                            .catch((err) =>
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Could not update user",
                              ),
                            );
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-[#8A8780]">
                    <p>
                      {user.ordersCount} {user.ordersCount === 1 ? "order" : "orders"} ·{" "}
                      {formatDate(user.createdAt)}
                    </p>
                    {user.lastOrderAt && user.lastOrderStatus ? (
                      <StatusBadge status={user.lastOrderStatus} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-black/6 bg-[#FAFAF7] text-[11px] font-semibold tracking-[0.05em] text-[#8A8780] uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Orders</th>
                    <th className="px-4 py-3 font-semibold">Spent</th>
                    <th className="px-4 py-3 font-semibold">Last order</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF7]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-semibold text-brand hover:underline"
                        >
                          {user.name?.trim() || "No name"}
                        </Link>
                        {user.isRider ? (
                          <span className="ml-2 inline-flex rounded-full bg-[#DCEEE4] px-2 py-0.5 text-[10px] font-semibold text-brand">
                            Rider
                          </span>
                        ) : null}
                        {user.cancelLimited ? (
                          <span className="ml-2 inline-flex rounded-full bg-[#F3E4D8] px-2 py-0.5 text-[10px] font-semibold text-[#8A4B1F]">
                            Booking hold
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{user.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#8A8780]">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 num">{user.ordersCount}</td>
                      <td className="px-4 py-3 num font-medium text-accent">
                        {formatNaira(user.spentNgn)}
                      </td>
                      <td className="px-4 py-3">
                        {user.lastOrderAt && user.lastOrderStatus ? (
                          <div>
                            <StatusBadge status={user.lastOrderStatus} />
                            <p className="mt-1 text-[12px] text-[#8A8780]">
                              {formatDateTime(user.lastOrderAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[#8A8780]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ActiveToggle
                          active={user.active}
                          pending={setActive.isPending}
                          onToggle={() => {
                            setError("");
                            void setActive
                              .mutateAsync({
                                customerId: user.id,
                                active: !user.active,
                              })
                              .catch((err) =>
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Could not update user",
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
