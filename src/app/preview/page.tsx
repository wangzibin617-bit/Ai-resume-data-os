import type { Resume } from "@prisma/client";
import { DatabaseWarning } from "@/components/DatabaseWarning";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ResumeDownloadButtons } from "@/components/ResumeDownloadButtons";
import { ResumeEditor } from "@/components/ResumeEditor";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ searchParams }: { searchParams: { resumeId?: string } }) {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let selectedResume: Resume | null = null;

  if (user.databaseAvailable) {
    try {
      selectedResume = searchParams.resumeId
        ? await prisma.resume.findFirst({ where: { id: searchParams.resumeId, userId: user.id } })
        : await prisma.resume.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  return (
    <>
      <PageHeader
        title="简历预览"
        description="左侧查看真实简历纸张效果，右侧编辑内容、保存版本，并通过浏览器打印方式生成中文 PDF。"
        currentHref="/preview"
        action={<ResumeDownloadButtons resumeId={selectedResume?.id} title={selectedResume?.title} />}
      />
      <DatabaseWarning message={dbError} />
      {selectedResume ? (
        <ResumeEditor resume={selectedResume} />
      ) : (
        <EmptyState title="暂无可预览简历" description="请先生成简历后再下载 PDF。" href="/generate" action="去生成简历" />
      )}
    </>
  );
}
