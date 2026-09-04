import type { Metadata } from "next";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";

export const metadata: Metadata = { title: "Set up your plan" };

export default function OnboardingPage() {
  return <OnboardingClient />;
}
