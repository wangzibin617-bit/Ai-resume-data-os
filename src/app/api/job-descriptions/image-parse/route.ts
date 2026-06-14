import OpenAI from "openai";
import { NextResponse } from "next/server";
import { analyzeJobDescription } from "@/lib/ai";

const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const maxSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "当前未配置 OPENAI_API_KEY，无法识别 JD 图片。" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传 PNG、JPG、JPEG 或 WEBP 格式的 JD 截图。" }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "图片格式不支持，请上传 PNG、JPG、JPEG 或 WEBP。" }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: "图片过大，请上传 8MB 以内的 JD 截图。" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `你是一名专业招聘 JD 图片识别助手。

任务：
请从用户上传的岗位 JD 截图中识别文字内容，并整理为可分析的岗位描述文本。

规则：
1. 只能识别图片中真实存在的文字。
2. 不要编造岗位、公司、要求或福利。
3. 如果图片模糊、被遮挡或文字不完整，请标记“部分内容无法识别”。
4. 输出 JSON，字段包括 raw_jd_text、job_title、company_name、responsibilities、required_skills、preferred_skills、education_requirements、experience_requirements、keywords、unclear_parts。`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "请识别这张岗位 JD 截图，并只返回 JSON。" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ]
    });

    const parsed = JSON.parse(response.choices[0]?.message.content || "{}");
    const rawText = parsed.raw_jd_text || parsed.rawText || "";
    const analysis = rawText ? await analyzeJobDescription(rawText) : null;

    return NextResponse.json({
      raw_jd_text: rawText || "部分内容无法识别",
      job_title: parsed.job_title || "",
      company_name: parsed.company_name || "",
      responsibilities: parsed.responsibilities || analysis?.responsibilities || [],
      required_skills: parsed.required_skills || analysis?.requiredSkills || [],
      preferred_skills: parsed.preferred_skills || analysis?.preferredPoints || [],
      education_requirements: parsed.education_requirements || [],
      experience_requirements: parsed.experience_requirements || [],
      keywords: parsed.keywords || analysis?.keywords || [],
      unclear_parts: parsed.unclear_parts || (rawText ? [] : ["部分内容无法识别"])
    });
  } catch (error) {
    console.error("JD 图片识别失败", error);
    return NextResponse.json({ error: "JD 图片识别失败，请检查图片清晰度，或改用手动粘贴 JD。" }, { status: 500 });
  }
}
