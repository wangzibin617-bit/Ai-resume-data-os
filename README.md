# 中文版 AI 智能简历优化小程序 MVP

这是一个基于 Next.js + TypeScript + Tailwind CSS + PostgreSQL + Prisma 的中文 AI 简历优化 MVP。

## 已实现

- 中文仪表盘与完整 MVP 页面入口
- PDF / DOCX / TXT 上传接口与解析流程
- 手动录入教育、实习、项目、工作、技能、证书、语言能力
- Prisma 数据库模型：User、UploadedFile、Experience、JobDescription、Resume、ResumeVersion
- 个人经历库保存与删除
- 岗位 JD 分析接口
- 基于经历库的简历生成接口
- 匹配度报告
- 简历预览、手动编辑、保存新版本
- PDF / DOCX / TXT 导出接口
- OpenAI API 集成入口；未配置密钥时使用本地规则兜底

## AI 安全规则

系统提示词和生成流程已内置以下规则：

- AI 不能编造用户不存在的经历
- AI 只能基于用户真实提供的信息进行优化、筛选、重组和润色
- JD 要求没有经历支撑时，必须标记为能力缺口
- 简历内容保持中文求职场景下的专业、清晰、简洁和 ATS 友好

## 本地 PostgreSQL 开发方案

当前 Windows 本地环境连接 Neon PostgreSQL 时可能遇到 TLS 凭证问题。为了先跑通 MVP，建议本地开发阶段先使用本机 PostgreSQL，后续部署到 Vercel / Render 时再切回 Neon。

本地数据库建议配置：

- 数据库名：`ai_resume_optimizer`
- 用户名：`postgres`
- 密码：`postgres`
- 端口：`5432`

如果你使用 PostgreSQL 图形工具，可以创建：

```sql
CREATE DATABASE ai_resume_optimizer;
```

如果你使用 `psql`，可以执行：

```powershell
psql -U postgres
```

进入后执行：

```sql
CREATE DATABASE ai_resume_optimizer;
```

然后将项目根目录 `.env` 临时改为本地连接：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_resume_optimizer?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ai_resume_optimizer?schema=public"
OPENAI_API_KEY="你的 OpenAI API Key，可暂时留空"
OPENAI_MODEL="gpt-4o-mini"
```

说明：

- `DATABASE_URL` 用于 Prisma Client 运行时连接数据库。
- `DIRECT_URL` 在本地开发时可以与 `DATABASE_URL` 相同。
- 不要提交 `.env` 到 Git。
- Neon 连接信息可以先保留在你自己的记录里，MVP 本地跑通后再切回云数据库。

## 本地运行

1. 安装依赖

```powershell
npm.cmd install --cache .\work\npm-cache
```

2. 生成 Prisma Client

```powershell
npm.cmd run prisma:generate
```

3. 推送 schema 到本地 PostgreSQL

MVP 阶段可以使用：

```powershell
npm.cmd exec -- prisma db push
```

正式版本建议补规范的 Prisma migration。

4. 构建检查

```powershell
npm.cmd run build
```

5. 启动开发服务器

```powershell
npm.cmd run dev
```

默认访问地址为 `http://localhost:3000`。如果 3000 端口被占用，Next.js 会自动使用 `http://localhost:3001` 等后续端口。

## 功能自检建议

本地数据库连接成功后，建议依次测试：

- 手动添加经历
- 经历库读取
- 输入岗位 JD
- 生成定制简历
- 简历预览与保存版本
- 导出 PDF / DOCX / TXT
