import OpenAI from "openai";
import { pageModeOptions } from "./resume-templates";
import type { PageMode } from "./resume-templates";
import { guessKeywords } from "./parser";

export type ExperienceForAI = {
  id: string;
  type: string;
  title: string;
  organization?: string | null;
  description: string;
  skills: string[];
  keywords: string[];
};

export type JDAnalysis = {
  responsibilities: string[];
  requiredSkills: string[];
  keywords: string[];
  preferredPoints: string[];
};

export type ResumeGenerationResult = {
  content: string;
  matchScore: number;
  matchedKeywords: string[];
  gaps: string[];
  report: {
    summary: string;
    matchedExperiences: string[];
    gaps: string[];
    suggestions: string[];
  };
};

export type ResumeGenerationOptions = {
  templateId: string;
  templateName: string;
  pageMode: PageMode;
};

const safetyRule = `
你是中文求职简历优化助手。必须遵守：
1. 不能编造用户不存在的经历、公司、学校、项目、证书、数据或技能。
2. 只能基于用户提供的经历进行筛选、重组、改写和润色。
3. 如果岗位要求没有用户经历支撑，必须标记为能力缺口。
4. 输出应适合中文求职场景，专业、简洁、ATS 友好。
5. 简历必须包含清晰的“技能”模块，并按专业技能、软件技能、AI / 数据 / 办公工具、语言能力、证书相关技能分类。
`;

