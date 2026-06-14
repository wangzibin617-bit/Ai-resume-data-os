# AI Resume Optimizer CN

中文版 AI 智能简历优化 MVP。项目面向中文求职场景，核心思路是先沉淀“个人资料库”，再根据目标岗位 JD 匹配真实经历，生成岗位定制简历、匹配度报告，并支持在线预览编辑和导出。

这个项目适合作为 AI 产品实习生作品集展示：它不是单纯让 AI 直接写简历，而是围绕“真实资料源 + JD 匹配 + 可控生成”设计完整产品流程。

## 产品定位

很多求职者的问题不是没有经历，而是经历分散、不会根据不同 JD 调整表达，或者容易让 AI 生成不真实内容。本项目尝试解决三个问题：

- 把教育、实习、项目、技能、证书等经历沉淀成可复用的个人资料库
- 根据目标 JD 自动分析岗位职责、关键词、技能要求和优先条件
- 只基于用户真实资料生成定制简历，缺失能力进入匹配报告，不编造经历

## 核心流程

```text
首页
→ 个人资料中心
→ 导入已有简历（可选，用于补全资料库）
→ 输入岗位 JD
→ 选择简历模板
→ 生成定制简历
→ 简历预览与编辑
→ 导出 PDF / Word / TXT
```

## 已实现功能

- 个人资料中心：管理基本信息、教育背景、实习经历、项目经历、技能、证书、语言能力等资料
- 文件导入：支持 TXT / DOCX / PDF 简历材料解析
- 资料库保存：解析后的结构化经历可保存到 `Experience` 表
- JD 输入与分析：提取岗位职责、关键词、技能要求和优先条件
- 简历生成：基于个人资料库和目标 JD 生成岗位定制简历
- 匹配度报告：展示匹配经历、关键词覆盖和能力缺口
- 简历预览：支持结构化简历预览、编辑和版本保存
- 导出功能：支持 TXT / DOCX / PDF
- PDF 中文处理：优先使用浏览器打印 PDF 方案，避免服务端默认字体导致中文乱码
- 数据库异常兜底：数据库连接失败时页面显示中文提示，不直接崩溃

## AI 安全规则

项目内置了面向简历场景的 AI 约束：

- AI 不能编造用户不存在的公司、学校、项目、证书、数字成果或技能
- AI 只能基于用户真实提供的信息进行筛选、重组、润色和表达优化
- 如果 JD 中的要求没有资料支撑，必须在匹配度报告中标记为“能力缺口”
- 简历内容需要适合中文求职场景，表达专业、清晰、简洁
- 用户必须可以手动编辑 AI 生成内容，并保存为新版本

## 技术栈

- Framework: Next.js 14 / React 18 / TypeScript
- UI: Tailwind CSS / lucide-react
- Database: PostgreSQL
- ORM: Prisma
- AI: OpenAI API，未配置密钥时使用本地规则兜底
- File parsing: mammoth / pdf-parse / 自定义 fallback parser
- Export: docx / TXT / 浏览器打印 PDF

## 数据模型

核心数据表：

- `User`：用户
- `UploadedFile`：上传文件记录
- `Experience`：个人资料库 / 经历库
- `JobDescription`：岗位 JD
- `Resume`：生成简历
- `ResumeVersion`：简历版本

MVP 阶段本地数据库可以通过 `prisma/manual-init.sql` 手动初始化。

## 本地运行

### 1. 安装依赖

```powershell
npm.cmd install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填写：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_resume_optimizer?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ai_resume_optimizer?schema=public"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
OPENAI_VISION_MODEL="gpt-4o-mini"
```

说明：

- `DATABASE_URL` 用于 Prisma Client 连接数据库
- `DIRECT_URL` 本地开发时可以和 `DATABASE_URL` 相同
- `OPENAI_API_KEY` 可以暂时留空，系统会使用本地规则兜底
- 不要提交 `.env` 到 GitHub

### 3. 初始化本地 PostgreSQL

建议本地数据库：

```text
database: ai_resume_optimizer
user: postgres
password: postgres
port: 5432
```

创建数据库：

```sql
CREATE DATABASE ai_resume_optimizer;
```

如果 Prisma Schema Engine 在本地异常，可以使用手动 SQL：

```powershell
$env:PGPASSWORD="postgres"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5432 -d ai_resume_optimizer -f prisma/manual-init.sql
Remove-Item Env:PGPASSWORD
```

### 4. 生成 Prisma Client

```powershell
npm.cmd run prisma:generate
```

### 5. 构建检查

```powershell
npm.cmd run build
```

### 6. 启动开发服务器

```powershell
npm.cmd run dev
```

默认访问：

```text
http://localhost:3000
```

如果 3000 被占用，Next.js 会自动使用 3001、3002 等端口。

## 面试展示重点

可以从这几个角度介绍项目：

1. 用户痛点：求职者有经历但不会针对不同 JD 优化简历
2. 产品设计：以个人资料库作为唯一可信数据源，上传简历只是补全资料库
3. AI 价值：分析 JD、匹配经历、优化表达、生成报告
4. 安全边界：AI 不编造经历，缺失项进入能力缺口
5. MVP 能力：从资料录入、JD 分析、简历生成到导出形成完整闭环
6. 迭代思路：后续可优化 OCR、模板系统、在线部署、协同编辑和真实用户反馈

## 当前完成度

- 已完成从资料录入、JD 分析、简历生成、预览编辑到导出的 MVP 闭环
- 已完成 TXT / DOCX / PDF 简历导入解析
- 已完成个人资料库、岗位 JD、简历版本等核心数据模型
- 已完成简历预览、版本保存和 PDF / Word / TXT 导出
- 已完成本地构建和 GitHub 源码托管
- 适合作为 AI 产品实习生面试作品集项目

## 后续规划

- 优化在线部署体验，支持面试官直接访问 Demo
- 增强扫描版 PDF / 图片型简历的 OCR 识别
- 继续完善简历模板系统和 ATS 兼容性
- 增加真实用户反馈入口，用于优化 JD 匹配和生成质量
- 补充更完整的自动化测试和部署流程
