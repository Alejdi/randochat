import "./globals.css";

export const metadata = {
  title: "RandoChat — random video chat",
  description: "1-on-1 random video chat with strangers. pick a country or go global.",
  applicationName: "RandoChat",
  appleWebApp: {
    capable: true,
    title: "RandoChat",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
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
