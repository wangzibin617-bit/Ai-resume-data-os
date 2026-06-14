"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Home, RefreshCcw, Save, SquarePen, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { ResumeDownloadButtons } from "@/components/ResumeDownloadButtons";
import { ResumePaper } from "@/components/ResumePaper";
import { getResumeTemplate, pageModeOptions, resumeTemplates } from "@/lib/resume-templates";
import type { PageMode, ResumeTemplateId } from "@/lib/resume-templates";
import { estimateResumePages, parseStructuredResume, sectionContentToLines } from "@/lib/structured-resume";
import type { ResumeSection, StructuredResume } from "@/lib/structured-resume";

export function ResumeEditor({
  resume
}: {
  resume: {
    id: string;
    title: string;
    content: string;
    matchScore: number;
    matchedKeywords: string[];
    gaps: string[];
  };
}) {
  const initialResume = useMemo(() => parseStructuredResume(resume.content, { title: resume.title }), [resume.content, resume.title]);
  const [draft, setDraft] = useState<StructuredResume>(initialResume);
  const [message, setMessage] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const sortedSections = [...draft.sections].sort((a, b) => a.order - b.order);
  const currentTemplate = getResumeTemplate(draft.templateId);
  const estimatedPages = estimateResumePages(draft);

  function updateSectionContent(id: string, value: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === id ? { ...section, content: value } : section)
    }));
  }

  function toggleSection(id: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === id ? { ...section, visible: !section.visible } : section)
    }));
  }

  function deleteSection(id: string) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === id ? { ...section, visible: false, content: "" } : section)
    }));
  }

  function reorderSections(sections: ResumeSection[]) {
    return sections.map((section, order) => ({ ...section, order }));
  }

  function moveSection(id: string, direction: -1 | 1) {
    const ordered = [...sortedSections];
    const index = ordered.findIndex((section) => section.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
    setDraft((current) => ({
      ...current,
      sections: reorderSections(ordered)
    }));
  }

  function dropSection(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const ordered = [...sortedSections];
    const fromIndex = ordered.findIndex((section) => section.id === draggingId);
    const toIndex = ordered.findIndex((section) => section.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    setDraft((current) => ({ ...current, sections: reorderSections(ordered) }));
    setDraggingId("");
  }

  function applyTemplate(templateId: ResumeTemplateId) {
    const template = getResumeTemplate(templateId);
    setDraft((current) => {
      const sectionMap = new Map(current.sections.map((section) => [section.type, section]));
      const ordered = template.defaultSections
        .map((type, order) => {
          const section = sectionMap.get(type);
          return section ? { ...section, order } : null;
        })
        .filter(Boolean) as ResumeSection[];
      return { ...current, templateId, sections: ordered };
    });
  }

  async function saveVersion() {
    setMessage("正在保存新版本...");
    const response = await fetch(`/api/resumes/${resume.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: JSON.stringify(draft), note: "用户在预览页调整模板和模块" })
    });
    setMessage(response.ok ? "已保存为新的简历版本。" : "保存失败，请稍后重试。");
  }

  return (
    <div className="space-y-5">
      <section className="sticky top-0 z-20 rounded-lg border border-neutral-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              <Home className="h-4 w-4" />
              返回首页
            </Link>
            <Link href="/generate" className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              <RefreshCcw className="h-4 w-4" />
              重新生成
            </Link>
            <Link href="/jd" className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              <SquarePen className="h-4 w-4" />
              修改 JD
            </Link>
            <button onClick={saveVersion} className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              <Save className="h-4 w-4" />
              保存版本
            </button>
          </div>
          <ResumeDownloadButtons resumeId={resume.id} title={draft.title} draft={draft} />
        </div>
        {message ? <p className="mt-2 text-sm text-neutral-600">{message}</p> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <section className="rounded-lg border border-neutral-200 bg-neutral-100 p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-950">真实简历模板预览</h2>
            <p className="mt-1 text-sm text-neutral-500">
              当前模板：{currentTemplate.templateName} · {pageModeOptions.find((mode) => mode.id === draft.pageMode)?.name} · 预计页数：{estimatedPages.toFixed(1)} 页
            </p>
          </div>
          <ResumePaper resume={draft} />
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-950">模板设置</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">所有模板共享同一份结构化内容，切换后会自动适配栏目顺序和版式。</p>
            <div className="mt-3 grid gap-3">
              {resumeTemplates.map((template) => (
                <label key={template.templateId} className={`cursor-pointer rounded-md border p-3 ${draft.templateId === template.templateId ? "border-neutral-950 bg-neutral-50" : "border-neutral-200"}`}>
                  <input className="sr-only" type="radio" checked={draft.templateId === template.templateId} onChange={() => applyTemplate(template.templateId)} />
                  <span className="block text-sm font-semibold text-neutral-950">{template.templateName}</span>
                  <span className="mt-1 block text-xs leading-5 text-neutral-500">{template.description}</span>
                  <span className={`mt-2 inline-flex rounded px-2 py-1 text-xs ${template.isAtsFriendly ? "bg-neutral-100 text-neutral-700" : "bg-amber-50 text-amber-800"}`}>{template.atsNote}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {pageModeOptions.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, pageMode: mode.id as PageMode }))}
                  className={draft.pageMode === mode.id ? "rounded-md bg-neutral-950 px-3 py-2 text-left text-sm text-white" : "rounded-md border border-neutral-300 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"}
                >
                  <span className="block font-medium">{mode.name}</span>
                  <span className={draft.pageMode === mode.id ? "mt-1 block text-xs text-neutral-200" : "mt-1 block text-xs text-neutral-500"}>{mode.suitableFor}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <div className="text-xs font-medium text-neutral-500">预计页数</div>
              <div className="mt-1 text-2xl font-semibold text-neutral-950">{estimatedPages.toFixed(1)} 页</div>
              <p className="mt-1 text-xs leading-5 text-neutral-500">估算基于当前模块、文字密度和模板布局；不会通过截断正文控制页数。</p>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-950">简历模块管理</h2>
            <div className="mt-3 space-y-2">
              {sortedSections.map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => setDraggingId(section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropSection(section.id)}
                  className={`rounded-md border p-3 ${draggingId === section.id ? "border-neutral-950 bg-neutral-50" : "border-neutral-200"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                      <input type="checkbox" checked={section.visible} onChange={() => toggleSection(section.id)} />
                      {section.title}
                    </label>
                    <div className="flex gap-1">
                      <span className="cursor-grab rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-500">拖拽</span>
                      <button type="button" onClick={() => moveSection(section.id, -1)} className="rounded border border-neutral-200 p-1"><ArrowUp className="h-3 w-3" /></button>
                      <button type="button" onClick={() => moveSection(section.id, 1)} className="rounded border border-neutral-200 p-1"><ArrowDown className="h-3 w-3" /></button>
                      <button type="button" onClick={() => deleteSection(section.id)} className="rounded border border-neutral-200 p-1 text-red-600"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <textarea value={sectionContentToLines(section.content).join("\n")} onChange={(event) => updateSectionContent(section.id, event.target.value)} className="mt-2 min-h-20 w-full rounded-md border border-neutral-200 p-2 text-xs leading-5" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-950">匹配概览</h2>
            <div className="mt-4 text-4xl font-semibold text-neutral-950">{resume.matchScore}</div>
            <p className="mt-1 text-sm text-neutral-500">岗位匹配分</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {resume.matchedKeywords.length ? resume.matchedKeywords.map((keyword) => <span key={keyword} className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-800">{keyword}</span>) : <span className="text-sm text-neutral-500">暂无关键词</span>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
