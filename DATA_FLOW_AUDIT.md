# 数据链路审计报告

审计时间：2026-06-14

约束：本次只做审计，没有修改代码，没有修改数据库结构，没有修改 Prisma schema，没有执行 migrate 或 db push，没有修改 PDF 导入导出逻辑。

## 总结结论

当前链路不是完全断开，而是存在两个产品/实现错位：

1. 上传解析和写入是两步操作。`/api/upload/preview` 只返回解析结果，不写入数据库。用户必须点击“确认保存到个人资料中心”，前端才会调用 `/api/experiences/bulk` 写入 `Experience`。
2. 上传写入后的 `Experience.source` 多为 `UPLOAD`，不是 `PROFILE_EDUCATION` / `PROFILE_PROJECT` / `PROFILE_SKILLS`。资料完整度会通过 `type/title/source` 推断模块，所以完整度会变化；但 `/profile` 默认打开“基本信息”模块，上传内容通常在“教育背景 / 项目经历 / 技能”等模块下，用户不切换模块就看不到对应资料。
3. 简历预览的服务端链路可返回 200，Resume 和 ResumeVersion 都存在。当前“预览页打不开”的高风险根因在 `src/app/preview/layout.tsx`：这是嵌套路由 layout，却重新声明了 `<html>` 和 `<body>`，会造成嵌套 HTML 文档结构，容易导致浏览器端 hydration / 页面渲染异常。

## A. 上传链路

### 上传接口

当前前端上传页面组件：

```text
src/components/UploadForm.tsx
```

前端解析调用：

```text
POST /api/upload/preview
```

接口文件：

```text
src/app/api/upload/preview/route.ts
```

接口行为：

- 接收 `FormData.file`
- 调用 `parseUploadedFileDetailed(file)`
- 调用 `extractExperiencesFromText(parsedText)`
- 返回解析结果
- 不写入数据库

返回字段：

```json
{
  "fileName": "...",
  "parsedText": "...",
  "experiences": [],
  "parser": "...",
  "warnings": []
}
```

### 前端收到什么

审计测试样本：

```text
tmp-upload-tests/resume-cn-test.txt
```

接口结果：

```json
{
  "status": 200,
  "parser": "text",
  "experienceCount": 3,
  "firstExperience": {
    "type": "EDUCATION",
    "title": "教育背景",
    "source": "UPLOAD",
    "description": "上海大学 本科 计算机科学 2022-2026"
  }
}
```

### 是否有状态展示

有。

`UploadForm` 中有：

- `message`
- `loading`
- `experiences`

状态文案包括：

- “正在解析并整理为个人资料...”
- “解析完成，请确认 X 条资料后保存到个人资料库。”
- “正在保存到个人资料中心...”
- “已保存 X 条资料到个人资料中心。”

### 是否有解析结果展示

有，但有条件：

```tsx
{experiences.length ? (...) : null}
```

只有当 `result.experiences.length > 0` 时才显示“结构化资料预览”。

如果用户上传后前端没有显示解析成果，可能原因：

- `/api/upload/preview` 返回的 `experiences` 是空数组。
- 前端请求失败，只显示错误 message。
- 用户上传后页面刷新或跳转，`experiences` 只是 React state，没有持久化。
- CSS/页面位置导致用户没有看到下方的预览区。

本次接口测试中，解析结果实际返回了 3 条，说明解析接口本身可用。

## B. 资料库链路

### 上传后是否真正写入 Experience

上传预览接口不会写库。

写入发生在用户点击“确认保存到个人资料中心”后，前端调用：

```text
POST /api/experiences/bulk
```

接口文件：

```text
src/app/api/experiences/bulk/route.ts
```

写入逻辑：

```ts
prisma.experience.createMany({
  data: payload.experiences.map(...)
})
```

审计测试结果：

```json
{
  "bulkStatus": 201,
  "bulkOk": true,
  "bulkBody": { "count": 3 },
  "beforeCount": 0,
  "afterCount": 3
}
```

确认写入 3 条 `Experience`。

### 写入哪些 source

上传解析结果来自 `extractExperiencesFromText`，其 `source` 是：

```text
UPLOAD
```

批量保存接口如果 payload 没有 source，才默认：

```text
UPLOAD_PREVIEW
```

但当前上传解析返回的每条 experience 都带 `source: "UPLOAD"`，因此实际写入多为：

```text
UPLOAD
```

数据库 source 分布摘要：

```json
[
  { "source": "UPLOAD", "count": 38 },
  { "source": "MANUAL", "count": 4 },
  { "source": "PROFILE_PROJECT", "count": 1 },
  { "source": "PROFILE_SKILLS", "count": 1 },
  { "source": "PROFILE_EDUCATION", "count": 1 }
]
```

### Profile 页面查询条件

页面文件：

