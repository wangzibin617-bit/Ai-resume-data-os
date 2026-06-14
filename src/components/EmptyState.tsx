import Link from "next/link";

export function EmptyState({
  title,
  description,
  href,
  action
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {href && action ? (
        <Link href={href} className="mt-5 inline-flex rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
