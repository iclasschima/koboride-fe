"use client";

import { useEffect, useId, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  MoreVertical,
  Plus,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";

export function AddToHomeScreenCard() {
  const { ready, installed, mobile, canPrompt } = usePwaInstall();
  if (!ready || installed) return null;
  if (!mobile && !canPrompt) return null;

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/6">
      <h2 className="font-display text-[18px] font-semibold">Add to Home Screen</h2>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Install KoboRide like an app. Alerts work more reliably that way — especially on
        iPhone.
      </p>
      <InstallAppButton className="mt-3 w-full" />
    </section>
  );
}

/** Installs in one tap where the browser allows it, otherwise shows the steps. */
export function InstallAppButton({
  className,
  size,
  variant,
  label = "Add to Home Screen",
}: {
  className?: string;
  size?: "md" | "lg";
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const { start, guideOpen, closeGuide } = useInstallFlow();

  return (
    <>
      <Button
        type="button"
        className={className}
        size={size}
        variant={variant}
        onClick={() => void start()}
      >
        {label}
      </Button>
      {guideOpen ? <InstallGuide onClose={closeGuide} /> : null}
    </>
  );
}

export function AddToHomeScreenBanner() {
  const { showBanner, dismiss } = usePwaInstall();
  const { start, guideOpen, closeGuide } = useInstallFlow();
  if (!showBanner) return null;

  return (
    <>
      <div className="pointer-events-auto relative z-30 mx-3 mb-2 rounded-2xl bg-[#0F3D2E] px-3 py-3 text-[#FAFAF7] shadow-[0_10px_28px_rgba(15,61,46,0.28)]">
        <button
          type="button"
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-[#FAFAF7]/70"
          aria-label="Dismiss"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
        <p className="pr-8 font-display text-[15px] font-semibold">
          Add KoboRide to Home Screen
        </p>
        <p className="mt-0.5 pr-8 text-[12px] text-[#FAFAF7]/75">
          Faster to open, and alerts reach you more reliably.
        </p>
        <button
          type="button"
          className="mt-2 h-9 rounded-full bg-accent px-3 text-[13px] font-semibold text-[#1A1A16]"
          onClick={() => void start()}
        >
          Add to Home Screen
        </button>
      </div>
      {guideOpen ? <InstallGuide onClose={closeGuide} /> : null}
    </>
  );
}

/**
 * One tap installs outright where the browser gives us a prompt. Safari and
 * webviews have no such API, so those users get the steps only when they ask.
 */
function useInstallFlow() {
  const { canPrompt, install } = usePwaInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  const start = async () => {
    if (canPrompt && (await install())) return;
    if (!canPrompt) setGuideOpen(true);
  };

  return { start, guideOpen, closeGuide: () => setGuideOpen(false) };
}

type Step = { icon: React.ReactNode; text: React.ReactNode };

function InstallGuide({ onClose }: { onClose: () => void }) {
  const { ios, inAppBrowser } = usePwaInstall();
  const titleId = useId();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const steps: Step[] = inAppBrowser
    ? [
        {
          icon: <ExternalLink className="h-4 w-4" />,
          text: (
            <>
              Tap the menu in this app and choose{" "}
              <strong className="font-semibold">Open in browser</strong>
            </>
          ),
        },
        {
          icon: ios ? <Share className="h-4 w-4" /> : <MoreVertical className="h-4 w-4" />,
          text: ios ? (
            <>
              In Safari, tap <strong className="font-semibold">Share</strong>
            </>
          ) : (
            <>
              In Chrome, tap the <strong className="font-semibold">⋮</strong> menu
            </>
          ),
        },
        {
          icon: <Plus className="h-4 w-4" />,
          text: (
            <>
              Choose <strong className="font-semibold">Add to Home Screen</strong>
            </>
          ),
        },
      ]
    : ios
      ? [
          {
            icon: <Share className="h-4 w-4" />,
            text: (
              <>
                Tap <strong className="font-semibold">Share</strong> at the bottom of
                Safari
              </>
            ),
          },
          {
            icon: <Plus className="h-4 w-4" />,
            text: (
              <>
                Scroll down and tap{" "}
                <strong className="font-semibold">Add to Home Screen</strong>
              </>
            ),
          },
          {
            icon: <Smartphone className="h-4 w-4" />,
            text: (
              <>
                Tap <strong className="font-semibold">Add</strong> — KoboRide lands on
                your home screen
              </>
            ),
          },
        ]
      : [
          {
            icon: <MoreVertical className="h-4 w-4" />,
            text: (
              <>
                Tap the <strong className="font-semibold">⋮</strong> menu at the top of
                Chrome
              </>
            ),
          },
          {
            icon: <Plus className="h-4 w-4" />,
            text: (
              <>
                Tap <strong className="font-semibold">Add to Home screen</strong> or{" "}
                <strong className="font-semibold">Install app</strong>
              </>
            ),
          },
          {
            icon: <Smartphone className="h-4 w-4" />,
            text: (
              <>
                Confirm with <strong className="font-semibold">Install</strong>
              </>
            ),
          },
        ];

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-[28px] bg-white px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        style={{ animation: "kb-sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D5D7DB]" aria-hidden />
        <h2
          id={titleId}
          className="font-display text-[22px] font-bold tracking-[-0.03em] text-[#1A1A16]"
        >
          {inAppBrowser ? "Open in your browser first" : "Three taps and it is done"}
        </h2>
        <p className="mt-1 text-[14px] text-[#8A8780]">
          {inAppBrowser
            ? "This in-app browser cannot install apps. Open the link in Safari or Chrome, then add it."
            : "Your browser handles this part itself, so we cannot do it for you."}
        </p>

        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEEDE8] text-brand">
                {step.icon}
              </span>
              <span className="text-[15px] leading-6 text-[#1A1A16]">{step.text}</span>
            </li>
          ))}
        </ol>

        {inAppBrowser ? (
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(window.location.href)
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Link copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy link
              </>
            )}
          </Button>
        ) : null}

        <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  );
}
