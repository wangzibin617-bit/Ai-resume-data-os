"use client";

import { useEffect } from "react";

export function PrintControls() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto mb-4 flex max-w-[794px] items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 print:hidden">
      <div>
        <div className="font-medium text-neutral-950">浏览器打印 PDF</div>
        <div className="mt-1 text-sm text-neutral-500">PDF 将通过浏览器打印方式生成，可避免中文乱码。</div>
      </div>
      <button onClick={() => window.print()} className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
        打印 / 保存 PDF
      </button>
    </div>
  );
}
