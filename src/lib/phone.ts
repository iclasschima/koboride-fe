/** Normalize NG numbers to E.164 (+234…). Matches the API. */
export function normalizeNgPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }
  if (digits.length === 10) return `+234${digits}`;
  return null;
}

/** Keep only the local part for the phone field (0XXXXXXXXXX or XXXXXXXXXX). */
export function sanitizeNgLocalInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  if (digits.startsWith("0")) return digits.slice(0, 11);
  return digits.slice(0, 10);
}

export function isValidNgPhone(input: string): boolean {
  return normalizeNgPhone(input) !== null;
}

export const NG_PHONE_ERROR = "Enter a valid Nigerian phone number";
