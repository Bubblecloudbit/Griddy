import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts per DESIGN.md §2: Plex Sans for UI, Plex Mono for small numbers, times, units.
// Bundled from @fontsource (no Google Fonts download), so the demo looks right offline
// or on bad venue Wi-Fi. (Next requires these paths as plain string literals.)
const plexSans = localFont({
  src: [
    { path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
    { path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

// Display face for headings and big numbers (DIN-like, close to AEP's site type).
const display = localFont({
  src: [
    { path: "../node_modules/@fontsource/barlow/files/barlow-latin-500-normal.woff2", weight: "500" },
    { path: "../node_modules/@fontsource/barlow/files/barlow-latin-600-normal.woff2", weight: "600" },
    { path: "../node_modules/@fontsource/barlow/files/barlow-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Griddy",
  description: "Plan cheap appliance times; give the utility a forward-looking demand forecast.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${display.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-body text-ink antialiased">{children}</body>
    </html>
  );
}
