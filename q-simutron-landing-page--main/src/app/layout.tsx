import type { Metadata, Viewport } from "next";
import "./webflow.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RequestPilotModal from "@/components/RequestPilotModal";

export const metadata: Metadata = {
  title: "Synex - Webflow HTML website template",
  description: "Synex - Webflow HTML website template, rebuilt in Next.js",
  generator: "Next.js",
  openGraph: {
    title: "Synex - Webflow HTML website template",
    images: [
      {
        url: "/resource/img1/og.webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synex - Webflow HTML website template",
    images: ["/resource/img1/og.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-mod-js">
      <body className="p-home-body">
        <SmoothScroll>
          <Header />
          <main>{children}</main>
          <Footer />
          <RequestPilotModal />
        </SmoothScroll>
      </body>
    </html>
  );
}
