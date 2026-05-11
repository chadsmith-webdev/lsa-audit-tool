import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Space_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: "variable",
  axes: ["opsz"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://audit.localsearchally.com"),
  title: "Free Local SEO Audit for Contractors | Local Search Ally",
  description:
    "See exactly how your business shows up in Google — free. Enter your business info and get a real audit in 90 seconds.",
  openGraph: {
    title: "Free Local SEO Audit for Contractors | Local Search Ally",
    description:
      "See exactly how your business shows up in Google — free. Enter your business info and get a real audit in 90 seconds.",
    url: "https://audit.localsearchally.com",
    siteName: "Local Search Ally",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`h-full ${bricolage.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className='min-h-full flex flex-col'>
        {children}
        <Script
          src='https://www.googletagmanager.com/gtag/js?id=G-11HLEEF2CQ'
          strategy='afterInteractive'
        />
        <Script id='gtag-init' strategy='afterInteractive'>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-11HLEEF2CQ', {
              linker: { domains: ['localsearchally.com', 'audit.localsearchally.com'] }
            });
            gtag('config', 'AW-18091036166');
          `}
        </Script>
      </body>
    </html>
  );
}
