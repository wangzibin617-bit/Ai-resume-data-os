"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { calculateProfileCompleteness, inferProfileModuleId, profileModules } from "@/lib/profile-modules";
import type { ProfileModuleId, ProfileModuleSummary } from "@/lib/profile-modules";

type ExperienceType = "EDUCATION" | "INTERNSHIP" | "WORK" | "PROJECT" | "SKILL" | "CERTIFICATE" | "LANGUAGE" | "OTHER";

type ProfileExperience = {
  id: string;
  type: ExperienceType;
  title: string;
  organization: string | null;
  location: string | null;
  description: string;
  skills: string[];
  keywords: string[];
  source: string;
  createdAt?: string;
  updatedAt?: string;
};

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
};

type ProfileModuleConfig = ProfileModuleSummary & {
  buttonLabel: string;
  emptyText: string;
  titleField: string;
  organizationField?: string;
  skillsField?: string;
  fields: FieldConfig[];
};

const modules: ProfileModuleConfig[] = [
  {
    ...profileModules[0],
    buttonLabel: "保存基本信息",
    emptyText: "先填写姓名、联系方式、城市和求职方向。",
    titleField: "name",
    organizationField: "city",
    fields: [
      { name: "name", label: "姓名", placeholder: "例如：张三" },
      { name: "email", label: "邮箱", placeholder: "name@example.com" },
      { name: "phone", label: "手机号", placeholder: "例如：13800000000" },
      { name: "city", label: "所在城市", placeholder: "例如：上海" },
      { name: "direction", label: "求职方向", placeholder: "例如：AI 产品实习生" },
      { name: "status", label: "当前身份", placeholder: "应届生 / 实习生 / 在职 / 转行" },
      { name: "summary", label: "个人简介", placeholder: "简要说明你的背景、优势和目标岗位方向。", textarea: true }
    ]
  },
  {
    ...profileModules[1],
    buttonLabel: "添加教育背景",
    emptyText: "添加学校、专业、学历、时间和相关课程。",
    titleField: "school",
    organizationField: "school",
    fields: [
      { name: "school", label: "学校", placeholder: "例如：上海大学" },
      { name: "major", label: "专业", placeholder: "例如：计算机科学与技术" },
      { name: "degree", label: "学历", placeholder: "例如：本科" },
      { name: "start", label: "入学时间", placeholder: "例如：2022.09" },
      { name: "end", label: "毕业时间", placeholder: "例如：2026.06" },
      { name: "courses", label: "相关课程", placeholder: "用逗号分隔，例如：数据结构、数据库、产品设计", textarea: true }
    ]
  },
  {
    ...profileModules[2],
    buttonLabel: "添加实习经历",
    emptyText: "添加公司、岗位、工作内容、成果和技能。",
    titleField: "role",
    organizationField: "company",
    skillsField: "skills",
    fields: [
      { name: "company", label: "公司名称", placeholder: "例如：某互联网公司" },
      { name: "role", label: "岗位名称", placeholder: "例如：产品运营实习生" },
      { name: "time", label: "时间", placeholder: "例如：2025.03-2025.08" },
      { name: "work", label: "工作内容", textarea: true },
      { name: "result", label: "项目成果", textarea: true },
      { name: "skills", label: "使用技能", placeholder: "SQL、Excel、用户调研" }
    ]
  },
  {
    ...profileModules[3],
    buttonLabel: "添加项目经历",
    emptyText: "添加项目名称、角色、贡献、工具和结果。",
    titleField: "project",
    organizationField: "role",
    skillsField: "tools",
    fields: [
      { name: "project", label: "项目名称", placeholder: "例如：AI 简历优化系统" },
      { name: "role", label: "项目角色", placeholder: "例如：产品负责人 / 前端开发" },
      { name: "time", label: "项目时间", placeholder: "例如：2026.05-2026.06" },
      { name: "description", label: "项目描述", textarea: true },
      { name: "contribution", label: "个人贡献", textarea: true },
      { name: "tools", label: "使用工具 / 技能", placeholder: "Next.js、Prisma、PostgreSQL" },
      { name: "outcome", label: "项目结果", textarea: true }
    ]
  },
  {
    ...profileModules[4],
    buttonLabel: "添加校园经历",
    emptyText: "添加社团、竞赛、志愿活动或学生工作。",
    titleField: "activity",
    organizationField: "organization",
    fields: [
      { name: "organization", label: "组织 / 社团 / 活动名称" },
      { name: "activity", label: "经历名称" },
      { name: "role", label: "角色 / 职责" },
      { name: "time", label: "时间" },
      { name: "description", label: "经历描述", textarea: true },
      { name: "result", label: "成果 / 收获", textarea: true }
    ]
  },
  {
    ...profileModules[5],
    buttonLabel: "保存技能",
    emptyText: "添加专业技能、软件技能、语言和其他能力。",
    titleField: "professional",
    skillsField: "professional",
    fields: [
      { name: "professional", label: "专业技能", placeholder: "数据分析、产品设计、用户研究" },
      { name: "software", label: "软件技能", placeholder: "Excel、PowerPoint、Figma、Tableau" },
      { name: "aiTools", label: "AI / 数据 / 办公工具", placeholder: "ChatGPT、SQL、Python" },
      { name: "languages", label: "语言能力", placeholder: "英语 CET-6" },
      { name: "certificates", label: "证书相关技能" },
      { name: "others", label: "其他能力", textarea: true }
    ]
  },
  {
    ...profileModules[6],
    buttonLabel: "添加证书",
    emptyText: "添加证书名称、等级、时间和说明。",
    titleField: "name",
    fields: [
      { name: "name", label: "证书名称" },
      { name: "level", label: "等级 / 成绩" },
      { name: "time", label: "获得时间" },
      { name: "details", label: "补充说明", textarea: true }
    ]
  },
  {
    ...profileModules[7],
    buttonLabel: "添加奖项",
    emptyText: "添加奖项名称、时间和说明。",
    titleField: "award",
    fields: [
      { name: "award", label: "奖项名称" },
      { name: "time", label: "时间" },
      { name: "description", label: "奖项说明", textarea: true }
    ]
  },
  {
    ...profileModules[8],
    buttonLabel: "保存语言能力",
    emptyText: "添加语言、水平、考试或使用场景。",
    titleField: "languages",
    skillsField: "languages",
    fields: [
      { name: "languages", label: "语言种类" },
      { name: "level", label: "水平 / 证书" },
      { name: "details", label: "补充说明", textarea: true }
    ]
  },
  {
    ...profileModules[9],
    buttonLabel: "保存个人链接",
    emptyText: "添加作品集、GitHub、LinkedIn 或个人网站。",
    titleField: "website",
    fields: [
      { name: "website", label: "个人网站 / Portfolio" },
      { name: "linkedin", label: "LinkedIn" },
      { name: "github", label: "GitHub" },
      { name: "other", label: "其他链接", textarea: true }
    ]
  }
];

