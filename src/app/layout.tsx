import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tournament Simulator PRO",
  description: "Advanced tournament simulation and management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
