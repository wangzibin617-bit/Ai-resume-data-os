import { AlertTriangle } from "lucide-react";

export function DatabaseWarning({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <div className="font-medium">数据库暂时不可用</div>
        <div className="mt-1">{message}</div>
      </div>
    </div>
  );
}
