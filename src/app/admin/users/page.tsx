"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatDateTime, formatNaira } from "@/lib/format";
import { useAdminCustomers } from "@/lib/query/hooks";

export default function AdminUsersPage() {
  const { data: customers = [], isPending } = useAdminCustomers();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((user) =>
      `${user.name ?? ""} ${user.phone}`.toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <div>
      <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em]">
        Users
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Everyone who has signed in on the customer app.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or phone"
        className="mt-5 h-10 w-full max-w-xs rounded-lg bg-white px-3 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780] focus:ring-brand/40"
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-b border-black/6 bg-[#FAFAF7] text-[11px] font-semibold tracking-[0.05em] text-[#8A8780] uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Spent</th>
                  <th className="px-4 py-3 font-semibold">Last order</th>
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
