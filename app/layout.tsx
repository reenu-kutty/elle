import type { Metadata } from "next";
import "./globals.css";
import {family} from "detect-libc";

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
    <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin/>
        <link href="https://fonts.googleapis.com/css2?family=Domine:wght@400..700&family=Gilda+Display&display=swap"
              rel="stylesheet"/>
    </head>
    <body className="antialiased">
    {children}
    </body>
    </html>
  );
}
