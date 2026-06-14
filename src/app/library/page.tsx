import type { Experience } from "@prisma/client";
import Link from "next/link";
import { DatabaseWarning } from "@/components/DatabaseWarning";
import { DeleteExperienceButton } from "@/components/DeleteExperienceButton";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  EDUCATION: "教育背景",
  INTERNSHIP: "实习经历",
  WORK: "工作经历",
  PROJECT: "项目经历",
  SKILL: "技能",
  CERTIFICATE: "证书",
  LANGUAGE: "语言能力",
  OTHER: "其他"
};

export default async function LibraryPage() {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let experiences: Experience[] = [];

  if (user.databaseAvailable) {
    try {
      experiences = await prisma.experience.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      });
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  return (
    <>
      <PageHeader
        title="个人经历库"
        description="这里保存用户上传解析和手动录入的所有真实经历，后续 AI 生成简历只能使用这些内容。"
        currentHref="/library"
        action={<Link href="/profile" className="rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">完善个人资料</Link>}
      />
      <DatabaseWarning message={dbError} />
      {experiences.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {experiences.map((experience) => (
            <article key={experience.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-md bg-mist px-2 py-1 text-xs text-slate-600">{typeLabels[experience.type]}</span>
                  <h2 className="mt-3 text-base font-semibold text-ink">{experience.title}</h2>
                  {experience.organization ? <p className="mt-1 text-sm text-slate-500">{experience.organization}</p> : null}
                </div>
                <DeleteExperienceButton id={experience.id} />
              </div>
              <p className="mt-4 line-clamp-5 whitespace-pre-line text-sm leading-6 text-slate-700">{experience.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {experience.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-pine">{keyword}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="经历库还是空的" description="请先上传简历材料，或手动录入真实经历。" href="/upload" action="去上传材料" />
      )}
    </>
  );
}
