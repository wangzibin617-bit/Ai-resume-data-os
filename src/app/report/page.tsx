import type { JobDescription, Resume } from "@prisma/client";
import Link from "next/link";
import { DatabaseWarning } from "@/components/DatabaseWarning";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Report = {
  summary?: string;
  matchedExperiences?: string[];
  gaps?: string[];
  suggestions?: string[];
};

type ResumeWithJob = Resume & {
  jobDescription: JobDescription | null;
};

export default async function ReportPage({ searchParams }: { searchParams: { resumeId?: string } }) {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let resume: ResumeWithJob | null = null;

  if (user.databaseAvailable) {
    try {
      resume = searchParams.resumeId
        ? await prisma.resume.findFirst({ where: { id: searchParams.resumeId, userId: user.id }, include: { jobDescription: true } })
        : await prisma.resume.findFirst({ where: { userId: user.id }, include: { jobDescription: true }, orderBy: { updatedAt: "desc" } });
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  const report = (resume?.report || {}) as Report;

  return (
    <>
      <PageHeader title="岗位匹配度报告" description="报告会展示已匹配关键词、相关经历和能力缺口。没有真实经历支撑的要求不会被写进简历。" currentHref="/report" />
      <DatabaseWarning message={dbError} />
      {resume ? (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-500">{resume.jobDescription?.title || "目标岗位"}</div>
            <div className="mt-3 text-5xl font-semibold text-pine">{resume.matchScore}</div>
            <div className="mt-1 text-sm text-slate-500">综合匹配分</div>
            <Link href={`/preview?resumeId=${resume.id}`} className="mt-5 inline-flex rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              编辑简历
            </Link>
          </aside>
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-ink">报告摘要</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{report.summary || "暂无摘要。"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-ink">已匹配关键词</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {resume.matchedKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-pine">{keyword}</span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-ink">匹配经历</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {(report.matchedExperiences || []).map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-ink">能力缺口与建议</h2>
              <div className="mt-3 space-y-2">
                {(report.gaps || resume.gaps).map((gap) => (
                  <div key={gap} className="rounded-md bg-red-50 px-3 py-2 text-sm text-coral">{gap}</div>
                ))}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {(report.suggestions || []).map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </div>
          </section>
        </div>
      ) : (
        <EmptyState title="暂无匹配报告" description="请先生成一份定制简历，系统会同时生成匹配报告。" href="/generate" action="去生成简历" />
      )}
    </>
  );
}
