import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";

export async function exportTxt(content: string) {
  return Buffer.from(content, "utf-8");
}

export async function exportDocx(content: string) {
  const doc = new Document({
    sections: [
      {
        children: content.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line || " ")]
            })
        )
      }
    ]
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function exportPdf(content: string) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(11).text(content, {
    lineGap: 6,
    width: 500
  });
  doc.end();

  return done;
}
