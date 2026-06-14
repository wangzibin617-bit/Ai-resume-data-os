import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoUser, prisma } from "@/lib/prisma";
import { guessKeywords } from "@/lib/parser";

const experienceSchema = z.object({
  type: z.enum(["EDUCATION", "INTERNSHIP", "WORK", "PROJECT", "SKILL", "CERTIFICATE", "LANGUAGE", "OTHER"]),
  title: z.string().min(1, "请填写经历标题"),
  organization: z.string().optional(),
  location: z.string().optional(),
  description: z.string().min(1, "请填写经历内容"),
  skills: z.array(z.string()).optional(),
  source: z.string().optional()
});

export async function GET() {
  try {
    const user = await getDemoUser();
    const experiences = await prisma.experience.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ experiences });
  } catch (error) {
    console.error("读取经历失败", error);
    return NextResponse.json({ error: "读取个人资料失败，请检查数据库连接。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getDemoUser();
    const payload = experienceSchema.parse(await request.json());
    const keywords = [...new Set([...(payload.skills ?? []), ...guessKeywords(payload.description)])];

    const experience = await prisma.experience.create({
      data: {
        userId: user.id,
        type: payload.type,
        title: payload.title,
        organization: payload.organization,
        location: payload.location,
        description: payload.description,
        skills: payload.skills ?? [],
        keywords,
        source: payload.source ?? "MANUAL"
      }
    });

    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    console.error("保存经历失败", error);
    return NextResponse.json({ error: "保存到个人资料中心失败，请检查必填内容或数据库连接。" }, { status: 500 });
  }
}
