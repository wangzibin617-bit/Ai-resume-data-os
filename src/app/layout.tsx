import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, BriefcaseBusiness, Download, FileText, Home, IdCard, Upload, Wand2 } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 智能简历优化",
  description: "中文版 AI 智能简历优化小程序 MVP"
};

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/profile", label: "个人资料", icon: IdCard },
  { href: "/upload", label: "导入已有简历", icon: Upload },
  { href: "/jd", label: "岗位 JD", icon: BriefcaseBusiness },
  { href: "/generate", label: "模板与生成", icon: Wand2 },
  { href: "/preview", label: "简历预览", icon: FileText },
  { href: "/report", label: "匹配报告", icon: BarChart3 },
  { href: "/export", label: "导出简历", icon: Download }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-neutral-50 text-neutral-950">
          <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-neutral-200 bg-white px-4 py-6 lg:block">
            <Link href="/" className="block px-3">
              <div className="text-xl font-semibold tracking-tight text-neutral-950">AI 智能简历优化</div>
              <div className="mt-1 text-sm text-neutral-500">中文求职版 MVP</div>
            </Link>
            <nav className="mt-8 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="lg:pl-64">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
