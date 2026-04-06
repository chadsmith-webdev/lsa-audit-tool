import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Local SEO Audit for Contractors | Local Search Ally",
  description:
    "See exactly how your business shows up in Google — free. Enter your business info and get a real audit in 90 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='h-full'>
      <body className='min-h-full flex flex-col'>{children}</body>
    </html>
  );
}
