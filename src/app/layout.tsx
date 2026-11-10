import type { Metadata, Viewport } from "next";
// Fonts are served from our own origin — no request ever leaves for a font CDN.
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource-variable/caveat/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Elnare — Beyond Distance",
    template: "%s · Elnare",
  },
  description: "İstanbul'dan Bakü'ye, küçük ve özel bir dünya.",
  // A private place: never indexed, never previewed, never cached by crawlers.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": 0 },
  },
  referrer: "no-referrer",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr">
      <body className="bg-ivory text-ink-soft antialiased">{children}</body>
    </html>
  );
}
