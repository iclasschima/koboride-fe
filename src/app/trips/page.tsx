"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { TripStatusCard } from "@/components/trips/TripStatusCard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTrips } from "@/lib/query/hooks";

export default function TripsPage() {
  const { authenticated, openAuth, ready } = useAuth();
  const { data: trips = [], isPending } = useTrips(ready && authenticated);

  if (!ready) {
    return (
      <div className="bg-[#FAFAF7] px-4 pt-5 pb-8">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.04em] text-[#1A1A16]">
          Orders
        </h1>
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-[#EEEDE8]" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <EmptyState
        title="Sign in to see orders"
        description="Your live and past pickups show up here."
        action={
          <Button onClick={() => openAuth("login")} size="md">
            Sign in
          </Button>
        }
      />
    );
  }

  return (
    <div className="bg-[#FAFAF7] px-4 pt-5 pb-8">
      <h1 className="mb-4 font-display text-[28px] font-bold tracking-[-0.04em] text-[#1A1A16]">
        Orders
      </h1>
      {isPending ? (
        <div className="h-24 animate-pulse rounded-2xl bg-[#F3F4F6]" />
      ) : trips.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Set pickup and drop-off to send a rider across Yaba."
          action={
            <Link href="/">
              <Button size="md">Book a pickup</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={`/trips/${trip.id}`} className="block">
                <TripStatusCard trip={trip} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