export async function analyzeJobDescription(rawText: string): Promise<JDAnalysis> {
  const fallback = localAnalyzeJD(rawText);
  const client = getOpenAIClient();
  if (!client) return fallback;

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${safetyRule}\n请只返回 JSON。` },
        {
          role: "user",
          content: `分析以下岗位 JD，返回 JSON：{"responsibilities":[],"requiredSkills":[],"keywords":[],"preferredPoints":[]}\n\n${rawText}`
        }
      ]
    });

    return { ...fallback, ...JSON.parse(response.choices[0]?.message.content || "{}") };
  } catch (error) {
    console.error("JD 分析失败，已使用本地规则兜底。", error);
    return fallback;
  }
}

export async function generateTailoredResume(
  jobTitle: string,
  jdText: string,
  analysis: JDAnalysis,
  experiences: ExperienceForAI[],
  options: ResumeGenerationOptions = {
    templateId: "black-minimal",
    templateName: "黑白简约模板",
    pageMode: "smart-one-page"
  }
): Promise<ResumeGenerationResult> {
  const matched = rankExperiences(analysis, experiences);
  const fallback = localGenerateResume(jobTitle, analysis, matched, options);
  const client = getOpenAIClient();
  const pageModeOption = pageModeOptions.find((item) => item.id === options.pageMode) || pageModeOptions[0];
  if (!client) return fallback;

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${safetyRule}\n请只返回 JSON，不要输出 Markdown。` },
        {
          role: "user",
          content: JSON.stringify({
            task: "基于真实经历生成中文 ATS 简历和匹配报告",
            template: {
              templateId: options.templateId,
              templateName: options.templateName,
              pageMode: options.pageMode,
              pageModeName: pageModeOption.name,
              pageModeRule: pageModeOption.generationRule
            },
            contentRules: [
              "content 字段必须是一个可 JSON.parse 的字符串，字符串内部是 StructuredResume JSON。",
              "StructuredResume 必须包含 title、targetRole、templateId、pageMode、sections。",
              "每个 section 必须包含 id、type、title、visible、order、content。",
              "必须包含 Skills 技能模块，并按专业技能、软件技能、AI / 数据 / 办公工具、语言能力、证书相关技能分类。",
              "没有真实资料支撑的模块设置 visible=false，不能编造内容。",
              "所有内容必须来自 userExperiences 或 JD 匹配要求，不能编造公司、学校、证书、数字或项目。",
              "页数模式是生成阶段的内容密度策略，不允许通过截断正文实现。"
            ],
            requiredResumeSections: [
              "个人信息",
              "求职目标",
              "个人简介",
              "教育背景",
              "实习 / 工作经历",
              "项目经历",
              "技能",
              "证书",
              "语言能力",
              "其他补充"
            ],
            skillCategories: ["专业技能", "软件技能", "AI / 数据 / 办公工具", "语言能力", "证书相关技能"],
            outputShape: {
              content: "{\"title\":\"...\",\"targetRole\":\"...\",\"templateId\":\"...\",\"pageMode\":\"smart-one-page|standard|complete\",\"sections\":[{\"id\":\"skills\",\"type\":\"skills\",\"title\":\"技能\",\"visible\":true,\"order\":6,\"content\":{\"专业技能\":\"...\"}}]}",
              matchScore: "0-100 整数",
              matchedKeywords: ["已匹配关键词"],
              gaps: ["能力缺口"],
              report: {
                summary: "简短总结",
                matchedExperiences: ["匹配到的真实经历标题"],
                gaps: ["没有经历支撑的 JD 要求"],
                suggestions: ["用户可补充的建议"]
              }
            },
            jdText,
            analysis,
            userExperiences: matched
          })
        }
      ]
    });

    return { ...fallback, ...JSON.parse(response.choices[0]?.message.content || "{}") };
  } catch (error) {
    console.error("简历生成失败，已使用本地规则兜底。", error);
    return fallback;
  }
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function localAnalyzeJD(rawText: string): JDAnalysis {
  const lines = rawText
    .split(/\n|。|；|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  const keywords = guessKeywords(rawText);

  return {
    responsibilities: lines.filter((line) => /负责|参与|推进|支持|完成/.test(line)).slice(0, 8),
    requiredSkills: keywords,
    keywords,
    preferredPoints: lines.filter((line) => /优先|加分|熟悉|具备/.test(line)).slice(0, 8)
  };
}

function rankExperiences(analysis: JDAnalysis, experiences: ExperienceForAI[]) {
  const terms = [...analysis.keywords, ...analysis.requiredSkills, ...analysis.responsibilities];

  return experiences
    .map((experience) => {
      const haystack = `${experience.title} ${experience.organization ?? ""} ${experience.description} ${experience.skills.join(" ")} ${experience.keywords.join(" ")}`;
      const score = terms.reduce((sum, term) => sum + (term && haystack.includes(term) ? 1 : 0), 0);
      return { ...experience, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function localGenerateResume(
  jobTitle: string,
  analysis: JDAnalysis,
  experiences: Array<ExperienceForAI & { score: number }>,
  options: ResumeGenerationOptions
): ResumeGenerationResult {
  const allSkills = [...new Set(experiences.flatMap((item) => [...item.skills, ...item.keywords]))].filter(Boolean);
  const matchedKeywords = [...new Set(allSkills.filter((keyword) => analysis.keywords.includes(keyword)))];
  const gaps = analysis.requiredSkills.filter((skill) => !allSkills.includes(skill));
  const score = Math.min(95, Math.max(35, Math.round((matchedKeywords.length / Math.max(analysis.keywords.length, 1)) * 80 + 15)));
  const pageModeOption = pageModeOptions.find((item) => item.id === options.pageMode) || pageModeOptions[0];
  const maxExperiences = options.pageMode === "smart-one-page" ? 4 : options.pageMode === "standard" ? 6 : 8;
  const experienceSections = experiences.slice(0, maxExperiences).map((item) => `【${item.title}】\n- ${item.description}`).join("\n\n");

  return {
    content: `个人信息\n姓名：待补充\n邮箱：待补充\n手机号：待补充\n所在城市：待补充\n\n求职目标\n${jobTitle}\n\n个人简介\n- 基于现有真实经历，围绕目标岗位关键词完成初步整理。\n- 当前使用${options.templateName}和${pageModeOption.name}，内容密度按生成策略控制，未通过截断正文实现。\n\n教育背景\n待补充\n\n实习 / 工作经历\n${experienceSections || "待补充"}\n\n项目经历\n${experiences.filter((item) => item.type === "PROJECT").slice(0, options.pageMode === "smart-one-page" ? 2 : 5).map((item) => `【${item.title}】\n- ${item.description}`).join("\n\n") || "待补充"}\n\n技能\n专业技能：${allSkills.join("、") || "待补充"}\n软件技能：${allSkills.filter((item) => /Excel|PowerPoint|Tableau|Figma|Office/i.test(item)).join("、") || "待补充"}\nAI / 数据 / 办公工具：${allSkills.filter((item) => /AI|AIGC|SQL|Python|数据|大模型|Excel/i.test(item)).join("、") || "待补充"}\n语言能力：待补充\n证书相关技能：待补充\n\n证书\n待补充\n\n语言能力\n待补充\n\n其他补充\n未匹配要求已在报告中列为能力缺口，未生成虚构经历。`,
    matchScore: score,
    matchedKeywords,
    gaps,
    report: {
      summary: `当前经历与岗位关键词匹配度为 ${score} 分。未匹配要求已作为能力缺口列出，未生成虚构经历。`,
      matchedExperiences: experiences.map((item) => item.title),
      gaps,
      suggestions: gaps.map((gap) => `如你确有“${gap}”相关经历，请补充到个人资料中心；否则不要写入简历。`)
    }
  };
}
