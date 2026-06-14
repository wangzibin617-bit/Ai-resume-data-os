import mammoth from "mammoth";
import path from "path";
import { spawn } from "child_process";
import os from "os";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";

type PdfParserName = "pdf-parse:default" | `pdf.js-bundled:${PdfParseVersion}`;
type PdfParseVersion = "v1.10.100" | "v2.0.550" | "v1.10.88" | "v1.9.426";
type FileParseErrorCode =
  | "UNSUPPORTED_FILE"
  | "PDF_PASSWORD_PROTECTED"
  | "PDF_DAMAGED"
  | "PDF_SCANNED"
  | "PDF_PARSE_FAILED";

export type ParsedFileResult = {
  text: string;
  parser: "mammoth" | "text" | PdfParserName;
  warnings: string[];
};

export class FileParseError extends Error {
  code: FileParseErrorCode;
  details?: string;

  constructor(code: FileParseErrorCode, message: string, details?: string) {
    super(message);
    this.name = "FileParseError";
    this.code = code;
    this.details = details;
  }
}

export async function parseUploadedFile(file: File) {
  const parsed = await parseUploadedFileDetailed(file);
  return parsed.text;
}

export async function parseUploadedFileDetailed(file: File): Promise<ParsedFileResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return parsePdfWithFallback(buffer);
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return { text: normalizeText(parsed.value), parser: "mammoth", warnings: [] };
  }

  if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
    return { text: normalizeText(buffer.toString("utf-8")), parser: "text", warnings: [] };
  }

  throw new FileParseError("UNSUPPORTED_FILE", "暂不支持该文件格式，请上传 PDF、DOCX 或 TXT 文件。");
}

export function extractExperiencesFromText(text: string) {
  const sections = splitResumeSections(text);

  if (sections.length === 0) {
    return [
      {
        type: "OTHER" as const,
        title: "解析出的简历内容",
        description: text.slice(0, 6000),
        skills: guessKeywords(text),
        keywords: guessKeywords(text),
        source: "UPLOAD"
      }
    ];
  }

  return sections.map((section) => ({
    type: inferExperienceType(section.title),
    title: section.title,
    description: section.body,
    skills: guessKeywords(section.body),
    keywords: guessKeywords(`${section.title}\n${section.body}`),
    source: "UPLOAD"
  }));
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdfWithFallback(buffer: Buffer): Promise<ParsedFileResult> {
  const parsed = await parseWithPdfWorker(buffer);
  const text = normalizeText(parsed.text ?? "");

  if (text.length > 0 && parsed.parser) {
    return {
      text,
      parser: parsed.parser,
      warnings: parsed.warnings ?? []
    };
  }

  throw classifyPdfParseError(parsed.errors ?? ["PDF worker未返回可解析内容"]);
}

async function parseWithPdfWorker(buffer: Buffer) {
  const workerPath = path.join(process.cwd(), "src", "lib", "pdf-parse-worker.cjs");
  const tempDir = path.join(os.tmpdir(), "ai-resume-pdf-import");
  const tempPath = path.join(tempDir, `${randomUUID()}.pdf`);

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(tempPath, buffer);

    const stdout = await runPdfWorker(workerPath, tempPath);
    const parsed = JSON.parse(stdout) as {
      text?: string;
      parser?: PdfParserName | null;
      warnings?: string[];
      errors?: string[];
      error?: { name?: string; message?: string };
    };

    if (parsed.error) {
      throw new Error(`${parsed.error.name ?? "Error"}: ${parsed.error.message ?? "PDF worker解析失败"}`);
    }

    return parsed;
  } catch (workerError) {
    const workerMessage = formatParserError(workerError);

    throw new Error(workerMessage);
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }
}

function runPdfWorker(workerPath: string, filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath, "fallback-all", filePath], {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf-8");

      if (code === 0 && stdout.length > 0) {
        resolve(stdout);
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString("utf-8").trim();
      reject(new Error(stderr || stdout || `PDF worker exited with code ${code}`));
    });
  });
}

function classifyPdfParseError(errors: string[]) {
  const details = errors.join(" | ");
  const lowerDetails = details.toLowerCase();

  if (lowerDetails.includes("password") || lowerDetails.includes("encrypted")) {
    return new FileParseError("PDF_PASSWORD_PROTECTED", "该PDF受密码保护，请先解除密码后再上传。", details);
  }

  if (errors.some((error) => error.includes("未提取到文字层"))) {
    return new FileParseError(
      "PDF_SCANNED",
      "检测到图片型PDF，当前未提取到文字层，建议使用OCR识别或上传Word/TXT版本。",
      details
    );
  }

  if (
    lowerDetails.includes("bad xref") ||
    lowerDetails.includes("invalid pdf") ||
    lowerDetails.includes("xref") ||
    lowerDetails.includes("trailer") ||
    lowerDetails.includes("eof")
  ) {
    return new FileParseError("PDF_DAMAGED", "PDF结构异常，已尝试备用解析器仍无法提取文字。", details);
  }

  return new FileParseError("PDF_PARSE_FAILED", "PDF解析异常，已尝试备用解析器。", details);
}

function formatParserError(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

function splitResumeSections(text: string) {
  const headings = [
    "教育背景",
    "实习经历",
    "工作经历",
    "项目经历",
    "技能",
    "专业技能",
    "证书",
    "语言能力",
    "校园经历",
    "获奖经历"
  ];
  const pattern = new RegExp(`(^|\\n)(${headings.join("|")})[:：]?\\s*`, "g");
  const matches = [...text.matchAll(pattern)];

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
      return {
        title: match[2],
        body: text.slice(start, end).trim()
      };
    })
    .filter((section) => section.body.length > 0);
}

function inferExperienceType(title: string) {
  if (title.includes("教育")) return "EDUCATION" as const;
  if (title.includes("实习")) return "INTERNSHIP" as const;
  if (title.includes("工作")) return "WORK" as const;
  if (title.includes("项目")) return "PROJECT" as const;
  if (title.includes("技能")) return "SKILL" as const;
  if (title.includes("证书") || title.includes("获奖")) return "CERTIFICATE" as const;
  if (title.includes("语言")) return "LANGUAGE" as const;
  return "OTHER" as const;
}

export function guessKeywords(text: string) {
  const dictionary = [
    "数据分析",
    "用户研究",
    "产品设计",
    "项目管理",
    "运营",
    "增长",
    "SQL",
    "Python",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Excel",
    "PowerPoint",
    "Tableau",
    "机器学习",
    "大模型",
    "AIGC",
    "沟通协作",
    "英文"
  ];

  return dictionary.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase())).slice(0, 12);
}
