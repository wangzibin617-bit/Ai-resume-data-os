import { PrintResumeClient } from "@/components/PrintResumeClient";
import { getDemoUser, prisma } from "@/lib/prisma";
import { parseStructuredResume } from "@/lib/structured-resume";

export const dynamic = "force-dynamic";

export default async function PrintResumePage({
  searchParams
}: {
  searchParams: { resumeId?: string; template?: string; pageMode?: string; draftKey?: string };
}) {
  const user = await getDemoUser();
  const resume = searchParams.resumeId
    ? await prisma.resume.findFirst({ where: { id: searchParams.resumeId, userId: user.id } })
    : await prisma.resume.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });

  if (!resume) {
    return (
      <main className="p-8">
        <p className="text-sm text-neutral-700">请先生成简历后再打印 PDF。</p>
      </main>
    );
  }

  const structuredResume = parseStructuredResume(resume.content, {
    title: resume.title,
    templateId: searchParams.template,
    pageMode: searchParams.pageMode
  });

  return (
    <main className="min-h-screen bg-neutral-100 p-6 print:bg-white print:p-0">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          body { background: white !important; }
        }
      `}</style>
      <PrintResumeClient initialResume={structuredResume} draftKey={searchParams.draftKey} />
    </main>
  );
}
