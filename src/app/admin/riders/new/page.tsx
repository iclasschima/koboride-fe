"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RiderVerificationForm } from "@/components/admin/RiderVerificationForm";
import { useAddRiderMutation } from "@/lib/query/hooks";

export default function AdminAddRiderPage() {
  const router = useRouter();
  const addRider = useAddRiderMutation();

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/riders"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8A8780]"
      >
        <ChevronLeft className="h-4 w-4" />
        Riders
      </Link>
      <h1 className="mt-3 font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Add rider
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Name and phone are enough to add them. Photo, ID, and next of kin can
        be filled in later on their profile.
      </p>

      <div className="mt-6 rounded-xl border border-black/6 bg-white p-4 md:p-5">
        <RiderVerificationForm
          pending={addRider.isPending}
          submitLabel="Add rider"
          onSubmit={async (input) => {
            const rider = await addRider.mutateAsync(input);
            router.push(`/admin/riders/${rider.id}`);
          }}
        />
      </div>
    </div>
  );
}
