import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jhaz-imprints | Nigerian Traditional Dress Tailor",
  description: "Bespoke African traditional dresses, crafted to perfection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
