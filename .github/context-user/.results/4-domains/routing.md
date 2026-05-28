# Routing Domain Deep Dive

The application uses the Next.js App Router for file-system based routing.

## Patterns and Conventions

- **Directory Structure**: Routes are defined by nested folders within `apps/user/app/`.
- **File Conventions**: 
  - `page.tsx` is used to define the UI for a specific route segment.
  - `layout.tsx` is used to define shared UI wrapping multiple routes (e.g., the root layout with the Navbar and Footer).
- **Styling**: Global styles are imported in the root layout (`app/globals.css`).

## Real Code Example

From `apps/user/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="flex-1 pt-16 lg:pt-20">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```
