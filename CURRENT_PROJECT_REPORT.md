# AI 智能简历优化小程序项目现状报告

更新时间：2026-06-12

## 1. 项目定位

这是一个中文版 AI 智能简历优化小程序 MVP。

当前产品逻辑已经从“上传简历后生成简历”调整为：

```text
首页
↓
个人资料中心
↓
导入已有简历（可选）
↓
输入岗位 JD
↓
选择简历模板
↓
生成简历
↓
简历预览与编辑
↓
导出 PDF / Word / TXT
```

核心原则：

- 个人资料库是唯一可信数据源。
- AI 不能编造经历。
- 上传简历只是补充个人资料库，不是最终简历生成入口。
- 简历生成必须基于用户已保存的真实资料和目标岗位 JD。

## 2. 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- OpenAI API
- PDF / DOCX / TXT 文件解析
- DOCX / TXT 导出
- PDF 使用浏览器打印页方案为主

## 3. 当前已完成模块

### 首页

已重构为产品流程首页，展示：

- 完善个人资料
- 导入已有简历（可选）
- 输入 JD
- 选择模板
- 生成简历

首页还展示：

- 资料完整度
- 已完成 / 缺失模块
- JD 数量
- 已生成简历数量
- 最近简历
- 下一步建议

### 个人资料中心

路径：`/profile`

当前支持 10 个模块：

1. 基本信息
2. 教育背景
3. 实习经历
4. 项目经历
5. 校园经历
6. 技能
7. 证书
8. 奖项
9. 语言能力
10. 个人链接

每个模块支持：

- 新增
- 编辑
- 删除
- 独立保存

资料完整度会根据模块是否已有数据自动计算。

### 导入已有简历

路径：`/upload`

当前定位已经调整为：

```text
导入已有简历
↓
解析为结构化资料
↓
用户确认
↓
保存到个人资料库
```

支持：

- PDF
- DOCX
- TXT

注意：导入不会直接生成最终简历。

### 岗位 JD

路径：`/jd`

支持：

- 手动粘贴 JD
- 上传 JD 图片识别入口
- 上传 JD 文件解析入口
- 保存岗位 JD
- 分析岗位关键词、技能要求、职责和优先条件

### 模板选择与生成

路径：`/generate`

当前支持：

- 从个人资料库读取真实经历
- 输入 JD 后选择模板
- 选择内容密度
- 生成结构化简历
- 生成匹配度报告

生成前会显示：

- 资料完整度
- 哪些模块已完成
- 哪些模块缺失

### 简历预览

路径：`/preview`

当前支持：

- 简历模板预览
- 内容编辑
- 保存版本
- 模块显示控制
- 下载 Word
- 下载 TXT
- PDF 打印页入口

### 匹配报告

路径：`/report`

当前展示：

- 匹配分
- 匹配关键词
- 匹配经历
- 能力缺口
- 优化建议

### 导出

路径：`/export`

当前支持：

- TXT 导出
- DOCX 导出
- PDF 打印导出方案

## 4. 数据库现状

数据库仍使用原有表结构，没有新增表，没有执行新的 Prisma migration。

当前主要复用：

- `User`
- `UploadedFile`
- `Experience`
- `JobDescription`
- `Resume`
- `ResumeVersion`

个人资料中心复用 `Experience` 表。

模块来源通过 `Experience.source` 区分，例如：

- `PROFILE_BASIC`
- `PROFILE_EDUCATION`
- `PROFILE_PROJECT`
- `PROFILE_SKILLS`

## 5. PDF 导入状态

PDF 导入链路已经完成验收，报告文件：

```text
PDF_IMPORT_REPORT.md
```

已验证：

- TXT 导入成功
- DOCX 导入成功
- 真实中文 PDF 成功
- PDFKit PDF 成功
- ReportLab PDF fallback 成功
- bad XRef PDF fallback 成功
- 扫描 / 无文字层 PDF 会正确提示当前不支持 OCR

已知限制：

- 加密 PDF 暂不支持
- 扫描件 PDF 暂不支持 OCR
- OCR 可作为后续版本能力

## 6. 最近一次验收结果

已通过：

- 首页可打开
- `/profile` 可打开
- `/upload` 可打开
- `/jd` 可打开
- `/generate` 可打开
- 新增教育背景成功
- 新增项目经历成功
- 新增技能成功
- 刷新后数据仍存在
- 编辑资料成功
- 删除资料成功
- 输入 JD 成功
- 生成简历成功
- `npm.cmd run build` 成功

## 7. 本地预览方式

在项目根目录运行：

```powershell
npm.cmd run dev
```

默认访问：

```text
http://localhost:3000
```

如果 3000 被占用，Next.js 会自动选择 3001、3002 等端口，请以终端输出的 `Local:` 地址为准。

## 8. 环境变量

项目根目录 `.env` 需要：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_resume_optimizer?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ai_resume_optimizer?schema=public"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
```

说明：

- 本地开发建议使用本地 PostgreSQL。
- Neon 云数据库之前在 Windows 本地环境遇到 TLS 问题，MVP 阶段暂时改成本地 PostgreSQL。
- `.env` 不应提交到 Git。

## 9. 当前不要做的事

除非明确要求，否则不要继续修改：

- PDF 解析
- PDF 导出
- 数据库结构
- Prisma migration
- Prisma db push

## 10. 下一步建议

建议下一阶段优先做：

1. 优化个人资料中心的字段编辑体验，让编辑时能回填到结构化字段，而不是只编辑原始文本。
2. 让上传解析结果更准确地映射到个人资料 10 个模块。
3. 强化生成简历时的模块选择和资料缺口提醒。
4. 补充真实 Word / WPS / Adobe PDF 样本测试。
5. 后续再考虑 OCR。

