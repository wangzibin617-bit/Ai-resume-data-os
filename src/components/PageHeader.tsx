import { FlowNav } from "@/components/FlowNav";

export function PageHeader({
  title,
  description,
  action,
  currentHref = "/"
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  currentHref?: string;
}) {
  return (
    <div className="mb-6">
      <FlowNav currentHref={currentHref} />
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-950">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
