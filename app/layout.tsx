import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Providers from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "PRISM RMC CRM",
    template: "%s | PRISM RMC CRM",
  },
  description: "Sales CRM for Ready-Mix Concrete — manage leads, site visits, and follow-ups on the go",
  applicationName: "PRISM RMC CRM",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PRISM RMC",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
  },
  openGraph: {
    title: "PRISM RMC CRM",
    description: "Sales CRM for Ready-Mix Concrete",
    siteName: "PRISM RMC CRM",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `new MutationObserver(function(m){m.forEach(function(r){if(r.type==="attributes"&&r.attributeName==="fdprocessedid"){r.target.removeAttribute("fdprocessedid")}else{r.addedNodes.forEach(function(n){if(n.nodeType===1&&n.querySelectorAll)n.querySelectorAll("[fdprocessedid]").forEach(function(e){e.removeAttribute("fdprocessedid")})})}})}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["fdprocessedid"]})`,
            }}
          />
        </head>
        <body className="min-h-full">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
