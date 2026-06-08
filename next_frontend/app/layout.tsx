import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lingvomadaniy Birliklar Tahlili",
  description:
    "Matndagi lingvomadaniy birliklarni aniqlash, tarjima bilan taqqoslash va tahlil qilish tizimi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
