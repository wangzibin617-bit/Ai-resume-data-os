import type { JobDescription } from "@prisma/client";
import { DatabaseWarning } from "@/components/DatabaseWarning";
import { JDForm } from "@/components/JDForm";
import { PageHeader } from "@/components/PageHeader";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JDPage() {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let jobDescriptions: JobDescription[] = [];

  if (user.databaseAvailable) {
    try {
      jobDescriptions = await prisma.jobDescription.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5
      });
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  return (
    <>
      <PageHeader title="岗位 JD" description="支持手动粘贴 JD、上传 JD 截图识别、上传 JD 文件解析。系统会提取岗位职责、核心技能、关键词和优先条件。" currentHref="/jd" />
      <DatabaseWarning message={dbError} />
      <JDForm />
      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-950">最近分析的 JD</h2>
        <div className="mt-4 divide-y divide-neutral-100">
          {jobDescriptions.length ? (
            jobDescriptions.map((jd) => (
              <div key={jd.id} className="py-4">
                <div className="font-medium text-neutral-950">
                  {jd.company ? `${jd.company} - ` : ""}
                  {jd.title}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {jd.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700">{keyword}</span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">暂无 JD。请先粘贴、上传图片或上传文件解析目标岗位。</p>
          )}
        </div>
      </section>
    </>
  );
}
