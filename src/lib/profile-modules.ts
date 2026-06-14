import type { ExperienceType } from "@prisma/client";

export type ProfileModuleId =
  | "basic"
  | "education"
  | "internship"
  | "project"
  | "campus"
  | "skills"
  | "certificate"
  | "award"
  | "language"
  | "links";

export type ProfileModuleSummary = {
  id: ProfileModuleId;
  title: string;
  type: ExperienceType;
  source: string;
};

export const profileModules: ProfileModuleSummary[] = [
  { id: "basic", title: "基本信息", type: "OTHER", source: "PROFILE_BASIC" },
  { id: "education", title: "教育背景", type: "EDUCATION", source: "PROFILE_EDUCATION" },
  { id: "internship", title: "实习经历", type: "INTERNSHIP", source: "PROFILE_INTERNSHIP" },
  { id: "project", title: "项目经历", type: "PROJECT", source: "PROFILE_PROJECT" },
  { id: "campus", title: "校园经历", type: "OTHER", source: "PROFILE_CAMPUS" },
  { id: "skills", title: "技能", type: "SKILL", source: "PROFILE_SKILLS" },
  { id: "certificate", title: "证书", type: "CERTIFICATE", source: "PROFILE_CERTIFICATE" },
  { id: "award", title: "奖项", type: "OTHER", source: "PROFILE_AWARD" },
  { id: "language", title: "语言能力", type: "LANGUAGE", source: "PROFILE_LANGUAGE" },
  { id: "links", title: "个人链接", type: "OTHER", source: "PROFILE_LINKS" }
];

export function inferProfileModuleId(experience: {
  type: ExperienceType | string;
  title: string;
  source: string;
}): ProfileModuleId {
  const sourceMatched = profileModules.find((module) => module.source === experience.source);
  if (sourceMatched) return sourceMatched.id;

  if (experience.title.includes("基本信息")) return "basic";
  if (experience.title.includes("教育")) return "education";
  if (experience.title.includes("实习")) return "internship";
  if (experience.title.includes("项目")) return "project";
  if (experience.title.includes("校园")) return "campus";
  if (experience.title.includes("技能")) return "skills";
  if (experience.title.includes("证书")) return "certificate";
  if (experience.title.includes("奖")) return "award";
  if (experience.title.includes("语言")) return "language";
  if (experience.title.includes("链接") || experience.title.includes("GitHub") || experience.title.includes("LinkedIn")) return "links";

  if (experience.type === "EDUCATION") return "education";
  if (experience.type === "INTERNSHIP" || experience.type === "WORK") return "internship";
  if (experience.type === "PROJECT") return "project";
  if (experience.type === "SKILL") return "skills";
  if (experience.type === "CERTIFICATE") return "certificate";
  if (experience.type === "LANGUAGE") return "language";

  return "campus";
}

export function calculateProfileCompleteness(experiences: Array<{ type: ExperienceType | string; title: string; source: string }>) {
  const completedIds = new Set(experiences.map(inferProfileModuleId));
  const percent = Math.round((completedIds.size / profileModules.length) * 100);

  return {
    completedIds,
    completedCount: completedIds.size,
    totalCount: profileModules.length,
    percent
  };
}
