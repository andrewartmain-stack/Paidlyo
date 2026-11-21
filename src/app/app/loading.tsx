// Shown while a dashboard page streams in (pages that read the session or data).
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="h-9 w-48 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
