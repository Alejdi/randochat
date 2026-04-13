import "./globals.css";

const SITE_URL = "https://randochat-jet.vercel.app";
const SITE_TITLE = "RandoChat — random video chat";
const SITE_DESC  = "1-on-1 random video chat with strangers. pick a country or go global.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  applicationName: "RandoChat",
  appleWebApp: {
    capable: true,
    title: "RandoChat",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "RandoChat",
    description: "talk to strangers. one tap away.",
    url: SITE_URL,
    siteName: "RandoChat",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RandoChat",
    description: "talk to strangers. one tap away.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ff4d1a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
