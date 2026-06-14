"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteExperienceButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm("确认删除这条经历吗？删除后 AI 将不能再使用这条经历生成简历。");
    if (!confirmed) return;

    const response = await fetch(`/api/experiences/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <button onClick={handleDelete} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-coral" title="删除经历">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
