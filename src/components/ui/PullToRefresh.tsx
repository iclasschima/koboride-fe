"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const THRESHOLD = 64;
const MAX_PULL = 96;

export function PullToRefresh({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const qc = useQueryClient();
  const scroller = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const raf = useRef(0);
  const refreshingRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const setPullDistance = useCallback((value: number) => {
    pullRef.current = value;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      setPull(pullRef.current);
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const root =
      el.closest("[data-ptr-root]") ?? el;

    function atTop() {
      return (el?.scrollTop ?? 0) <= 0;
    }

    function onStart(e: TouchEvent) {
      if (refreshingRef.current) return;
      if (!root.contains(e.target as Node)) return;
      if (!atTop()) {
        pulling.current = false;
        return;
      }
      startY.current = e.touches[0]?.clientY ?? 0;
      pulling.current = true;
    }

    function onMove(e: TouchEvent) {
      if (!pulling.current || refreshingRef.current) return;
      if (!atTop()) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
      const dy = (e.touches[0]?.clientY ?? 0) - startY.current;
      if (dy <= 0) {
        setPullDistance(0);
        return;
      }
      const distance = Math.min(MAX_PULL, dy * 0.45);
      setPullDistance(distance);
      if (distance > 6) e.preventDefault();
    }

    async function onEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      const distance = pullRef.current;
      if (distance < THRESHOLD || refreshingRef.current) {
        setPullDistance(0);
        setPull(0);
        return;
      }
      refreshingRef.current = true;
      setRefreshing(true);
      setPull(THRESHOLD);
      pullRef.current = THRESHOLD;
      const started = Date.now();
      try {
        await qc.invalidateQueries();
        const wait = 400 - (Date.now() - started);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        pullRef.current = 0;
        setPull(0);
      }
    }

    root.addEventListener("touchstart", onStart, { passive: true, capture: true });
    root.addEventListener("touchmove", onMove, { passive: false, capture: true });
    root.addEventListener("touchend", onEnd, { capture: true });
    root.addEventListener("touchcancel", onEnd, { capture: true });
    return () => {
      root.removeEventListener("touchstart", onStart, true);
      root.removeEventListener("touchmove", onMove, true);
      root.removeEventListener("touchend", onEnd, true);
      root.removeEventListener("touchcancel", onEnd, true);
    };
  }, [qc, setPullDistance]);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const armed = pull >= THRESHOLD || refreshing;

  return (
    <div
      ref={scroller}
      className={cn("overflow-y-auto overscroll-y-contain", className)}
    >
      <div
        className="flex items-end justify-center overflow-hidden"
        style={{ height: pull }}
        aria-hidden={!refreshing}
      >
        <LoaderCircle
          className={cn(
            "mb-1 h-6 w-6 text-brand",
            refreshing ? "animate-spin" : "transition-transform",
          )}
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${pull * 3}deg)`, opacity: Math.min(1, pull / 28) }
          }
          aria-hidden
        />
      </div>
      {refreshing ? (
        <p className="sr-only" aria-live="polite">
          Refreshing
        </p>
      ) : armed ? (
        <p className="sr-only" aria-live="polite">
          Release to refresh
        </p>
      ) : null}
      {children}
    </div>
  );
}
