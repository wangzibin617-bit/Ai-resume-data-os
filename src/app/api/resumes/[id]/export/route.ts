import { NextResponse } from "next/server";
import { exportDocx, exportPdf, exportTxt } from "@/lib/exporters";
import { prisma } from "@/lib/prisma";
import { parseStructuredResume, structuredResumeToText } from "@/lib/structured-resume";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "txt";
  const resume = await prisma.resume.findUnique({ where: { id: params.id } });

  if (!resume) {
    return NextResponse.json({ error: "未找到简历。" }, { status: 404 });
  }

  const content = structuredResumeToText(parseStructuredResume(resume.content, { title: resume.title }));

  if (format === "pdf") {
    const buffer = await exportPdf(content);
    return fileResponse(buffer, "application/pdf", `${resume.title}.pdf`);
  }

  if (format === "docx") {
    const buffer = await exportDocx(content);
    return fileResponse(buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", `${resume.title}.docx`);
  }

  const buffer = await exportTxt(content);
  return fileResponse(buffer, "text/plain; charset=utf-8", `${resume.title}.txt`);
}

function fileResponse(buffer: Buffer, contentType: string, fileName: string) {
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    }
  });
}
