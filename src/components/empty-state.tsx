/** Dashed placeholder for empty lists, optionally with an illustration above the title. */
export function EmptyState({
  title,
  description,
  illustration,
  children,
}: {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      {illustration && <div className="mb-3">{illustration}</div>}
      <h2 className="text-base">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
