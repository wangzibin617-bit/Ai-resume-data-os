"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { StructuredResume } from "@/lib/structured-resume";

type Format = "pdf" | "docx" | "txt";

const labels: Record<Format, string> = {
  pdf: "PDF",
  docx: "Word",
  txt: "TXT"
};

export function ResumeDownloadButtons({
  resumeId,
  title,
  draft,
  disabledMessage = "请先生成简历。"
}: {
  resumeId?: string | null;
  title?: string;
  draft?: StructuredResume;
  disabledMessage?: string;
}) {
  const [message, setMessage] = useState("");

  async function download(format: Format) {
    if (!resumeId) {
      setMessage(format === "pdf" ? "请先生成简历后再下载 PDF。" : disabledMessage);
      return;
    }

    if (format === "pdf") {
      setMessage("PDF 将通过浏览器打印方式生成，可避免中文乱码。");
      let printUrl = `/preview/print?resumeId=${encodeURIComponent(resumeId)}&template=${encodeURIComponent(draft?.templateId || "black-minimal")}&pageMode=${encodeURIComponent(draft?.pageMode || "smart-one-page")}`;
      if (draft) {
        const draftKey = `resume-draft-${resumeId}`;
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
        printUrl += `&draftKey=${encodeURIComponent(draftKey)}`;
      }
      window.open(printUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const label = labels[format];
    setMessage(`正在生成 ${label}...`);

    try {
      const response = draft
        ? await fetch("/api/resumes/export-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format, resume: draft })
        })
        : await fetch(`/api/resumes/${resumeId}/export?format=${format}`);
      if (!response.ok) throw new Error(await response.text());

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `简历-${title || "定制简历"}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage(`${label} 下载成功`);
    } catch (error) {
      console.error(`${label} 下载失败`, error);
      setMessage(`${label} 下载失败，请稍后重试`);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["pdf", "docx", "txt"] as Format[]).map((format) => {
          const disabled = !resumeId;
          return (
            <button
              key={format}
              type="button"
              onClick={() => download(format)}
              aria-disabled={disabled}
              className={format === "pdf"
                ? `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white ${disabled ? "cursor-not-allowed bg-neutral-400" : "bg-neutral-950 hover:bg-neutral-800"}`
                : `inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium ${disabled ? "cursor-not-allowed bg-neutral-100 text-neutral-400" : "bg-white text-neutral-800 hover:bg-neutral-50"}`}
            >
              <Download className="h-4 w-4" />
              下载 {labels[format]}
            </button>
          );
        })}
      </div>
      {message ? <p className="mt-2 text-sm text-neutral-600">{message}</p> : null}
    </div>
  );
}
