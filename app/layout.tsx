import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridShift",
  description: "Plan cheap appliance times; give the utility a forward-looking demand forecast.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
