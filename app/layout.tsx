"use client";

import NinetailedIdentify from "@/components/NinetailedIdentify";
import { NinetailedProvider } from "@ninetailed/experience.js-react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NinetailedProvider
          clientId="598aeaf8-5f3f-4cf3-95b4-39e9f4076044" //from Contentful
        >
          <NinetailedIdentify />
          {children}
        </NinetailedProvider>
        
      </body>
    </html>
  );
}