"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

type ParsedExperience = {
  type: "EDUCATION" | "INTERNSHIP" | "WORK" | "PROJECT" | "SKILL" | "CERTIFICATE" | "LANGUAGE" | "OTHER";
  title: string;
  description: string;
  skills: string[];
  keywords: string[];
  source: string;
};

export function UploadForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [experiences, setExperiences] = useState<ParsedExperience[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("正在解析并整理为个人资料...");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/upload/preview", { method: "POST", body: formData });
    const result = await response.json();

    setLoading(false);
    if (!response.ok) {
      setMessage(result.error || "解析失败，请稍后重试。");
      return;
    }

    setExperiences(result.experiences || []);
    setMessage(`解析完成，请确认 ${result.experiences?.length || 0} 条资料后保存到个人资料库。`);
    event.currentTarget.reset();
  }

  async function confirmSave() {
    setMessage("正在保存到个人资料中心...");
    const response = await fetch("/api/experiences/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experiences })
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "保存失败，请稍后重试。");
      return;
    }

    setMessage(`已保存 ${result.count} 条资料到个人资料中心。`);
    const focus = getUploadFocusModule(experiences);
    setExperiences([]);
    router.push(`/profile?focus=${focus}`);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-6">
        <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center hover:border-neutral-950">
          <UploadCloud className="h-9 w-9 text-neutral-950" />
          <span className="mt-3 text-sm font-medium text-neutral-950">选择已有简历或经历材料</span>
          <span className="mt-1 text-xs text-neutral-500">支持 PDF、DOCX、TXT。系统会解析并补充个人资料库，不会直接生成最终简历。</span>
          <input name="file" type="file" accept=".pdf,.docx,.txt" className="sr-only" required />
        </label>
        <div className="mt-5 flex items-center gap-3">
          <button disabled={loading} className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "解析中..." : "导入并解析"}
          </button>
          <span className="text-sm text-neutral-600">{message}</span>
        </div>
      </form>

      {experiences.length ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">结构化资料预览</h2>
              <p className="mt-1 text-sm text-neutral-500">请确认这些内容来自你的真实经历，确认后会进入个人资料库，后续生成简历只读取这里的资料。</p>
            </div>
            <button onClick={confirmSave} className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              确认保存到个人资料中心
            </button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {experiences.map((experience, index) => (
              <article key={`${experience.title}-${index}`} className="rounded-md border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500">{experience.type}</div>
                <h3 className="mt-2 font-medium text-neutral-950">{experience.title}</h3>
                <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm leading-6 text-neutral-700">{experience.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function getUploadFocusModule(experiences: ParsedExperience[]) {
  if (experiences.some((experience) => experience.type === "EDUCATION")) return "education";
  if (experiences.some((experience) => experience.type === "PROJECT")) return "project";
  if (experiences.some((experience) => experience.type === "SKILL")) return "skills";

  return "basic";
}
