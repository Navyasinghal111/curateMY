import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const cormorant = localFont({
  variable: "--font-cormorant",
  src: [
    {
      path: "../public/fonts/CormorantGaramond-Regular.ttf",
      weight: "300 400",
      style: "normal",
    },
    {
      path: "../public/fonts/CormorantGaramond-Italic.ttf",
      weight: "300 400",
      style: "italic",
    },
  ],
});

const inter = localFont({
  variable: "--font-inter",
  src: [
    {
      path: "../public/fonts/InterVariable.ttf",
      weight: "300 500",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "Curatekin — Shop what people actually love",
  description: "Discover products curated by India's most trusted tastemakers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFCFA] overflow-x-hidden">{children}</body>
    </html>
  );
}
