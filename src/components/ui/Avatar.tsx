import { cn } from "@/lib/cn";

export function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const initial = (name.trim() || "?").charAt(0).toUpperCase();
  if (src) {
    return (
      // Cloudinary URLs are absolute; next/image is not required here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn("rounded-full object-cover", className)} />
    );
  }
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-brand font-display font-semibold text-[#FAFAF7]",
        className,
      )}
    >
      {initial}
    </span>
  );
}
