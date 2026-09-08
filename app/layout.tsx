import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "1 Click Boost - Ads Manager Pro",
  description: "Manage your Facebook ads easily with 1 Click Boost",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="km">
      <body>
        {children}
      </body>
    </html>
  );
}