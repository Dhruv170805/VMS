import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

export const metadata = {
  title: "NG-VMS | Next Generation Visitor Management",
  description: "Apple VisionOS-inspired Visitor Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NG-VMS",
  },
};

export const viewport = {
  themeColor: "#007AFF",
};

import { ConfigProvider } from "@/context/ConfigContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <ConfigProvider>
          <ClientWrapper>{children}</ClientWrapper>
        </ConfigProvider>
      </body>
    </html>
  );
}
