// NO "use client" here — layout must be a server component
import type { Metadata } from "next";
import "./globals.css";
import NinetailedClientProvider from "@/components/NinetailedClientProvider";

export const metadata: Metadata = {
  title: "Events",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NinetailedClientProvider>
          {children}
        </NinetailedClientProvider>
      </body>
    </html>
  );
}
