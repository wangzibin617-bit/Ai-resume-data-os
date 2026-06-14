import { NextResponse } from "next/server";
import { FileParseError, parseUploadedFile } from "@/lib/parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传 JD 文件。" }, { status: 400 });
    }

    const rawText = await parseUploadedFile(file);
    return NextResponse.json({ rawText });
  } catch (error) {
    console.error("JD 文件解析失败", error);

    if (error instanceof FileParseError) {
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 422 });
    }

    return NextResponse.json({ error: "JD 文件解析失败，请上传清晰的 PDF、DOCX 或 TXT 文件。" }, { status: 422 });
  }
}
