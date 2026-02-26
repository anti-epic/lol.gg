export default function Loading() {
  return (
    <div
      className="mx-auto max-w-4xl animate-pulse space-y-4 p-8"
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="h-10 w-64 rounded-lg bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
