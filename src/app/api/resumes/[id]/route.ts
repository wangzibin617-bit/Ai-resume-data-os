import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const resume = await prisma.resume.findUnique({
    where: { id: params.id },
    include: { versions: { orderBy: { version: "desc" } }, jobDescription: true }
  });

  if (!resume) {
    return NextResponse.json({ error: "未找到简历。" }, { status: 404 });
  }

  return NextResponse.json({ resume });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.resume.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
