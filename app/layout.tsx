import type { Metadata } from "next";
import { Fraunces, Roboto, Geist } from "next/font/google";
import "./globals.css";
import WhatsappChatbot from "@/components/WhatsappChatbot";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Change Life Marketing - Empowering Lives with Natural Health Products and Financial Opportunities",
  description: "Change Life Marketing offers high-quality natural health products and a unique business plan to help you achieve financial freedom. Join us today and start changing your life and the world!",
  verification: {
    google: "XRRU0e3sYrZsuoNx21z74mgCQuIw-J1AmVjP_7sDHZw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body
        className={`${fraunces.variable} ${roboto.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <WhatsappChatbot />
      </body>
    </html>
  );
}