```text
src/app/profile/page.tsx
```

查询逻辑：

```ts
prisma.experience.findMany({
  where: { userId: user.id },
  orderBy: { updatedAt: "desc" }
})
```

结论：Profile 页面没有过滤 `source`，会读取所有 Experience，包括上传导入的 `UPLOAD` 数据。

### Profile 页面渲染条件

组件文件：

```text
src/components/ProfileForm.tsx
```

模块分组逻辑：

```ts
result[inferProfileModuleId(experience)].push(experience)
```

模块推断文件：

```text
src/lib/profile-modules.ts
```

推断规则：

1. 如果 `source` 等于 `PROFILE_*`，按 source 匹配。
2. 否则按 title 判断，例如包含“教育”“项目”“技能”。
3. 再否则按 type 判断，例如 `EDUCATION` -> education，`PROJECT` -> project，`SKILL` -> skills。

### 为什么资料完整度能够变化，但用户看不到对应资料内容

根因是“完整度统计”和“当前可见模块”不是同一个概念。

完整度计算：

```ts
calculateProfileCompleteness(experiences)
```

它会遍历全部 Experience，并通过 `source/title/type` 推断模块。所以只要上传写入了 `EDUCATION`、`PROJECT`、`SKILL`，完整度就会变化。

但 Profile 页面右侧只显示当前选中模块：

```ts
const [activeId, setActiveId] = useState<ProfileModuleId>("basic");
const activeItems = grouped[activeModule.id];
```

默认选中：

```text
basic / 基本信息
```

上传简历解析出的数据通常是：

- 教育背景
- 项目经历
- 技能

这些会被分到：

- education
- project
- skills

不会显示在默认打开的“基本信息”模块里。

因此用户会看到完整度变化，但当前模块仍显示空内容，从体验上像“没有保存到资料中心”。

## C. 简历链路

### Generate 页面生成了什么

页面文件：

```text
src/app/generate/page.tsx
```

生成接口：

```text
POST /api/resumes/generate
```

接口文件：

```text
src/app/api/resumes/generate/route.ts
```

生成逻辑：

1. 根据 `jobDescriptionId` 读取 JobDescription。
2. 读取当前用户全部 Experience。
3. 调用 `generateTailoredResume(...)`。
4. 将结果解析为 StructuredResume。
5. 写入 `Resume`。
6. 同时创建 `ResumeVersion` version 1。

审计测试结果：

```json
{
  "resumeStatus": 201,
  "resumeOk": true,
  "resumeId": "cmqdmp50b000cp9z9mm8b0z70",
  "resumeRecord": {
    "status": "GENERATED",
    "contentLength": 3760,
    "versionsCount": 1,
    "versionNumbers": [1]
  }
}
```

### Resume 表是否有记录

有。

数据库摘要：

```json
{
  "resumeCount": 13,
  "latestResume": {
    "id": "cmqdmp50b000cp9z9mm8b0z70",
    "status": "GENERATED",
    "contentLength": 3760,
    "matchScore": 95,
    "versions": 1
  }
}
```

### ResumeVersion 是否有记录

有。

数据库摘要：

```json
{
  "versionCount": 17,
  "latestResumeVersions": 1
}
```

### 生成链路服务端错误

本次测试中 OpenAI 调用返回 503：

```text
503 No available channel for model gpt-4o-mini under group codex pro
```

但代码已经有本地兜底：

- `analyzeJobDescription` 失败后使用 `localAnalyzeJD`
- `generateTailoredResume` 失败后使用 `localGenerateResume`

因此 JD 保存和 Resume 生成仍然返回 201。

这个 503 是外部模型通道问题，不是 Resume 数据写入失败原因。

## D. 预览页链路

### Preview 页面依赖哪些参数

页面路径：

```text
/preview
/preview?resumeId=xxx
```

页面文件：

```text
src/app/preview/page.tsx
```

依赖参数：

```ts
searchParams.resumeId
```

如果有 `resumeId`：

```ts
prisma.resume.findFirst({ where: { id: searchParams.resumeId, userId: user.id } })
```

如果没有 `resumeId`：

```ts
prisma.resume.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } })
```

### 读取哪个 API

服务端页面直接读取 Prisma，不通过 API。

相关 API 另有：

```text
GET /api/resumes/[id]
POST /api/resumes/[id]/versions
```

其中 `ResumeEditor` 保存版本时调用：

```text
POST /api/resumes/[id]/versions
```

### 当前打不开的具体原因

审计结果显示：

```json
{
  "previewStatus": 200,
  "previewOk": true,
  "containsResumeTitle": true
}
```

服务端返回 200，且 HTML 中包含简历标题。说明数据库查询和服务端渲染不是主要断点。

但审计同时发现：

```text
src/app/preview/layout.tsx
```

内容是：

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

