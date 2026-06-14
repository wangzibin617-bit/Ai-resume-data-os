"use client";

import { useEffect, useState } from "react";
import { PrintControls } from "@/components/PrintControls";
import { ResumePaper } from "@/components/ResumePaper";
import type { StructuredResume } from "@/lib/structured-resume";

export function PrintResumeClient({
  initialResume,
  draftKey
}: {
  initialResume: StructuredResume;
  draftKey?: string;
}) {
  const [resume, setResume] = useState(initialResume);

  useEffect(() => {
    if (!draftKey) return;
    const stored = window.localStorage.getItem(draftKey);
    if (!stored) return;

    try {
      setResume(JSON.parse(stored) as StructuredResume);
    } catch (error) {
      console.error("读取打印草稿失败，已使用已保存版本。", error);
    }
  }, [draftKey]);

  return (
    <>
      <PrintControls />
      <ResumePaper resume={resume} />
    </>
  );
}
