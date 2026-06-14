import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const versionSchema = z.object({
  content: z.string().min(1),
  note: z.string().optional()
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const payload = versionSchema.parse(await request.json());
  const latest = await prisma.resumeVersion.findFirst({
    where: { resumeId: params.id },
    orderBy: { version: "desc" }
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const [resumeVersion] = await prisma.$transaction([
    prisma.resumeVersion.create({
      data: {
        resumeId: params.id,
        version: nextVersion,
        content: payload.content,
        note: payload.note || "用户手动编辑保存"
      }
    }),
    prisma.resume.update({
      where: { id: params.id },
      data: {
        content: payload.content,
        status: "EDITED"
      }
    })
  ]);

  return NextResponse.json({ resumeVersion }, { status: 201 });
}
