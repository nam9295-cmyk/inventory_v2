import type { Metadata, Viewport } from "next";
import ServiceWorkerRegistration from "./service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "초코창고",
  description: "Very Good Chocolate inventory PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "초코창고"
  }
};

export const viewport: Viewport = {
  themeColor: "#f7c948",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
