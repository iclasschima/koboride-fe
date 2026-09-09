import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "lg",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold transition-opacity active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
        size === "lg" ? "h-14 px-5 text-[16px]" : "h-11 px-4 text-[14px]",
        variant === "primary" && "bg-accent text-[#1A1A16]",
        variant === "secondary" && "bg-[#EEEDE8] text-[#1A1A16]",
        variant === "ghost" && "bg-transparent text-brand",
        variant === "danger" && "bg-danger text-white",
        variant === "success" && "bg-success text-white",
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
