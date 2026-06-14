import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <>
      <PageHeader
        title="导入已有简历"
        description="上传 PDF、Word 或 TXT 后，系统会解析内容并补充到个人资料库。导入不是最终简历生成入口，保存前你可以先确认解析结果。"
        currentHref="/upload"
        action={
          <Link href="/profile" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            查看个人资料
          </Link>
        }
      />
      <section className="mb-5 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold text-neutral-950">导入流程</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {["上传已有简历", "解析为结构化资料", "确认真实内容", "保存到个人资料库"].map((item, index) => (
            <div key={item} className="rounded-md border border-neutral-200 p-4">
              <div className="text-xs text-neutral-500">步骤 {index + 1}</div>
              <div className="mt-2 text-sm font-medium text-neutral-950">{item}</div>
            </div>
          ))}
        </div>
      </section>
      <UploadForm />
    </>
  );
}
