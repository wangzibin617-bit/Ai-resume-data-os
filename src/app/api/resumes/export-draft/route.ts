import { NextResponse } from "next/server";
import { z } from "zod";
import { exportDocx, exportTxt } from "@/lib/exporters";
import { structuredResumeToText } from "@/lib/structured-resume";
import type { StructuredResume } from "@/lib/structured-resume";

const sectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  visible: z.boolean(),
  order: z.number(),
  content: z.union([z.string(), z.array(z.string()), z.record(z.unknown())])
});

const exportDraftSchema = z.object({
  format: z.enum(["docx", "txt"]),
  resume: z.object({
    title: z.string(),
    targetRole: z.string(),
    templateId: z.enum(["black-minimal", "classic-ats", "modern-business", "campus-recruiting", "two-column"]),
    pageMode: z.enum(["smart-one-page", "standard", "complete", "one-page", "multi-page"]),
    sections: z.array(sectionSchema)
  })
});

export async function POST(request: Request) {
  const payload = exportDraftSchema.parse(await request.json());
  const text = structuredResumeToText(payload.resume as StructuredResume);

  if (payload.format === "docx") {
    const buffer = await exportDocx(text);
    return fileResponse(buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", `${payload.resume.title}.docx`);
  }

  const buffer = await exportTxt(text);
  return fileResponse(buffer, "text/plain; charset=utf-8", `${payload.resume.title}.txt`);
}

function fileResponse(buffer: Buffer, contentType: string, fileName: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
    }
  });
}
