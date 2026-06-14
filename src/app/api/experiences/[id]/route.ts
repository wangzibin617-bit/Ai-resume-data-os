import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guessKeywords } from "@/lib/parser";

const updateSchema = z.object({
  title: z.string().min(1, "请填写标题").optional(),
  organization: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().min(1, "请填写内容").optional(),
  skills: z.array(z.string()).optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = updateSchema.parse(await request.json());
    const keywords = payload.description ? [...new Set([...(payload.skills ?? []), ...guessKeywords(payload.description)])] : undefined;

    const experience = await prisma.experience.update({
      where: { id: params.id },
      data: {
        title: payload.title,
        organization: payload.organization,
        location: payload.location,
        description: payload.description,
        skills: payload.skills,
        keywords
      }
    });

    return NextResponse.json({ experience });
  } catch (error) {
    console.error("更新经历失败", error);
    return NextResponse.json({ error: "更新资料失败，请检查内容或数据库连接。" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.experience.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("删除经历失败", error);
    return NextResponse.json({ error: "删除资料失败，请检查数据库连接。" }, { status: 500 });
  }
}
