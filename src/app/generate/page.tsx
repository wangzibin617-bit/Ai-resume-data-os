import type { JobDescription } from "@prisma/client";
import Link from "next/link";
import { DatabaseWarning } from "@/components/DatabaseWarning";
import { EmptyState } from "@/components/EmptyState";
import { GenerateResumePanel } from "@/components/GenerateResumePanel";
import { PageHeader } from "@/components/PageHeader";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";
import { calculateProfileCompleteness, profileModules } from "@/lib/profile-modules";

export const dynamic = "force-dynamic";

const flow = [
  "从个人资料库读取真实经历",
  "分析岗位 JD",
  "选择固定简历模板",
  "选择智能一页 / 标准版 / 完整版",
  "只基于真实资料进行简历包装",
  "生成定制简历和匹配度报告"
];

export default async function GeneratePage() {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let jobDescriptions: JobDescription[] = [];
  let experienceCount = 0;
  let profileSignals: Array<{ type: string; title: string; source: string }> = [];

  if (user.databaseAvailable) {
    try {
      [jobDescriptions, experienceCount, profileSignals] = await Promise.all([
        prisma.jobDescription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
        prisma.experience.count({ where: { userId: user.id } }),
        prisma.experience.findMany({
          where: { userId: user.id },
          select: { type: true, title: true, source: true }
        })
      ]);
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  const completeness = calculateProfileCompleteness(profileSignals);
  const missingModules = profileModules.filter((module) => !completeness.completedIds.has(module.id));

  return (
    <>
      <PageHeader title="模板选择与生成" description="个人资料中心 + 岗位 JD + 固定模板 = 定制简历。先选择模板和内容密度，再让 AI 基于真实资料生成结构化简历。" currentHref="/generate" />
      <DatabaseWarning message={dbError} />

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-950">生成流程</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {flow.map((item, index) => (
            <div key={item} className="rounded-md border border-neutral-200 p-4">
              <div className="text-xs font-semibold text-neutral-400">步骤 {index + 1}</div>
              <div className="mt-2 text-sm leading-6 text-neutral-800">{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">生成前资料检查</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              当前个人资料完整度 {completeness.percent}%。AI 生成时只读取个人资料库中的真实资料，不依赖上传文件缓存。
            </p>
          </div>
          <div className="min-w-32 rounded-md bg-neutral-950 px-4 py-3 text-center text-white">
            <div className="text-2xl font-semibold">{completeness.percent}%</div>
            <div className="text-xs text-neutral-300">资料完整度</div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {profileModules.map((module) => {
            const done = completeness.completedIds.has(module.id);
            return (
              <div key={module.id} className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
                <span className="text-neutral-700">{module.title}</span>
                <span className={done ? "font-medium text-neutral-950" : "text-neutral-500"}>{done ? "已完成" : "缺失"}</span>
              </div>
            );
          })}
        </div>
        {missingModules.length ? (
          <p className="mt-3 text-sm text-neutral-600">建议先补充：{missingModules.slice(0, 4).map((module) => module.title).join("、")}。</p>
        ) : null}
      </section>

      {experienceCount === 0 ? (
        <EmptyState title="请先补充个人资料" description="AI 不能编造经历，所以需要先填写个人资料或上传真实材料。" href="/profile" action="去填写个人资料" />
      ) : jobDescriptions.length === 0 ? (
        <EmptyState title="请先输入岗位 JD" description="生成定制简历前，需要先分析目标岗位要求。" href="/jd" action="输入 JD" />
      ) : (
        <>
          <GenerateResumePanel jobDescriptions={jobDescriptions} />
          <div className="mt-5 text-sm text-neutral-600">
            生成后可前往 <Link className="font-medium text-neutral-950 underline" href="/preview">简历预览</Link> 保存新版本，或到导出页下载文件。
          </div>
        </>
      )}
    </>
  );
}
