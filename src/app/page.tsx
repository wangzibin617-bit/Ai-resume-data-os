import type { Resume } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FileText, IdCard, Upload, Wand2 } from "lucide-react";
import { DatabaseWarning } from "@/components/DatabaseWarning";
import { PageHeader } from "@/components/PageHeader";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";
import { calculateProfileCompleteness, profileModules } from "@/lib/profile-modules";

export const dynamic = "force-dynamic";

const flow = [
  {
    title: "完善个人资料",
    description: "维护基本信息、教育、实习、项目、技能、证书和语言能力。",
    href: "/profile",
    action: "进入个人资料",
    icon: IdCard,
    required: true
  },
  {
    title: "导入已有简历（可选）",
    description: "上传 PDF、Word 或 TXT，系统解析后补充到个人资料库。",
    href: "/upload",
    action: "导入已有简历",
    icon: Upload,
    required: false
  },
  {
    title: "输入岗位 JD",
    description: "保存目标岗位职责、关键词、技能要求和优先条件。",
    href: "/jd",
    action: "输入 JD",
    icon: BriefcaseBusiness,
    required: true
  },
  {
    title: "选择模板",
    description: "选择固定简历模板和内容密度，生成前确认资料完整度。",
    href: "/generate",
    action: "选择模板生成",
    icon: Wand2,
    required: true
  },
  {
    title: "生成简历",
    description: "AI 只基于个人资料库中的真实资料生成定制简历。",
    href: "/generate",
    action: "生成简历",
    icon: FileText,
    required: true
  }
];

export default async function DashboardPage() {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let jdCount = 0;
  let resumeCount = 0;
  let latestResumes: Resume[] = [];
  let experiences: Array<{ type: string; title: string; source: string }> = [];

  if (user.databaseAvailable) {
    try {
      [experiences, jdCount, resumeCount, latestResumes] = await Promise.all([
        prisma.experience.findMany({
          where: { userId: user.id },
          select: { type: true, title: true, source: true }
        }),
        prisma.jobDescription.count({ where: { userId: user.id } }),
        prisma.resume.count({ where: { userId: user.id } }),
        prisma.resume.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 4 })
      ]);
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  const completeness = calculateProfileCompleteness(experiences);
  const missingModules = profileModules.filter((module) => !completeness.completedIds.has(module.id));

  return (
    <>
      <PageHeader
        title="AI 智能简历优化"
        description="先建立个人资料库，再输入岗位 JD，选择模板并生成定制简历。上传已有简历只是补全资料的可选入口。"
        currentHref="/"
      />
      <DatabaseWarning message={dbError} />

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">核心流程</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {flow.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Link key={`${step.title}-${index}`} href={step.href} className="group rounded-lg border border-neutral-200 p-4 hover:border-neutral-950 hover:bg-neutral-50">
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-5 w-5 text-neutral-950" />
                      <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600">步骤 {index + 1}</span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-neutral-950">{step.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-neutral-600">{step.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-neutral-950">
                      {step.action}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">资料完整度</h2>
                <p className="mt-1 text-sm text-neutral-600">{completeness.completedCount}/{completeness.totalCount} 个模块已完成</p>
              </div>
              <div className="text-3xl font-semibold text-neutral-950">{completeness.percent}%</div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-neutral-950" style={{ width: `${completeness.percent}%` }} />
            </div>
            <div className="mt-4 space-y-2">
              {profileModules.slice(0, 5).map((module) => (
                <div key={module.id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{module.title}</span>
                  <span className={completeness.completedIds.has(module.id) ? "text-neutral-950" : "text-neutral-500"}>
                    {completeness.completedIds.has(module.id) ? "已完成" : "缺失"}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/profile" className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              完善个人资料
            </Link>
          </aside>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">岗位 JD</div>
          <div className="mt-3 text-3xl font-semibold text-neutral-950">{jdCount}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">已生成简历</div>
          <div className="mt-3 text-3xl font-semibold text-neutral-950">{resumeCount}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="text-sm text-neutral-500">下一步建议</div>
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-950">
            <CheckCircle2 className="h-4 w-4" />
            {missingModules.length ? `补充${missingModules[0].title}` : jdCount ? "选择模板生成简历" : "输入岗位 JD"}
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-950">最近简历</h2>
        <div className="mt-4 divide-y divide-neutral-100">
          {latestResumes.length ? (
            latestResumes.map((resume) => (
              <Link key={resume.id} href={`/preview?resumeId=${resume.id}`} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-neutral-950">{resume.title}</span>
                <span className="text-sm text-neutral-500">匹配分 {resume.matchScore}</span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-neutral-500">还没有生成简历。先完善个人资料，再输入岗位 JD 并选择模板生成。</p>
          )}
        </div>
      </section>
    </>
  );
}
