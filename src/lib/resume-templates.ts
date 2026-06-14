export type ResumeTemplateId = "black-minimal" | "classic-ats" | "modern-business" | "campus-recruiting" | "two-column";
export type PageMode = "smart-one-page" | "standard" | "complete";
export type ResumeSectionType =
  | "personalInfo"
  | "targetRole"
  | "summary"
  | "education"
  | "experience"
  | "projects"
  | "skills"
  | "certificates"
  | "languages"
  | "additional";

export type ResumeTemplate = {
  templateId: ResumeTemplateId;
  templateName: string;
  description: string;
  suitableFor: string;
  layoutType: "single-column" | "two-column";
  category: "ats" | "business" | "campus" | "visual";
  supportedSections: ResumeSectionType[];
  defaultSections: ResumeSectionType[];
  cssClassName: string;
  isAtsFriendly: boolean;
  atsNote: string;
};

export const sectionLabels: Record<ResumeSectionType, string> = {
  personalInfo: "个人信息",
  targetRole: "求职目标",
  summary: "个人简介",
  education: "教育背景",
  experience: "实习 / 工作经历",
  projects: "项目经历",
  skills: "技能",
  certificates: "证书",
  languages: "语言能力",
  additional: "其他补充"
};

export const defaultSectionOrder: ResumeSectionType[] = [
  "personalInfo",
  "targetRole",
  "summary",
  "education",
  "experience",
  "projects",
  "skills",
  "certificates",
  "languages",
  "additional"
];

export const resumeTemplates: ResumeTemplate[] = [
  {
    templateId: "black-minimal",
    templateName: "黑白简约模板",
    description: "黑白配色，单栏结构，适合正式求职、金融、行政、职能类岗位。",
    suitableFor: "正式求职、会计、审计、金融、行政",
    layoutType: "single-column",
    category: "ats",
    supportedSections: defaultSectionOrder,
    defaultSections: defaultSectionOrder,
    cssClassName: "template-black-minimal",
    isAtsFriendly: true,
    atsNote: "单栏结构，兼顾 ATS 解析和人工阅读。"
  },
  {
    templateId: "classic-ats",
    templateName: "经典 ATS 模板",
    description: "无复杂排版、无图标、无双栏，标题使用标准命名，最适合机器筛选。",
    suitableFor: "大厂网申、ATS 系统、标准岗位申请",
    layoutType: "single-column",
    category: "ats",
    supportedSections: defaultSectionOrder,
    defaultSections: defaultSectionOrder,
    cssClassName: "template-classic-ats",
    isAtsFriendly: true,
    atsNote: "ATS 兼容性最强，保持 Education / Experience / Projects / Skills 标准结构。"
  },
  {
    templateId: "modern-business",
    templateName: "现代商务模板",
    description: "信息层级更清楚，适合产品、运营、市场、项目管理岗位。",
    suitableFor: "产品、运营、市场、项目管理",
    layoutType: "single-column",
    category: "business",
    supportedSections: defaultSectionOrder,
    defaultSections: ["personalInfo", "targetRole", "summary", "experience", "projects", "skills", "education", "certificates", "languages", "additional"],
    cssClassName: "template-modern-business",
    isAtsFriendly: true,
    atsNote: "单栏排版，适合人工阅读，同时保持较好的 ATS 兼容性。"
  },
  {
    templateId: "campus-recruiting",
    templateName: "校招重点模板",
    description: "突出教育、校园经历、项目和技能，适合应届生、实习、管培生申请。",
    suitableFor: "应届生、校招、实习、管培生",
    layoutType: "single-column",
    category: "campus",
    supportedSections: defaultSectionOrder,
    defaultSections: ["personalInfo", "targetRole", "education", "projects", "experience", "skills", "certificates", "languages", "summary", "additional"],
    cssClassName: "template-campus-recruiting",
    isAtsFriendly: true,
    atsNote: "单栏结构，优先展示校招常看的教育、项目和技能。"
  },
  {
    templateId: "two-column",
    templateName: "双栏信息模板",
    description: "左侧放基本信息、技能、语言、证书，右侧放教育、经历、项目。",
    suitableFor: "内容较多、项目较多、技能栈较丰富的用户",
    layoutType: "two-column",
    category: "visual",
    supportedSections: defaultSectionOrder,
    defaultSections: defaultSectionOrder,
    cssClassName: "template-two-column",
    isAtsFriendly: false,
    atsNote: "视觉效果更好，但部分 ATS 兼容性可能较弱，更适合人工阅读。"
  }
];

export function getResumeTemplate(templateId?: string) {
  return resumeTemplates.find((template) => template.templateId === templateId) || resumeTemplates[0];
}

export const pageModeOptions: Array<{
  id: PageMode;
  name: string;
  suitableFor: string;
  description: string;
  generationRule: string;
}> = [
  {
    id: "smart-one-page",
    name: "智能一页",
    suitableFor: "应届生、校招、0~3 年经验",
    description: "保留最相关经历，每段经历最多 3 条 bullet，优先核心项目和核心技能。",
    generationRule: "控制为高密度一页简历：只保留最相关经历；每段经历最多 3 条 bullet；每条 bullet 尽量简短；保留核心项目和核心技能。"
  },
  {
    id: "standard",
    name: "标准版",
    suitableFor: "1~2 页，适合多数岗位申请",
    description: "保留主要经历和项目细节，兼顾完整度与阅读效率。",
    generationRule: "控制为 1~2 页标准简历：保留主要经历、核心项目、关键技能和必要教育信息，避免过长描述。"
  },
  {
    id: "complete",
    name: "完整版",
    suitableFor: "社招、中高级岗位、项目较多用户",
    description: "允许更完整的项目描述和成果展开，适合需要展示复杂经历的申请。",
    generationRule: "控制为完整展示版本：允许保留更多项目细节、职责和成果，但仍保持专业、清晰、不过度堆砌。"
  }
];

export function normalizePageMode(pageMode?: string): PageMode {
  if (pageMode === "standard" || pageMode === "multi-page") return "standard";
  if (pageMode === "complete") return "complete";
  return "smart-one-page";
}
