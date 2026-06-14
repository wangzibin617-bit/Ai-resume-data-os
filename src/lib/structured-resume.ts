import { defaultSectionOrder, getResumeTemplate, normalizePageMode, sectionLabels } from "./resume-templates";
import type { PageMode, ResumeSectionType, ResumeTemplateId } from "./resume-templates";

export type ResumeSection = {
  id: string;
  type: ResumeSectionType;
  title: string;
  visible: boolean;
  order: number;
  content: string | string[] | Record<string, unknown>;
};

export type StructuredResume = {
  title: string;
  targetRole: string;
  templateId: ResumeTemplateId;
  pageMode: PageMode;
  sections: ResumeSection[];
};

type ResumeParseFallback = Partial<Omit<StructuredResume, "templateId" | "pageMode">> & {
  templateId?: string;
  pageMode?: string;
};

const aliases: Record<string, ResumeSectionType> = {
  "个人信息": "personalInfo",
  "Personal Information": "personalInfo",
  "求职目标": "targetRole",
  "Target Role": "targetRole",
  "个人简介": "summary",
  "Professional Summary": "summary",
  "核心优势": "summary",
  "教育背景": "education",
  "Education": "education",
  "实习 / 工作经历": "experience",
  "实习经历": "experience",
  "工作经历": "experience",
  "相关经历": "experience",
  "Experience": "experience",
  "项目经历": "projects",
  "Projects": "projects",
  "技能": "skills",
  "技能与关键词": "skills",
  "Skills": "skills",
  "证书": "certificates",
  "Certificates": "certificates",
  "语言能力": "languages",
  "Languages": "languages",
  "其他补充": "additional",
  "Additional Information": "additional"
};

export function isStructuredResume(value: unknown): value is StructuredResume {
  return Boolean(value && typeof value === "object" && Array.isArray((value as StructuredResume).sections));
}

export function parseStructuredResume(content: string, fallback: ResumeParseFallback = {}) {
  try {
    const parsed = JSON.parse(content);
    if (isStructuredResume(parsed)) {
      return normalizeStructuredResume({
        ...parsed,
        ...fallback,
        templateId: fallback.templateId || parsed.templateId,
        pageMode: fallback.pageMode || parsed.pageMode
      });
    }
  } catch {
    // Plain text resumes are parsed below.
  }

  return normalizeStructuredResume(createStructuredResumeFromText(content, fallback));
}

export function normalizeStructuredResume(resume: StructuredResume | (ResumeParseFallback & { sections: ResumeSection[] })) {
  const template = getResumeTemplate(resume.templateId);
  const pageMode: PageMode = normalizePageMode(resume.pageMode);
  const sectionMap = new Map(resume.sections.map((section) => [section.type, section]));
  const sections = template.defaultSections.map((type, index) => {
    const existing = sectionMap.get(type);
    return {
      id: existing?.id || type,
      type,
      title: existing?.title || sectionLabels[type],
      visible: existing?.visible ?? true,
      order: existing?.order ?? index,
      content: existing?.content ?? defaultContentFor(type, resume.targetRole)
    };
  });

  return {
    title: resume.title || "定制简历",
    targetRole: resume.targetRole || "目标岗位",
    templateId: template.templateId,
    pageMode,
    sections: sections.sort((a, b) => a.order - b.order)
  };
}

export function createStructuredResumeFromText(content: string, fallback: ResumeParseFallback = {}): StructuredResume {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const buckets = new Map<ResumeSectionType, string[]>();
  let current: ResumeSectionType = "summary";

  for (const rawLine of lines) {
    const clean = rawLine.replace(/^【|】$/g, "").replace(/[:：]$/, "").trim();
    const type = aliases[clean];
    if (type) {
      current = type;
      if (!buckets.has(current)) buckets.set(current, []);
    } else {
      const existing = buckets.get(current) || [];
      existing.push(rawLine);
      buckets.set(current, existing);
    }
  }

  const targetRole = fallback.targetRole || buckets.get("targetRole")?.[0] || "目标岗位";
  return {
    title: fallback.title || "定制简历",
    targetRole,
    templateId: getResumeTemplate(fallback.templateId).templateId,
    pageMode: normalizePageMode(fallback.pageMode),
    sections: defaultSectionOrder.map((type, order) => ({
      id: type,
      type,
      title: sectionLabels[type],
      visible: true,
      order,
      content: buckets.get(type)?.length ? buckets.get(type)! : defaultContentFor(type, targetRole)
    }))
  };
}

export function structuredResumeToText(resume: StructuredResume) {
  return normalizeStructuredResume(resume)
    .sections
    .filter((section) => section.visible)
    .map((section) => `${section.title}\n${sectionContentToLines(section.content).join("\n")}`)
    .join("\n\n");
}

export function sectionContentToLines(content: ResumeSection["content"]) {
  if (Array.isArray(content)) return content.map(String);
  if (typeof content === "string") return content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return Object.entries(content).map(([key, value]) => `${key}：${Array.isArray(value) ? value.join("、") : String(value)}`);
}

export function defaultContentFor(type: ResumeSectionType, targetRole = "目标岗位") {
  if (type === "targetRole") return targetRole;
  if (type === "skills") {
    return {
      "专业技能": "待补充",
      "软件技能": "待补充",
      "AI / 数据 / 办公工具": "待补充",
      "语言能力": "待补充",
      "证书相关技能": "待补充"
    };
  }
  return "待补充";
}

export function estimateResumePages(resume: StructuredResume) {
  const normalized = normalizeStructuredResume(resume);
  const template = getResumeTemplate(normalized.templateId);
  const visibleSections = normalized.sections.filter((section) => section.visible);
  const lineCount = visibleSections.reduce((sum, section) => {
    const contentLines = sectionContentToLines(section.content);
    return sum + 2 + Math.max(contentLines.length, 1);
  }, 4);
  const weightedLines = template.layoutType === "two-column" ? lineCount * 0.86 : lineCount;
  const capacity = normalized.pageMode === "smart-one-page" ? 42 : normalized.pageMode === "standard" ? 52 : 58;
  const pages = Math.max(0.6, weightedLines / capacity);
  return Math.round(pages * 10) / 10;
}
