"use client";

const styles = [
  { name: "黑色简约风", description: "黑白配色，适合正式求职。" },
  { name: "经典 ATS 风", description: "无复杂排版，适合机器筛选。" },
  { name: "现代商务风", description: "更适合产品、运营、市场岗位。" }
];

export function ResumeStyleSelector({
  value = "黑色简约风",
  onChange
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-950">简历风格</h2>
      <div className="mt-3 grid gap-3">
        {styles.map((style) => (
          <label key={style.name} className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 p-3 hover:bg-neutral-50">
            <input
              type="radio"
              name="resume-style"
              checked={value === style.name}
              onChange={() => onChange?.(style.name)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-950">{style.name}</span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">{style.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
