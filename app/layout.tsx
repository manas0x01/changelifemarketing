import type { Metadata } from "next";
import "./globals.css";
import WhatsappChatbot from "@/components/WhatsappChatbot";
import { Providers } from "./providers";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <WhatsappChatbot />
        </Providers>
      </body>
    </html>
  );
}
