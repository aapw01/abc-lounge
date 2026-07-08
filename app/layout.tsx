import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "农行境外贵宾休息室查询",
  description: "按州、国家、城市、机场、航站楼和安检类型查询农行境外贵宾休息室。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
