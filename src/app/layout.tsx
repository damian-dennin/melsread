import type { Metadata, Viewport } from "next";
import { Literata, Karla } from "next/font/google";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-libro",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Estante",
  description: "Los libros que leí, los que estoy leyendo y los que vienen.",
};

export const viewport: Viewport = {
  themeColor: "#F3F2F7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${literata.variable} ${karla.variable}`}>
      <body className="font-ui">{children}</body>
    </html>
  );
}
