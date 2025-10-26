import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "elle - Outfit Gallery from Videos",
  description: "Discover and shop outfits from your favorite videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
