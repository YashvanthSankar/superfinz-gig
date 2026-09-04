import type { Metadata } from "next";
import { PlanClient } from "@/components/gig/plan-client";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return <PlanClient />;
}
