import { getResumeTemplate, pageModeOptions } from "@/lib/resume-templates";
import { sectionContentToLines } from "@/lib/structured-resume";
import type { ResumeSection, StructuredResume } from "@/lib/structured-resume";

function isBullet(line: string) {
  return /^[-•]/.test(line) || line.includes("：");
}

function SectionBlock({
  section,
  templateId,
  compact = false
}: {
  section: ResumeSection;
  templateId: string;
  compact?: boolean;
}) {
  const lines = sectionContentToLines(section.content);
  const headingClass = templateId === "classic-ats"
    ? "border-b border-neutral-500 pb-1 text-[13px] font-bold text-neutral-950"
    : templateId === "modern-business"
      ? "rounded-sm bg-neutral-100 px-2 py-1 text-[13px] font-semibold text-neutral-950"
      : templateId === "campus-recruiting"
        ? "border-l-2 border-neutral-950 pl-2 text-sm font-semibold text-neutral-950"
      : "border-b border-neutral-200 pb-1 text-sm font-semibold text-neutral-950";

  return (
    <section>
      <h2 className={headingClass}>{section.title}</h2>
      <div className={`mt-2 space-y-1 ${compact ? "text-[12px] leading-5" : "text-sm leading-6"} text-neutral-800`}>
        {section.type === "skills" && !Array.isArray(section.content) && typeof section.content === "object" ? (
          <div className="space-y-1.5">
            {Object.entries(section.content).map(([key, value]) => (
              <p key={key}>
                <span className="font-medium text-neutral-950">{key}：</span>
                <span>{Array.isArray(value) ? value.join("、") : String(value)}</span>
              </p>
            ))}
          </div>
        ) : lines.length ? (
          lines.map((line, index) => {
            const bullet = isBullet(line);
            return bullet ? (
              <p key={`${line}-${index}`} className="pl-4 before:-ml-4 before:content-['•_']">{line.replace(/^[-•]\s*/, "")}</p>
            ) : (
              <p key={`${line}-${index}`}>{line}</p>
            );
          })
        ) : (
          <p className="text-neutral-400">待补充</p>
        )}
      </div>
    </section>
  );
}

export function ResumePaper({ resume }: { resume: StructuredResume }) {
  const template = getResumeTemplate(resume.templateId);
  const visibleSections = resume.sections.filter((section) => section.visible).sort((a, b) => a.order - b.order);
  const leftTypes = new Set(["personalInfo", "skills", "languages", "certificates"]);
  const leftSections = visibleSections.filter((section) => leftTypes.has(section.type));
  const rightSections = visibleSections.filter((section) => !leftTypes.has(section.type));
  const pageModeLabel = pageModeOptions.find((mode) => mode.id === resume.pageMode)?.name || "智能一页";

  const pageClass = "min-h-[1123px]";
  const shellClass = template.templateId === "classic-ats"
    ? "border-neutral-300 p-8 shadow-none"
    : template.templateId === "modern-business"
      ? "border-neutral-200 p-10 shadow-sm"
      : template.templateId === "campus-recruiting"
        ? "border-neutral-200 p-10 shadow-sm"
        : "border-neutral-200 p-10 shadow-sm";

  return (
    <div className={`mx-auto w-full max-w-[794px] border bg-white ${pageClass} ${shellClass} print:aspect-auto print:max-w-none print:border-0 print:p-0 print:shadow-none`}>
      <header className={
        template.templateId === "modern-business"
          ? "border-l-4 border-neutral-900 bg-neutral-50 px-4 py-4"
          : template.templateId === "campus-recruiting"
            ? "border-b-2 border-neutral-950 pb-4"
          : template.templateId === "classic-ats"
            ? "border-b border-neutral-900 pb-4"
            : "border-b border-neutral-900 pb-5"
      }>
        <div className={template.templateId === "classic-ats" ? "text-2xl font-bold tracking-normal text-neutral-950" : "text-3xl font-semibold tracking-normal text-neutral-950"}>{resume.title || "中文定制简历"}</div>
        <div className="mt-2 text-sm text-neutral-600">{resume.targetRole || "目标岗位"} · {pageModeLabel} · {template.templateName}</div>
      </header>

      {template.layoutType === "two-column" ? (
        <div className="mt-6 grid grid-cols-[220px_minmax(0,1fr)] gap-8">
          <aside className="space-y-5 border-r border-neutral-200 pr-6">
            {leftSections.map((section) => <SectionBlock key={section.id} section={section} templateId={template.templateId} compact />)}
          </aside>
          <main className="space-y-5">
            {rightSections.map((section) => <SectionBlock key={section.id} section={section} templateId={template.templateId} />)}
          </main>
        </div>
      ) : (
        <div className={template.templateId === "classic-ats" ? "mt-6 space-y-4" : "mt-6 space-y-5"}>
          {visibleSections.map((section) => <SectionBlock key={section.id} section={section} templateId={template.templateId} />)}
        </div>
      )}
    </div>
  );
}
