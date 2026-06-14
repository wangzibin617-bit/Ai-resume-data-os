import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTailoredResume } from "@/lib/ai";
import { getDemoUser, prisma } from "@/lib/prisma";
import { getResumeTemplate, normalizePageMode } from "@/lib/resume-templates";
import { parseStructuredResume } from "@/lib/structured-resume";

const generateSchema = z.object({
  jobDescriptionId: z.string().min(1),
  templateId: z.enum(["black-minimal", "classic-ats", "modern-business", "campus-recruiting", "two-column"]).default("black-minimal"),
  pageMode: z.enum(["smart-one-page", "standard", "complete", "one-page", "multi-page"]).default("smart-one-page")
});

export async function POST(request: Request) {
  const user = await getDemoUser();
  const { jobDescriptionId, templateId, pageMode: rawPageMode } = generateSchema.parse(await request.json());
  const pageMode = normalizePageMode(rawPageMode);

  const [jobDescription, experiences] = await Promise.all([
    prisma.jobDescription.findFirst({ where: { id: jobDescriptionId, userId: user.id } }),
    prisma.experience.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
  ]);

  if (!jobDescription) {
    return NextResponse.json({ error: "未找到该岗位 JD。" }, { status: 404 });
  }

  const template = getResumeTemplate(templateId);
  const result = await generateTailoredResume(
    jobDescription.title,
    jobDescription.rawText,
    {
      responsibilities: jobDescription.responsibilities,
      requiredSkills: jobDescription.requiredSkills,
      keywords: jobDescription.keywords,
      preferredPoints: jobDescription.preferredPoints
    },
    experiences,
    {
      templateId,
      templateName: template.templateName,
      pageMode
    }
  );

  const rawContent = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
  const structuredResume = parseStructuredResume(rawContent, {
    title: `${jobDescription.title} 定制简历`,
    targetRole: jobDescription.title,
    templateId,
    pageMode
  });
  const content = JSON.stringify(structuredResume);

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      jobDescriptionId,
      title: `${jobDescription.title} 定制简历`,
      content,
      matchScore: result.matchScore,
      matchedKeywords: result.matchedKeywords,
      gaps: result.gaps,
      report: result.report,
      status: "GENERATED",
      versions: {
        create: {
          version: 1,
          content,
          note: "AI 初始生成版本"
        }
      }
    }
  });

  return NextResponse.json({ resume, report: result.report }, { status: 201 });
}
