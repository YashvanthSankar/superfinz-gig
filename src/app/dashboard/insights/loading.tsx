export default function InsightsLoading() {
  return (
    <div aria-label="Loading planning insights" className="space-y-5">
      <div className="h-11 w-24 animate-pulse rounded-xl bg-paper-2" />
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-paper-2" />
        <div className="h-12 max-w-xl animate-pulse rounded-xl bg-paper-2" />
        <div className="h-5 max-w-2xl animate-pulse rounded bg-paper-2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-3xl bg-paper-2" />
        <div className="h-72 animate-pulse rounded-3xl bg-paper-2" />
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-paper-2" />
    </div>
  );
}
