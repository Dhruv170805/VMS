import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

export const metadata = {
  title: "VMS | Premium Visitor Management",
  description: "Apple VisionOS-inspired Visitor Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
