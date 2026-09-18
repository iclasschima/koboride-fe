export type PaystackCheckout = {
  accessCode: string;
  reference: string;
  publicKey: string;
  email: string;
  amountKobo: number;
  feeNgn: number;
};

type PaystackPopInstance = {
  resumeTransaction?: (
    accessCode: string,
    callbacks?: {
      onSuccess?: (transaction: { reference?: string }) => void;
      onCancel?: () => void;
    },
  ) => void;
  newTransaction?: (options: Record<string, unknown>) => void;
};

type PaystackPopGlobal = (new () => PaystackPopInstance) & {
  setup?: (options: Record<string, unknown>) => { openIframe: () => void };
};

declare global {
  interface Window {
    PaystackPop?: PaystackPopGlobal;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadPaystack(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Paystack needs a browser"));
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-paystack]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Paystack")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.dataset.paystack = "true";
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load Paystack"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function openPaystack(checkout: PaystackCheckout): Promise<string> {
  await loadPaystack();
  const Pop = window.PaystackPop;
  if (!Pop) throw new Error("Paystack failed to load");

  return new Promise((resolve, reject) => {
    const onCancel = () => reject(new Error("Payment cancelled"));
    try {
      const popup = new Pop();
      if (typeof popup.resumeTransaction === "function") {
        popup.resumeTransaction(checkout.accessCode, {
          onSuccess: (transaction) => resolve(transaction.reference || checkout.reference),
          onCancel,
        });
        return;
      }
      if (typeof popup.newTransaction === "function") {
        popup.newTransaction({
          key: checkout.publicKey,
          email: checkout.email,
          amount: checkout.amountKobo,
          ref: checkout.reference,
          onSuccess: (transaction: { reference?: string }) =>
            resolve(transaction.reference || checkout.reference),
          onCancel,
        });
        return;
      }
    } catch {
      /* fall through to v1 */
    }
    if (typeof Pop.setup === "function") {
      Pop.setup({
        key: checkout.publicKey,
        email: checkout.email,
        amount: checkout.amountKobo,
        ref: checkout.reference,
        callback: (response: { reference: string }) => resolve(response.reference),
        onClose: onCancel,
      }).openIframe();
      return;
    }
    reject(new Error("Paystack is unavailable"));
  });
}
