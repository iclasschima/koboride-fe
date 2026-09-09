export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#1A1A16]">
        {title}
      </p>
      <p className="max-w-xs text-[14px] font-normal text-[#8A8780]">
        {description}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
