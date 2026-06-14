# PDF 导入最终验收报告

## 1. 问题根因

PDF 简历导入失败发生在 `POST /api/upload/preview` 的 PDF 文本解析阶段，数据库保存链路没有被触发。

原始实现只使用 `pdf-parse` 默认解析器。部分 PDF 会在默认解析器中抛出：

```text
UnknownErrorException: bad XRef entry
```

进一步定位后确认：

- `pdf-parse` 默认解析器无法覆盖所有 PDF 结构。
- `pdf-parse` 内置的旧版 pdf.js fallback 在普通 Node 环境可用。
- Next.js API Route 打包后，直接引用 `pdf-parse/lib/pdf.js/...` 子路径会出现 `Cannot find module`。
- 旧版 pdf.js 会修改传入的 Buffer，多解析器顺序 fallback 时必须为每次尝试传入新的 Buffer 副本。

## 2. 修复方案

已完成以下修复：

- 在 `next.config.mjs` 中将 `pdf-parse` 加入服务端外部包配置：

```js
serverComponentsExternalPackages: [
  "pdfkit",
  "fontkit",
  "restructure",
  "iconv-lite",
  "pdf-parse"
]
```

- PDF 解析改为独立 Node worker 执行，避免 Next API Route 打包和模块缓存影响。
- worker 内部按顺序尝试：
  1. `pdf-parse:default`
  2. `pdf.js-bundled:v2.0.550`
  3. `pdf.js-bundled:v1.10.88`
  4. `pdf.js-bundled:v1.9.426`
- 每次解析尝试都使用新的 Buffer 副本，避免前一个解析器污染后续 fallback。
- 增强错误分类：
  - 加密 PDF
  - 结构异常 PDF
  - 扫描 / 图片型 PDF
  - 通用解析异常

## 3. 测试矩阵

### 已验证样本

| 类型 | 文件 | 结果 | 使用解析器 | 备注 |
| --- | --- | --- | --- | --- |
| TXT 导入 | `resume-cn-test.txt` | 成功 | `text` | 回归通过，解析 3 条经历 |
| DOCX 导入 | `resume-cn-test.docx` | 成功 | `mammoth` | 回归通过，解析 3 条经历 |
| 真实中文简历 PDF | `1780226189470-王子彬AI.pdf` | 成功 | `pdf-parse:default` | 解析 2521 字，生成 2 条经历 |
| PDFKit 导出 PDF | `final-preview-export-test.pdf` | 成功 | `pdf-parse:default` | 解析 4691 字，生成 1 条经历 |
| ReportLab PDF | `resume-reportlab.pdf` | 成功 | `pdf.js-bundled:v1.10.88` | 默认解析失败后 fallback 成功 |
| 结构异常 PDF / bad XRef | `resume-test.pdf` | 成功 | `pdf.js-bundled:v1.10.88` | 默认解析失败后 fallback 成功 |
| 扫描 / 无文字层 PDF | `scanned-image-only-reportlab.pdf` | 失败 | 无文字层 | 正确返回 `PDF_SCANNED` |

### 未验证样本

| 类型 | 状态 | 原因 |
| --- | --- | --- |
| Word 导出 PDF | 未验证 | 当前环境无法创建 Word COM 实例 |
| 浏览器打印 PDF | 未验证 | 当前沙箱不允许启动系统 Chrome 生成样本 |
| WPS 导出 PDF | 未验证 | 当前环境未检测到 WPS 可用样本 |
| Adobe Acrobat 导出 PDF | 未验证 | 当前环境未提供 Adobe 导出样本 |

## 4. 成功率

本次真实执行的导入回归：

- TXT：1 / 1 成功
- DOCX：1 / 1 成功
- 文字层 PDF：4 / 4 成功
- 扫描 / 无文字层 PDF：0 / 1 成功，符合当前已知限制

如果只统计文字层 PDF，成功率为 100%。

如果统计全部 PDF 样本，包括扫描 / 无文字层 PDF，成功率为 80%。

## 5. 保存链路验证

已验证链路：

```text
解析成功
↓
POST /api/experiences/bulk
↓
Prisma createMany
↓
数据库新增记录
```

验收结果：

- 保存接口：`POST /api/experiences/bulk`
- 返回状态：`201`
- 返回内容：`{ "count": 2 }`
- 数据库新增记录：2 条

## 6. 已知限制

- 加密 PDF 暂不支持，需要用户解除密码后上传。
- 扫描件 / 图片型 PDF 暂不支持 OCR，当前会返回：

```text
检测到图片型PDF，当前未提取到文字层，建议使用OCR识别或上传Word/TXT版本。
```

- OCR 支持建议在后续版本引入，例如 `tesseract.js` 或云端 OCR 服务。
- Word / WPS / Adobe 导出的 PDF 需要用户提供真实样本后再补充验收，不应在未测试前标记为成功。
