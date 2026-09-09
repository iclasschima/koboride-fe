"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

type AppSheetProps = {
  children: React.ReactNode;
  snapPoints: number[];
  activeSnapPoint: number | string | null;
  setActiveSnapPoint: (snap: number | string | null) => void;
  className?: string;
  /** Size to content instead of a viewport fraction — use for the home peek. */
  autoHeight?: boolean;
};

export function AppSheet({
  children,
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  className,
  autoHeight = false,
}: AppSheetProps) {
  const startY = useRef(0);
  const startSnap = useRef(0);
  const dragging = useRef(false);
  const [liveDrag, setLiveDrag] = useState(false);

  const snap =
    typeof activeSnapPoint === "number"
      ? activeSnapPoint
      : Number(snapPoints[0] ?? 0.22);

  const min = snapPoints[0] ?? 0.18;
  const max = snapPoints[snapPoints.length - 1] ?? 0.92;

  function nearest(value: number) {
    return snapPoints.reduce((best, point) =>
      Math.abs(point - value) < Math.abs(best - value) ? point : best,
    );
  }

  function parentHeight(el: HTMLElement) {
    return (
      el.closest(".relative")?.clientHeight ??
      el.parentElement?.clientHeight ??
      window.innerHeight
    );
  }

  return (
    <section
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[28px] bg-[#FAFAF7]",
        "shadow-[0_-16px_48px_rgba(15,61,46,0.14)]",
        autoHeight ? "h-auto overflow-visible" : "overflow-hidden",
        !liveDrag &&
          "motion-safe:transition-[height] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]",
        className,
      )}
      style={
        autoHeight
          ? undefined
          : { height: `${Math.min(0.94, Math.max(0.16, snap)) * 100}%` }
      }
      aria-label="Sheet"
    >
      <button
        type="button"
        className="flex h-7 w-full shrink-0 items-center justify-center"
        aria-label="Drag sheet"
        onPointerDown={(e) => {
          dragging.current = true;
          setLiveDrag(true);
          startY.current = e.clientY;
          startSnap.current = snap;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const h = parentHeight(e.currentTarget);
          const delta = (startY.current - e.clientY) / h;
          setActiveSnapPoint(
            Math.min(max, Math.max(min, startSnap.current + delta)),
          );
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          setLiveDrag(false);
          const h = parentHeight(e.currentTarget);
          const delta = (startY.current - e.clientY) / h;
          setActiveSnapPoint(nearest(startSnap.current + delta));
        }}
      >
        <span className="h-1 w-10 rounded-full bg-[#D9D6CE]" />
      </button>
      <div
        className={cn(
          "flex flex-col",
          autoHeight
            ? "h-auto overflow-visible"
            : "min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
        )}
      >
        {children}
      </div>
    </section>
  );
}
