import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";
import { extractExperiencesFromText, FileParseError, parseUploadedFile } from "@/lib/parser";

export async function POST(request: Request) {
  const user = await getDemoUser();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请先选择 PDF、DOCX 或 TXT 文件。" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_")}`;
  const storagePath = path.join(uploadDir, safeName);
  await writeFile(storagePath, Buffer.from(await file.arrayBuffer()));

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      userId: user.id,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      storagePath: `/uploads/${safeName}`
    }
  });

  try {
    const parsedText = await parseUploadedFile(file);
    const parsedExperiences = extractExperiencesFromText(parsedText);

    await prisma.$transaction([
      prisma.uploadedFile.update({
        where: { id: uploadedFile.id },
        data: { parsedText, status: "PARSED" }
      }),
      prisma.experience.createMany({
        data: parsedExperiences.map((experience) => ({
          userId: user.id,
          uploadedFileId: uploadedFile.id,
          type: experience.type,
          title: experience.title,
          description: experience.description,
          skills: experience.skills,
          keywords: experience.keywords,
          source: experience.source
        }))
      })
    ]);

    return NextResponse.json({
      uploadedFileId: uploadedFile.id,
      parsedText,
      experienceCount: parsedExperiences.length
    });
  } catch (error) {
    await prisma.uploadedFile.update({
      where: { id: uploadedFile.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "文件解析失败"
      }
    });

    if (error instanceof FileParseError) {
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 422 });
    }

    return NextResponse.json({ error: "文件已上传，但解析失败。请检查文件格式。" }, { status: 422 });
  }
}
