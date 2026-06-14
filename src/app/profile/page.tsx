import { DatabaseWarning } from "@/components/DatabaseWarning";
import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { DATABASE_CONNECTION_ERROR_MESSAGE, getDemoUser, prisma } from "@/lib/prisma";
import { calculateProfileCompleteness } from "@/lib/profile-modules";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getDemoUser();
  let dbError = user.databaseError;
  let experiences: Array<{
    id: string;
    type: "EDUCATION" | "INTERNSHIP" | "WORK" | "PROJECT" | "SKILL" | "CERTIFICATE" | "LANGUAGE" | "OTHER";
    title: string;
    organization: string | null;
    location: string | null;
    description: string;
    skills: string[];
    keywords: string[];
    source: string;
    createdAt: string;
    updatedAt: string;
  }> = [];

  if (user.databaseAvailable) {
    try {
      const saved = await prisma.experience.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" }
      });
      experiences = saved.map((experience) => ({
        ...experience,
        createdAt: experience.createdAt.toISOString(),
        updatedAt: experience.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);
      dbError = DATABASE_CONNECTION_ERROR_MESSAGE;
    }
  }

  const completeness = calculateProfileCompleteness(experiences);

  return (
    <>
      <PageHeader
        title="个人资料中心"
        description={`这里是 AI 生成简历的唯一可信资料源。当前完整度 ${completeness.percent}%，每个模块都可以单独新增、编辑和删除。`}
        currentHref="/profile"
      />
      <DatabaseWarning message={dbError} />
      <ProfileForm initialExperiences={experiences} />
    </>
  );
}
