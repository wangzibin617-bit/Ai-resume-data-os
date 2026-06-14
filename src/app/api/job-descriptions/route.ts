import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobDescription } from "@/lib/ai";
import { getDemoUser, prisma } from "@/lib/prisma";

const jdSchema = z.object({
  title: z.string().min(1, "请填写岗位名称"),
  company: z.string().optional(),
  rawText: z.string().min(20, "请粘贴更完整的岗位 JD")
});

export async function GET() {
  const user = await getDemoUser();
  const jobDescriptions = await prisma.jobDescription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ jobDescriptions });
}

export async function POST(request: Request) {
  const user = await getDemoUser();
  const payload = jdSchema.parse(await request.json());
  const analysis = await analyzeJobDescription(payload.rawText);

  const jobDescription = await prisma.jobDescription.create({
    data: {
      userId: user.id,
      title: payload.title,
      company: payload.company,
      rawText: payload.rawText,
      responsibilities: analysis.responsibilities,
      requiredSkills: analysis.requiredSkills,
      keywords: analysis.keywords,
      preferredPoints: analysis.preferredPoints,
      analyzedAt: new Date()
    }
  });

  return NextResponse.json({ jobDescription }, { status: 201 });
}
