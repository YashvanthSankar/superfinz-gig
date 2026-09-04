const pulse = "animate-pulse bg-paper-2 motion-reduce:animate-none";

export default function InsightsLoading() {
  return (
    <div role="status" className="space-y-5 sm:space-y-6">
      <span className="sr-only">Loading insights</span>
      <div aria-hidden className="space-y-5 sm:space-y-6">
        {/* Header: back button, eyebrow, title, copy */}
        <div>
          <div className={`h-11 w-24 rounded-xl ${pulse}`} />
          <div className={`mt-6 h-3 w-40 rounded ${pulse}`} />
          <div className={`mt-3 h-10 max-w-md rounded-lg ${pulse} sm:h-14`} />
          <div className={`mt-4 h-5 max-w-2xl rounded ${pulse}`} />
          <div className={`mt-2 h-5 max-w-xl rounded ${pulse}`} />
        </div>

        {/* Runway (navy) and earnings cards */}
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className={`h-[22rem] rounded-[1.5rem] ${pulse} sm:h-[21rem]`} />
          <div className={`h-[22rem] rounded-[1.25rem] ${pulse} sm:h-[21rem]`} />
        </div>

        {/* Slow-week Shield: heading, four presets, result panel */}
        <div className="brut-card p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className={`h-11 w-11 shrink-0 rounded-xl ${pulse}`} />
            <div className="flex-1">
              <div className={`h-3 w-32 rounded ${pulse}`} />
              <div className={`mt-3 h-7 max-w-sm rounded-md ${pulse}`} />
              <div className={`mt-3 h-4 max-w-2xl rounded ${pulse}`} />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`min-h-28 rounded-2xl ${pulse}`} />
            ))}
          </div>
          <div className={`mt-5 h-52 rounded-2xl ${pulse}`} />
        </div>

        {/* Share row */}
        <div className={`h-28 rounded-[1.25rem] ${pulse}`} />
      </div>
    </div>
  );
}
