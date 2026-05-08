// Streaming loading state for the dashboard.
// Next.js shows this instantly while the page awaits Supabase queries.
export default function DashboardLoading() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <div className="heading-lg animate-pulse rounded bg-surface2 text-transparent">
        Dashboard
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card animate-pulse rounded-lg bg-surface2"
            style={{ height: "80px" }}
          />
        ))}
      </div>
    </main>
  );
}
