"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { Button } from "@/components/ui/Button";
import { formatDate, formatNaira } from "@/lib/format";
import {
  useAdminCustomer,
  useResetCustomerCancelsMutation,
  useSetCustomerActiveMutation,
} from "@/lib/query/hooks";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isPending, isError } = useAdminCustomer(params.id);
  const setActive = useSetCustomerActiveMutation();
  const resetCancels = useResetCustomerCancelsMutation();

  if (isPending) {
    return <div className="h-64 animate-pulse rounded-xl bg-[#EEEDE8]" />;
  }

  if (isError || !data) {
    return (
      <div>
        <p className="font-display text-[20px] font-semibold">User not found</p>
        <Link href="/admin/users" className="mt-3 inline-block text-brand">
          Back to users
        </Link>
      </div>
    );
  }

  const { customer, trips } = data;

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8A8780]"
      >
        <ChevronLeft className="h-4 w-4" />
        Users
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
              {customer.name?.trim() || "No name"}
            </h1>
            {customer.isRider ? (
              <span className="inline-flex rounded-full bg-[#DCEEE4] px-2 py-0.5 text-[11px] font-semibold text-brand">
                Rider
              </span>
            ) : null}
          </div>
          <a
            href={`tel:${customer.phone}`}
            className="mt-1 inline-block text-[14px] text-brand"
          >
            {customer.phone}
          </a>
          <p className="mt-1 text-[13px] text-[#8A8780]">
            Joined {formatDate(customer.createdAt)}
          </p>
        </div>
        <ActiveToggle
          active={customer.active}
          pending={setActive.isPending}
          onToggle={() =>
            void setActive.mutateAsync({
              customerId: customer.id,
              active: !customer.active,
            })
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        <Stat label="Orders" value={String(customer.ordersCount)} />
        <Stat label="Spent" value={formatNaira(customer.spentNgn)} />
        <Stat
          label="Last order"
          value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
        />
        <Stat
          label="Live"
          value={`${customer.activeOrders ?? 0}/${customer.maxActiveOrders ?? 3}`}
        />
        <Stat
          label="Cancels"
          value={`${customer.cancelsInWindow ?? 0}/${customer.cancelLimit ?? 3}`}
        />
      </div>

      {customer.cancelLimited ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/6 bg-white px-4 py-3">
          <p className="text-[13px] text-[#8A8780]">
            This user has used all {customer.cancelLimit ?? 3} cancels in the last{" "}
            {customer.cancelWindowHours ?? 24} hours.
          </p>
          <Button
            type="button"
            size="md"
            variant="secondary"
            disabled={resetCancels.isPending}
            onClick={() => void resetCancels.mutateAsync(customer.id)}
          >
            {resetCancels.isPending ? "Resetting…" : "Allow cancels again"}
          </Button>
        </div>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-xl border border-black/6 bg-white">
        <div className="border-b border-black/6 px-4 py-3">
          <h2 className="font-display text-[16px] font-semibold">Orders</h2>
        </div>
        <OrdersTable
          trips={trips}
          emptyTitle="No orders yet"
          empty="This user has signed in but has not booked a pickup."
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/6 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
        {label}
      </p>
      <p className="num mt-1 text-[22px] font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}
