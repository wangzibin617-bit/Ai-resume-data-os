# GitHub 上传指南

## 当前状态

- 项目目录：`C:\Users\asus\Documents\Codex\2026-05-30\i-want-to-build-an-ai`
- Git 仓库已初始化
- `.env` 已被 `.gitignore` 忽略，不会上传
- `node_modules`、`.next`、本地缓存、测试上传文件、Codex 工具目录已被忽略
- `npm.cmd run build` 已通过

## 为什么需要你在本机执行最后几步

当前 Codex 沙盒对 `.git` 目录只有只读权限，无法执行 `git add`、`git commit`、`git push`。

你在本机 PowerShell 里执行下面命令即可完成上传。

## 第一步：在 GitHub 创建空仓库

建议仓库名：

```text
ai-resume-optimizer-cn
```

创建时注意：

- 不要勾选自动生成 README
- 不要添加 `.gitignore`
- 不要添加 License

创建后复制仓库地址，格式类似：

```text
https://github.com/你的用户名/ai-resume-optimizer-cn.git
```

## 第二步：在本机 PowerShell 执行

进入项目目录：

```powershell
cd "C:\Users\asus\Documents\Codex\2026-05-30\i-want-to-build-an-ai"
```

检查忽略文件是否正确：

```powershell
git status --short --ignored
```

确认以下内容是 ignored：

```text
.env
.next
node_modules
work
tmp-upload-tests
public/uploads/真实上传文件
```

提交代码：

```powershell
git add .
git status
git commit -m "Initial AI resume optimizer MVP"
```

绑定 GitHub 远程仓库：

```powershell
git branch -M main
git remote add origin https://github.com/你的用户名/ai-resume-optimizer-cn.git
git push -u origin main
```

## 第三步：上传后检查

打开 GitHub 仓库页面，确认：

- 没有 `.env`
- 没有 `node_modules`
- 没有 `.next`
- 没有 `work`
- 没有真实上传的 PDF / TXT 文件
- README 能正常显示中文

## 面试展示建议

README 中重点讲：

- 这是一个中文版 AI 简历优化 MVP
- 核心是个人资料库，不是让 AI 直接编造简历
- AI 只能基于真实经历生成和优化
- 支持 JD 分析、经历匹配、简历生成、预览编辑和导出
- PDF 导入和中文 PDF 导出都做过专项处理
