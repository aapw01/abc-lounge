import type { Metadata } from "next";
import "./globals.css";

const siteTitle = "农行 Visa 全球支付尊享白金卡境外贵宾厅查询";
const siteDescription =
  "查询农业银行、农行 Visa 全球支付尊享白金卡可用的境外机场贵宾厅，支持按州、国家、城市、机场、航站楼和三字码筛选。";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: "%s | 农行境外贵宾厅查询"
  },
  description: siteDescription,
  applicationName: "农行境外贵宾厅查询",
  keywords: [
    "农行visa全球支付尊享白金卡境外贵宾厅",
    "农行境外贵宾厅",
    "农业银行境外贵宾厅",
    "农业银行贵宾厅",
    "农行全球支付白金卡贵宾厅",
    "农行 Visa 全球支付尊享白金卡",
    "境外机场贵宾厅查询",
    "机场贵宾休息室",
    "DragonPass 贵宾厅",
    "ABC DragonPass"
  ],
  robots: {
    index: true,
    follow: true
  },
  verification: {
    google: "TWxiQBac7wcvNc_0WYZvrYAN67QS6bmN1kFjlXtud0A"
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "农行境外贵宾厅查询",
    locale: "zh_CN",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
