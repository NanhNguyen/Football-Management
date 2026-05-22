import type { Metadata } from "next";
import "./globals.css";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";

export const metadata: Metadata = {
  title: "TKSCORE | Hệ thống Quản lý Giải đấu",
  description: "Dashboard quản lý giải đấu bóng đá nội bộ. Quản lý đội bóng, cầu thủ, lịch thi đấu và theo dõi kết quả trận đấu real-time.",
  icons: {
    icon: '/logo-premium-transparent.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <PublicLayoutWrapper>
          {children}
        </PublicLayoutWrapper>
      </body>
    </html>
  );
}
