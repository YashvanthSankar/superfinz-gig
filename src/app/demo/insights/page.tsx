import type { Metadata } from "next";
import { InsightsClient } from "@/components/gig/insights-client";
import { createGigDemo } from "@/lib/gig-demo";

export const metadata: Metadata = { title: "Demo insights" };

export default function DemoInsightsPage() {
  return (
    <main className="min-h-dvh bg-paper px-4 py-5 text-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <InsightsClient dashboard={createGigDemo()} backHref="/demo" demo />
      </div>
    </main>
  );
}
