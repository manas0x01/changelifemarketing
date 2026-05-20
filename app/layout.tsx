import type { Metadata } from "next";
import "./globals.css";
import WhatsappChatbot from "@/components/WhatsappChatbot";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://changelifemarketing.in"),
  title: "Change Life Marketing - Empowering Lives with Natural Health Products and Financial Opportunities",
  description: "Change Life Marketing offers high-quality natural health products and a unique business plan to help you achieve financial freedom. Join us today and start changing your life and the world!",
  applicationName: "Change Life Marketing",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/images/clm-new-logo.png", type: "image/png" },
      { url: "/images/changelifemarketinglogo.png", type: "image/png" },
    ],
    shortcut: "/images/clm-new-logo.png",
    apple: "/images/clm-new-logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://changelifemarketing.in",
    siteName: "Change Life Marketing",
    title: "Change Life Marketing",
    description:
      "Change Life Marketing offers high-quality natural health products and a unique business plan to help you achieve financial freedom.",
    images: [
      {
        url: "/images/clm-new-logo.png",
        width: 1200,
        height: 630,
        alt: "Change Life Marketing logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Change Life Marketing",
    description:
      "Empowering lives with natural health products and financial opportunities.",
    images: ["/images/clm-new-logo.png"],
  },
  verification: {
    google: "XRRU0e3sYrZsuoNx21z74mgCQuIw-J1AmVjP_7sDHZw",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Change Life Marketing",
  url: "https://changelifemarketing.in",
  logo: "https://changelifemarketing.in/images/clm-new-logo.png",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Change Life Marketing",
  url: "https://changelifemarketing.in",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
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
