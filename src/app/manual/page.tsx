import { ExperienceForm } from "@/components/ExperienceForm";
import { PageHeader } from "@/components/PageHeader";

export default function ManualPage() {
  return (
    <>
      <PageHeader title="手动添加经历" description="补充教育、实习、项目、工作、技能、证书和语言能力。请只填写真实经历，AI 后续只会基于这些内容优化。" currentHref="/manual" />
      <ExperienceForm />
    </>
  );
}