这是嵌套在 `src/app/layout.tsx` 下面的子 layout，不应该再次渲染 `<html>` 和 `<body>`。

根 layout 已经有：

```tsx
<html lang="zh-CN">
  <body>...</body>
</html>
```

因此 `/preview` 实际形成嵌套 HTML/body 结构。Next App Router 中只有根 layout 应该包含 `<html>` 和 `<body>`。

高概率影响：

- 浏览器页面结构异常
- hydration 异常
- 客户端组件不正常挂载
- 页面看起来“打不开”或空白

### 控制台错误

本次审计没有成功接入真实浏览器控制台采集，但从代码结构可判断 `/preview/layout.tsx` 是明确的 App Router 结构错误点。

### 服务端错误

本次 dev server 日志中：

```text
GET /preview?resumeId=cmqdmp50b000cp9z9mm8b0z70 200 in 388ms
```

没有服务端 500。

构建也通过：

```text
npm run build
✓ Compiled successfully
✓ Generating static pages (23/23)
```

### 为什么 Resume 已生成，但 Preview 页面打不开

Resume 数据已生成，Preview 服务端也能读到 Resume。

当前更可能是前端路由 layout 问题，而不是 Resume 数据不存在：

- `Resume` 表有记录。
- `ResumeVersion` 有记录。
- `/preview?resumeId=...` 服务端返回 200。
- HTML 包含简历标题。
- `src/app/preview/layout.tsx` 错误地再次渲染 `<html>` 和 `<body>`。

因此“打不开”的根因定位为：

```text
Preview 子路由 layout 结构错误，导致浏览器端渲染异常。
```

## 关键审计数据

### 上传预览接口

```json
{
  "previewStatus": 200,
  "parser": "text",
  "experienceCount": 3
}
```

### 批量保存接口

```json
{
  "bulkStatus": 201,
  "bulkBody": { "count": 3 },
  "beforeCount": 0,
  "afterCount": 3
}
```

### Profile 页面

```json
{
  "status": 200,
  "containsSavedTitle": true,
  "containsUploadSourceText": true
}
```

### Generate

```json
{
  "jdStatus": 201,
  "resumeStatus": 201,
  "resumeId": "cmqdmp50b000cp9z9mm8b0z70"
}
```

### Preview

```json
{
  "status": 200,
  "containsResumeTitle": true
}
```

## 根因定位

### 问题 1：上传简历后前端没有显示解析成果

可能根因：

1. 解析结果只存在 React state，页面刷新后会消失。
2. 只有 `experiences.length > 0` 才展示预览，如果解析出的 experiences 为空则不展示。
3. 上传预览区在上传框下方，用户可能没有看到。

本次接口测试证明 `/api/upload/preview` 能返回 3 条结构化结果。

### 问题 2：上传后的内容没有体现到个人资料中心

根因：

1. 上传预览不会写入数据库，必须点击“确认保存到个人资料中心”。
2. 保存后 source 是 `UPLOAD`，不是 `PROFILE_*`。
3. Profile 默认打开“基本信息”，而上传内容会被分到教育/项目/技能模块。
4. 完整度统计看全量 Experience，所以会变化；右侧内容只看当前 active module，所以用户可能看不到。

### 问题 3：简历预览页面无法打开

根因定位：

```text
src/app/preview/layout.tsx 是子 layout，却包含 <html> 和 <body>。
```

这会造成嵌套 HTML 文档结构。服务端返回 200，不代表浏览器端可正常渲染。

## 建议修复方案（未执行）

### 上传链路

1. 在上传解析成功后始终显示解析摘要。
2. 如果 `experiences.length === 0`，显示“已解析文本但未识别出结构化模块”，并展示 parsedText 预览。
3. 保存成功后提供“查看个人资料中心”按钮，并带上目标模块提示。

### 资料中心链路

1. 保存上传资料时把 source 从 `UPLOAD` 映射到更明确的模块 source，例如：
   - `EDUCATION` -> `PROFILE_EDUCATION`
   - `PROJECT` -> `PROFILE_PROJECT`
   - `SKILL` -> `PROFILE_SKILLS`
2. Profile 页面增加“全部资料”视图，或保存后自动跳转到有新增资料的模块。
3. 默认 active module 可以根据最近新增资料自动选择，而不是固定 `basic`。

### 预览页链路

1. 删除或修改 `src/app/preview/layout.tsx`。
2. 子 layout 不应返回 `<html>` 和 `<body>`，只应返回：

```tsx
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

或直接删除该子 layout，让 `/preview` 使用根 layout。

## 下一步操作

等待确认后再修复。

建议优先顺序：

1. 修复 `src/app/preview/layout.tsx`，解决预览页打不开。
2. 调整上传保存 source 映射和保存后的跳转提示。
3. 增加上传解析空结果的 parsedText 预览。

