import { NextResponse } from "next/server";
import { extractExperiencesFromText, FileParseError, parseUploadedFileDetailed } from "@/lib/parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请先选择 PDF、DOCX 或 TXT 文件。" }, { status: 400 });
    }

    const parsedFile = await parseUploadedFileDetailed(file);
    const parsedText = parsedFile.text;
    const experiences = extractExperiencesFromText(parsedText);

    return NextResponse.json({
      fileName: file.name,
      parsedText,
      experiences,
      parser: parsedFile.parser,
      warnings: parsedFile.warnings
    });
  } catch (error) {
    console.error("上传材料解析失败", error);

    if (error instanceof FileParseError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: "文件解析失败，请检查文件格式后重试。" }, { status: 422 });
  }
}
