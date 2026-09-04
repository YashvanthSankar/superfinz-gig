import type { Metadata } from "next";
import { CoachClient } from "@/components/gig/coach-client";

export const metadata: Metadata = { title: "Coach" };

export default function CoachPage() {
  return <CoachClient />;
}
