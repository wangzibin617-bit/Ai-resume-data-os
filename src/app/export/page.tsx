import type { Resume } from "@prisma/client";
import { DatabaseWarning } from "@/components/DatabaseWarning";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ResumeDownloadButtons } from "@/components/ResumeDownloadButtons";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";
import { getResumeTemplate, pageModeOptions } from "@/lib/resume-templates";
import { parseStructuredResume } from "@/lib/structured-resume";

export const dynamic = "force-dynamic";

const exportCards = [
  { format: "PDF 简历", description: "适合正式投递和在线上传。" },
  { format: "Word 简历", description: "适合继续编辑和微调排版。" },
  { format: "TXT 文本", description: "适合粘贴到招聘系统或 ATS 表单。" }
];

export default async function ExportPage() {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let resumes: Resume[] = [];

  if (user.databaseAvailable) {
    try {
      resumes = await prisma.resume.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" }
      });
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  const latestResume = resumes[0];
  const latestDraft = latestResume ? parseStructuredResume(latestResume.content, { title: latestResume.title }) : null;
  const latestTemplate = latestDraft ? getResumeTemplate(latestDraft.templateId) : null;
  const pageModeLabel = latestDraft ? pageModeOptions.find((mode) => mode.id === latestDraft.pageMode)?.name : "";

  return (
    <>
      <PageHeader title="导出简历" description="选择简历模板和文件格式，下载当前已生成的简历。导出内容不会额外生成虚构信息。" currentHref="/export" />
      <DatabaseWarning message={dbError} />
      {latestResume ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-950">当前导出模板</h2>
            <div className="mt-4 rounded-md border border-neutral-200 p-4">
              <div className="text-sm font-semibold text-neutral-950">{latestTemplate?.templateName}</div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">{latestTemplate?.description}</p>
              <p className="mt-3 text-xs text-neutral-500">{pageModeLabel} · {latestTemplate?.layoutType === "two-column" ? "双栏布局" : "单栏布局"}</p>
              {latestTemplate && !latestTemplate.isAtsFriendly ? (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">{latestTemplate.atsNote}</p>
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              如需调整模板、隐藏模块或修改文字，请先进入简历预览页保存版本，再回到这里导出。
            </p>
          </aside>
          <section className="space-y-5">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="font-semibold text-neutral-950">{latestResume.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">匹配分 {latestResume.matchScore} · 最后更新 {latestResume.updatedAt.toLocaleString("zh-CN")}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {exportCards.map((card) => (
                <article key={card.format} className="rounded-lg border border-neutral-200 bg-white p-5">
                  <h3 className="font-semibold text-neutral-950">{card.format}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-neutral-500">{card.description}</p>
                </article>
              ))}
            </div>
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-base font-semibold text-neutral-950">下载文件</h2>
              <p className="mt-1 text-sm text-neutral-500">PDF、Word 和 TXT 均从同一份当前简历内容导出。</p>
              <div className="mt-4">
                <ResumeDownloadButtons resumeId={latestResume.id} title={latestResume.title} draft={latestDraft || undefined} />
              </div>
            </section>
          </section>
        </div>
      ) : (
        <EmptyState title="请先生成一份简历后再导出。" description="完成个人资料、输入岗位 JD，并生成定制简历后，这里会显示 PDF、Word 和 TXT 下载入口。" href="/generate" action="去生成简历" />
      )}
    </>
  );
}
