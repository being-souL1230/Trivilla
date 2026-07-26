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
    "Live menu, live kitchen updates, table booking & smart ordering — ghar jaisa khana, bina wait ke.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23bc4a10'/><path d='M50 18c8 10 12 17 12 24a12 12 0 0 1-24 0c0-7 4-14 12-24z' fill='%23fdf3e3'/><path d='M24 56h52l-5 18a8 8 0 0 1-7.7 6H36.7A8 8 0 0 1 29 74l-5-18z' fill='none' stroke='%23fdf3e3' stroke-width='5'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body suppressHydrationWarning>
        <Providers>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
