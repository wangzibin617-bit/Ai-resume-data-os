import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

const flowItems = [
  { href: "/", label: "首页" },
  { href: "/profile", label: "个人资料" },
  { href: "/upload", label: "导入已有简历" },
  { href: "/jd", label: "岗位 JD" },
  { href: "/generate", label: "模板选择" },
  { href: "/preview", label: "简历预览" },
  { href: "/report", label: "匹配报告" },
  { href: "/export", label: "导出简历" }
];

const previousByHref: Record<string, string> = {
  "/profile": "/",
  "/upload": "/profile",
  "/jd": "/profile",
  "/generate": "/jd",
  "/preview": "/generate",
  "/report": "/preview",
  "/export": "/preview",
  "/library": "/profile",
  "/manual": "/profile"
};

export function FlowNav({ currentHref = "/" }: { currentHref?: string }) {
  const previousHref = previousByHref[currentHref] || "/";

  return (
    <div className="mb-4 rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 font-medium text-neutral-800 hover:bg-neutral-50">
            <Home className="h-3.5 w-3.5" />
            返回首页
          </Link>
          {currentHref !== "/" ? (
            <Link href={previousHref} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 font-medium text-neutral-800 hover:bg-neutral-50">
              <ArrowLeft className="h-3.5 w-3.5" />
              返回上一步
            </Link>
          ) : null}
        </div>
        <nav aria-label="当前流程位置" className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
          {flowItems.map((item, index) => (
            <span key={item.href} className="inline-flex items-center gap-1">
              {index > 0 ? <span className="text-neutral-300">/</span> : null}
              <Link
                href={item.href}
                className={item.href === currentHref ? "rounded px-1.5 py-1 font-semibold text-neutral-950" : "rounded px-1.5 py-1 hover:bg-neutral-50 hover:text-neutral-900"}
              >
                {item.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
