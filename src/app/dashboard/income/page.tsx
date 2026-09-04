import type { Metadata } from "next";
import { Suspense } from "react";
import { IncomeClient } from "@/components/gig/income-client";
import { LoadingPanel } from "@/components/gig/page-state";

export const metadata: Metadata = { title: "Money" };

export default function IncomePage() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading your money workspace" />}>
      <IncomeClient />
    </Suspense>
  );
}
