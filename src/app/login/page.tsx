import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "@/components/auth/login-client";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-paper" aria-busy="true" />}>
      <LoginClient />
    </Suspense>
  );
}
