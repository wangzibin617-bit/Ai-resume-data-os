import { PrismaClient } from "@prisma/client";

export const DATABASE_CONNECTION_ERROR_MESSAGE = "当前数据库连接失败，请检查 DATABASE_URL 或本地 TLS 环境。";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function getDemoUser() {
  try {
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        name: "示例用户"
      }
    });

    return {
      ...user,
      databaseAvailable: true,
      databaseError: null
    };
  } catch (error) {
    console.error(DATABASE_CONNECTION_ERROR_MESSAGE, error);

    return {
      id: "demo-user-offline",
      name: "示例用户",
      email: "demo@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      databaseAvailable: false,
      databaseError: DATABASE_CONNECTION_ERROR_MESSAGE
    };
  }
}
