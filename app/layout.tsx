import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts per DESIGN.md §2: Plex Sans for UI, Plex Mono for numbers, times, units.
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

export const metadata: Metadata = {
  title: "GridShift",
  description: "Plan cheap appliance times; give the utility a forward-looking demand forecast.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-body text-ink antialiased">{children}</body>
    </html>
  );
}
