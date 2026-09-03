import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/session-provider";
import { Analytics } from "@vercel/analytics/next";
import { ThemeDock } from "@/components/ui/theme-dock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gatwick = localFont({
  src: [
    {
      path: "../../public/Gatwick/Gatwick-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Gatwick/Gatwick-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/Gatwick/Gatwick-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/Gatwick/Gatwick-Ultrabold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-gatwick",
  display: "swap",
  preload: true,
  fallback: ["Inter", "Arial", "sans-serif"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F8F7" },
    { media: "(prefers-color-scheme: dark)", color: "#081416" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: "SuperFinz — Financial resilience for irregular earners",
  description:
    "Turn irregular earnings into a predictable money plan with safe-to-spend guidance, protected pockets, and explainable resilience.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SuperFinz",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "SuperFinz — Financial resilience for irregular earners",
    description: "A salary layer for people without salaries.",
    type: "website",
    images: [
      { url: "/superfinz.png", width: 2000, height: 2000, alt: "SuperFinz" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${gatwick.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('superfinz-theme');var theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme}catch(e){document.documentElement.dataset.theme='light'}})()`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SuperFinz" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-dvh relative">
        <Providers>
          {children}
          <ThemeDock />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
