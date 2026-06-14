"use client";

import { useState } from "react";

const typeOptions = [
  ["EDUCATION", "教育背景"],
  ["INTERNSHIP", "实习经历"],
  ["WORK", "工作经历"],
  ["PROJECT", "项目经历"],
  ["SKILL", "技能"],
  ["CERTIFICATE", "证书"],
  ["LANGUAGE", "语言能力"],
  ["OTHER", "其他"]
];

export function ExperienceForm() {
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const skills = String(formData.get("skills") || "")
      .split(/,|，|\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch("/api/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formData.get("type"),
        title: formData.get("title"),
        organization: formData.get("organization"),
        location: formData.get("location"),
        description: formData.get("description"),
        skills
      })
    });

    setMessage(response.ok ? "已保存到个人经历库。" : "保存失败，请检查必填内容。");
    if (response.ok) form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">
        经历类型
        <select name="type" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" defaultValue="PROJECT">
          {typeOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        标题
        <input name="title" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="例如：用户增长数据分析项目" required />
      </label>
      <label className="text-sm font-medium text-slate-700">
        组织 / 学校 / 公司
        <input name="organization" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="例如：某互联网公司" />
      </label>
      <label className="text-sm font-medium text-slate-700">
        地点
        <input name="location" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="例如：上海" />
      </label>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">
        技能关键词
        <input name="skills" className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="用逗号分隔，例如：SQL、数据分析、用户研究" />
      </label>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">
        真实经历内容
        <textarea name="description" rows={8} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="请写真实职责、动作、成果和可量化结果。AI 只会基于这些内容优化，不会编造。" required />
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button className="rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">保存经历</button>
        <span className="text-sm text-slate-600">{message}</span>
      </div>
    </form>
  );
}
