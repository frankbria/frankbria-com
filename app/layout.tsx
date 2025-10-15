import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frank Bria",
  description: "Frank Bria - Coaching and Business Consulting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
