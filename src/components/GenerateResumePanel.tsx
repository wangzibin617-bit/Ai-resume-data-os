"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { pageModeOptions, resumeTemplates } from "@/lib/resume-templates";
import type { PageMode, ResumeTemplateId } from "@/lib/resume-templates";

export function GenerateResumePanel({
  jobDescriptions
}: {
  jobDescriptions: Array<{ id: string; title: string; company: string | null; keywords: string[] }>;
}) {
  const [message, setMessage] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [templateId, setTemplateId] = useState<ResumeTemplateId>("black-minimal");
  const [pageMode, setPageMode] = useState<PageMode>("smart-one-page");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage("正在按模板匹配资料并生成结构化简历...");

    const response = await fetch("/api/resumes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescriptionId: formData.get("jobDescriptionId"),
        templateId,
        pageMode
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "生成失败，请先补充个人资料。");
      return;
    }

    setResumeId(result.resume.id);
    setMessage(`生成完成，匹配分：${result.resume.matchScore}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-neutral-200 bg-white p-6">
      <label className="block text-sm font-medium text-neutral-700">
        选择目标岗位
        <select name="jobDescriptionId" className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2" required>
          <option value="">请选择已分析的 JD</option>
          {jobDescriptions.map((jd) => (
            <option key={jd.id} value={jd.id}>
              {jd.company ? `${jd.company} - ` : ""}
              {jd.title}
            </option>
          ))}
        </select>
      </label>

      <section>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-neutral-950">模板选择</h2>
          <p className="text-xs leading-5 text-neutral-500">模板会影响真实版式、栏目顺序、技能呈现和导出结构，不只是颜色变化。</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {resumeTemplates.map((template) => (
            <label key={template.templateId} className={`cursor-pointer rounded-lg border p-4 ${templateId === template.templateId ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 bg-white"}`}>
              <input type="radio" name="templateId" value={template.templateId} checked={templateId === template.templateId} onChange={() => setTemplateId(template.templateId)} className="sr-only" />
              <span className="block text-sm font-semibold text-neutral-950">{template.templateName}</span>
              <span className="mt-2 block text-xs leading-5 text-neutral-500">{template.description}</span>
              <span className="mt-3 block text-xs text-neutral-500">{template.atsNote}</span>
              <span className={`mt-3 inline-flex rounded px-2 py-1 text-xs ${template.isAtsFriendly ? "bg-neutral-100 text-neutral-700" : "bg-amber-50 text-amber-800"}`}>
                {template.isAtsFriendly ? "ATS 友好" : "更适合人工阅读"}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-neutral-950">内容密度模式</h2>
          <p className="text-xs leading-5 text-neutral-500">页数模式会影响 AI 压缩策略、模块优先级和模板排版能力，不会通过截断内容实现。</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {pageModeOptions.map((mode) => (
            <label key={mode.id} className={`cursor-pointer rounded-lg border p-4 ${pageMode === mode.id ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 bg-white"}`}>
              <input type="radio" checked={pageMode === mode.id} onChange={() => setPageMode(mode.id)} className="sr-only" />
              <span className="block text-sm font-semibold text-neutral-950">{mode.name}</span>
              <span className="mt-2 block text-xs font-medium text-neutral-500">{mode.suitableFor}</span>
              <span className="mt-2 block text-xs leading-5 text-neutral-500">{mode.description}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          <Wand2 className="h-4 w-4" />
          生成定制简历
        </button>
        <span className="text-sm text-neutral-600">{message}</span>
      </div>

      {resumeId ? (
        <div className="flex gap-3">
          <a className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50" href={`/preview?resumeId=${resumeId}`}>
            前往预览编辑
          </a>
          <a className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50" href={`/report?resumeId=${resumeId}`}>
            查看匹配报告
          </a>
        </div>
      ) : null}
    </form>
  );
}
