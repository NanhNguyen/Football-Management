import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "TKSCORE | Hệ thống Quản lý Giải đấu",
  description: "Dashboard quản lý giải đấu bóng đá nội bộ. Quản lý đội bóng, cầu thủ, lịch thi đấu và theo dõi kết quả trận đấu real-time.",
  icons: {
    icon: '/logo.svg',
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
        <TopNav />
        <main style={{ paddingTop: 72 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
