"use client";

import { useState } from "react";

type Tab = "manual" | "image" | "file";

export function JDForm() {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawText, setRawText] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("正在分析岗位 JD...");
    const response = await fetch("/api/job-descriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        company,
        rawText
      })
    });

    const result = await response.json();
    setMessage(response.ok ? `分析完成：识别到 ${result.jobDescription.keywords.length} 个关键词。` : result.error || "保存失败。");
    if (response.ok) {
      setTitle("");
      setCompany("");
      setRawText("");
    }
  }

  async function parseImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (file instanceof File) {
      setImagePreview(URL.createObjectURL(file));
    }

    setMessage("正在识别 JD 图片...");
    const response = await fetch("/api/job-descriptions/image-parse", { method: "POST", body: formData });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "JD 图片识别失败。");
      return;
    }

    setTitle(result.job_title || title);
    setCompany(result.company_name || company);
    setRawText(result.raw_jd_text || "");
    setMessage(result.unclear_parts?.length ? "识别完成，但部分内容无法识别，请手动检查。" : "JD 图片识别完成，请确认后分析岗位 JD。");
    setActiveTab("manual");
  }

  async function parseFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setMessage("正在解析 JD 文件...");
    const response = await fetch("/api/job-descriptions/file-parse", { method: "POST", body: formData });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "JD 文件解析失败。");
      return;
    }

    setRawText(result.rawText || "");
    setMessage("JD 文件解析完成，请确认后分析岗位 JD。");
    setActiveTab("manual");
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        {[
          ["manual", "手动粘贴 JD"],
          ["image", "上传 JD 图片"],
          ["file", "上传 JD 文件"]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as Tab)}
            className={activeTab === key ? "rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white" : "rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "image" ? (
        <form onSubmit={parseImage} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            上传岗位 JD 截图
            <input name="file" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="mt-2 block w-full rounded-md border border-neutral-300 px-3 py-2" required />
          </label>
          {imagePreview ? <img src={imagePreview} alt="JD 截图预览" className="max-h-80 rounded-md border border-neutral-200 object-contain" /> : null}
          <button className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">识别 JD 图片</button>
        </form>
      ) : null}

      {activeTab === "file" ? (
        <form onSubmit={parseFile} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-neutral-700">
            上传 JD 文件
            <input name="file" type="file" accept=".pdf,.docx,.txt" className="mt-2 block w-full rounded-md border border-neutral-300 px-3 py-2" required />
          </label>
          <button className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">解析 JD 文件</button>
        </form>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-neutral-700">
          岗位名称
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="例如：产品经理实习生" required />
        </label>
        <label className="text-sm font-medium text-neutral-700">
          公司名称
          <input value={company} onChange={(event) => setCompany(event.target.value)} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="可选" />
        </label>
        <label className="text-sm font-medium text-neutral-700 md:col-span-2">
          岗位 JD
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={14} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="粘贴完整岗位职责、任职要求、加分项等内容，或先通过图片 / 文件识别填入。" required />
        </label>
        <div className="flex items-center gap-3 md:col-span-2">
          <button className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">分析岗位 JD</button>
          <span className="text-sm text-neutral-600">{message}</span>
        </div>
      </form>
    </div>
  );
}