export function ProfileForm({ initialExperiences }: { initialExperiences: ProfileExperience[] }) {
  const searchParams = useSearchParams();
  const focusModule = normalizeProfileFocus(searchParams.get("focus"));
  const [activeId, setActiveId] = useState<ProfileModuleId>(() => focusModule || getDefaultProfileModule(initialExperiences));
  const [experiences, setExperiences] = useState(initialExperiences);
  const [showImportFocusNotice] = useState(Boolean(focusModule));
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<ProfileExperience | null>(null);

  const grouped = useMemo(() => {
    const result: Record<ProfileModuleId, ProfileExperience[]> = {
      basic: [],
      education: [],
      internship: [],
      project: [],
      campus: [],
      skills: [],
      certificate: [],
      award: [],
      language: [],
      links: []
    };

    experiences.forEach((experience) => {
      result[inferProfileModuleId(experience)].push(experience);
    });

    return result;
  }, [experiences]);

  const completeness = useMemo(() => calculateProfileCompleteness(experiences), [experiences]);
  const activeModule = modules.find((module) => module.id === activeId) || modules[0];
  const activeItems = grouped[activeModule.id];

  async function saveModule(event: React.FormEvent<HTMLFormElement>, module: ProfileModuleConfig) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const descriptionLines = module.fields
      .map((field) => {
        const value = String(formData.get(field.name) || "").trim();
        return value ? `${field.label}：${value}` : "";
      })
      .filter(Boolean);

    if (descriptionLines.length === 0) {
      setMessages((current) => ({ ...current, [module.id]: "请至少填写一项内容。" }));
      return;
    }

    const titleValue = String(formData.get(module.titleField) || "").trim();
    const organization = module.organizationField ? String(formData.get(module.organizationField) || "").trim() : "";
    const skills = collectSkills(formData, module);

    const response = await fetch("/api/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: module.type,
        title: titleValue || module.title,
        organization,
        description: descriptionLines.join("\n"),
        skills,
        source: module.source
      })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessages((current) => ({ ...current, [module.id]: result.error || "保存失败，请检查数据库连接。" }));
      return;
    }

    setExperiences((current) => [result.experience, ...current]);
    setMessages((current) => ({ ...current, [module.id]: "已保存到个人资料库。" }));
    form.reset();
  }

  async function updateExperience(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    const formData = new FormData(event.currentTarget);
    const skills = String(formData.get("skills") || "")
      .split(/,|，|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const response = await fetch(`/api/experiences/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        organization: formData.get("organization"),
        description: formData.get("description"),
        skills
      })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessages((current) => ({ ...current, [activeModule.id]: result.error || "编辑保存失败。" }));
      return;
    }

    setExperiences((current) => current.map((item) => (item.id === editing.id ? result.experience : item)));
    setEditing(null);
    setMessages((current) => ({ ...current, [activeModule.id]: "修改已保存。" }));
  }

  async function deleteExperience(id: string) {
    const confirmed = window.confirm("确认删除这条资料吗？删除后 AI 将不能再使用它生成简历。");
    if (!confirmed) return;

    const response = await fetch(`/api/experiences/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setMessages((current) => ({ ...current, [activeModule.id]: "删除失败，请稍后重试。" }));
      return;
    }

    setExperiences((current) => current.filter((item) => item.id !== id));
    if (editing?.id === id) setEditing(null);
    setMessages((current) => ({ ...current, [activeModule.id]: "已删除。" }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      {showImportFocusNotice ? (
        <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 xl:col-span-2">
          已展示刚导入的资料模块
        </div>
      ) : null}
      <aside className="space-y-4">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">资料完整度 {completeness.percent}%</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">资料越完整，AI 生成的简历越精准。</p>
            </div>
            <span className="text-sm text-neutral-500">
              {completeness.completedCount}/{completeness.totalCount}
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-neutral-100">
            <div className="h-2 rounded-full bg-neutral-950 transition-all" style={{ width: `${completeness.percent}%` }} />
          </div>
        </section>

        <nav className="rounded-lg border border-neutral-200 bg-white p-2" aria-label="个人资料模块">
          {modules.map((module) => {
            const done = grouped[module.id].length > 0;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => {
                  setActiveId(module.id);
                  setEditing(null);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm ${
                  activeId === module.id ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                <span>{module.title}</span>
                <span className={activeId === module.id ? "text-neutral-300" : done ? "text-neutral-950" : "text-neutral-400"}>
                  {done ? "已完成" : "缺失"}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="space-y-5">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">{activeModule.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{activeModule.emptyText}</p>
            </div>
            <span className="rounded-md bg-neutral-100 px-3 py-1 text-sm text-neutral-700">{activeItems.length} 条资料</span>
          </div>

          <form onSubmit={(event) => saveModule(event, activeModule)} className="mt-5 grid gap-4 md:grid-cols-2">
            {activeModule.fields.map((field) => (
              <label key={field.name} className={field.textarea ? "text-sm font-medium text-neutral-700 md:col-span-2" : "text-sm font-medium text-neutral-700"}>
                {field.label}
                {field.textarea ? (
                  <textarea name={field.name} rows={4} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950" placeholder={field.placeholder} />
                ) : (
                  <input name={field.name} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950" placeholder={field.placeholder} />
                )}
              </label>
            ))}
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                <Plus className="h-4 w-4" />
                {activeModule.buttonLabel}
              </button>
              <span className="text-sm text-neutral-600">{messages[activeModule.id]}</span>
            </div>
          </form>
        </div>

        {editing ? (
          <form onSubmit={updateExperience} className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <h3 className="text-base font-semibold text-neutral-950">编辑资料</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50">
                取消编辑
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-neutral-700">
                标题
                <input name="title" defaultValue={editing.title} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950" required />
              </label>
              <label className="text-sm font-medium text-neutral-700">
                组织 / 学校 / 公司
                <input name="organization" defaultValue={editing.organization || ""} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950" />
              </label>
              <label className="text-sm font-medium text-neutral-700 md:col-span-2">
                技能关键词
                <input name="skills" defaultValue={editing.skills.join("，")} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950" />
              </label>
              <label className="text-sm font-medium text-neutral-700 md:col-span-2">
                内容
                <textarea name="description" defaultValue={editing.description} rows={8} className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-950" required />
              </label>
            </div>
            <button className="mt-4 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">保存修改</button>
          </form>
        ) : null}

        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h3 className="text-base font-semibold text-neutral-950">已保存资料</h3>
          </div>
          {activeItems.length ? (
            <div className="divide-y divide-neutral-100">
              {activeItems.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-neutral-950">{item.title}</h4>
                        {item.source.startsWith("UPLOAD") ? <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">导入</span> : null}
                      </div>
                      {item.organization ? <p className="mt-1 text-sm text-neutral-500">{item.organization}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(item)} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50">
                        <Pencil className="h-3.5 w-3.5" />
                        编辑
                      </button>
                      <button onClick={() => deleteExperience(item.id)} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-700">{item.description}</p>
                  {item.skills.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.skills.map((skill) => (
                        <span key={skill} className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-neutral-600">
              <CheckCircle2 className="h-5 w-5 text-neutral-400" />
              {activeModule.emptyText}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function normalizeProfileFocus(focus: string | null): ProfileModuleId | null {
  if (focus === "education" || focus === "project" || focus === "skills" || focus === "basic") {
    return focus;
  }

  return null;
}

function getDefaultProfileModule(experiences: ProfileExperience[]): ProfileModuleId {
  const completedIds = new Set(experiences.map(inferProfileModuleId));
  const priority: ProfileModuleId[] = ["education", "project", "skills", "basic"];

  return priority.find((id) => completedIds.has(id)) || "basic";
}

function collectSkills(formData: FormData, module: ProfileModuleConfig) {
  const values = [
    module.skillsField ? formData.get(module.skillsField) : "",
    formData.get("skills"),
    formData.get("tools"),
    formData.get("professional"),
    formData.get("software"),
    formData.get("aiTools"),
    formData.get("languages"),
    formData.get("certificates")
  ];

  return values
    .flatMap((value) =>
      String(value || "")
        .split(/,|，|、|\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 24);
}
