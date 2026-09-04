"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        closeButton
        gap={10}
        toastOptions={{
          duration: 4500,
          style: {
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            boxShadow: "var(--shadow-md)",
            fontWeight: 500,
            fontSize: "14px",
          },
        }}
      />
    </SessionProvider>
  );
}
