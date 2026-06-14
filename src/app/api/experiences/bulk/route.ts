import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoUser, prisma } from "@/lib/prisma";

const bulkSchema = z.object({
  experiences: z.array(
    z.object({
      type: z.enum(["EDUCATION", "INTERNSHIP", "WORK", "PROJECT", "SKILL", "CERTIFICATE", "LANGUAGE", "OTHER"]),
      title: z.string().min(1),
      description: z.string().min(1),
      skills: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      source: z.string().optional()
    })
  )
});

export async function POST(request: Request) {
  try {
    const user = await getDemoUser();
    const payload = bulkSchema.parse(await request.json());

    await prisma.experience.createMany({
      data: payload.experiences.map((experience) => ({
        userId: user.id,
        type: experience.type,
        title: experience.title,
        description: experience.description,
        skills: experience.skills ?? [],
        keywords: experience.keywords ?? [],
        source: experience.source ?? "UPLOAD_PREVIEW"
      }))
    });

    return NextResponse.json({ count: payload.experiences.length }, { status: 201 });
  } catch (error) {
    console.error("批量保存经历失败", error);
    return NextResponse.json({ error: "保存到个人资料中心失败，请检查数据库连接。" }, { status: 500 });
  }
}
