import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Providers } from "@/store";
import Chrome from "@/components/Chrome";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trivilla — Smart Restaurant System",
  description:
    "Live menu, live kitchen updates, table booking & smart ordering — home-style food, no waiting.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23bc4a10'/><path d='M18 44 L82 44' stroke='%23fdf3e3' stroke-width='7' stroke-linecap='round'/><path d='M50 44 L50 78' stroke='%23fdf3e3' stroke-width='7' stroke-linecap='round'/><path d='M13 48 L50 18 L87 48' fill='none' stroke='%23e8b85c' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'/><circle cx='70' cy='27' r='5.5' fill='%23e8b85c'/></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23bc4a10'/><path d='M18 44 L82 44' stroke='%23fdf3e3' stroke-width='7' stroke-linecap='round'/><path d='M50 44 L50 78' stroke='%23fdf3e3' stroke-width='7' stroke-linecap='round'/><path d='M13 48 L50 18 L87 48' fill='none' stroke='%23e8b85c' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'/><circle cx='70' cy='27' r='5.5' fill='%23e8b85c'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        {/* Preload LCP image — hero photo */}
        <link
          rel="preload"
          href="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&h=900&fit=crop"
          as="image"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
