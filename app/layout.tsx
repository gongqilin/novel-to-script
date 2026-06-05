import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小说转剧本工具",
  description: "AI 驱动的小说转剧本工具，使用 DeepSeek 模型",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
