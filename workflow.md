# Git 与 GitHub 协作保姆级指南

本文面向 `Library-Management-System` 项目组成员，目标是解决以下问题：

- 哪些文件应该上传到 GitHub，哪些不应该上传
- 第一次把本地当前进度合并到远程仓库时，应该怎么做
- 以后每位组员如何通过 Git 协作开发，避免互相覆盖代码

本文默认：

- 你们的远程仓库已经存在
- 本地项目目录已经是一个 Git 仓库
- 远程仓库地址是：

```text
https://github.com/Whaleril/library-management-system.git
```

---

## 1. 应该上传哪些文件

应该上传的内容：

- `backend/` 里的源代码
- `frontend/` 里的源代码
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.js`
- `package.json`
- `package-lock.json`
- 项目说明文档，例如：
  - `readme.md`
  - `database.md`
  - `接口设计.md`
  - `Product Backlog(Reader).md`
  - 本文 `workflow.md`

简单理解：

- “代码、配置、设计文档” 应该上传
- “依赖安装结果、环境变量、本地数据库、编辑器缓存” 不应该上传

---

## 2. 不应该上传哪些文件

不应该上传的内容：

- `node_modules/`
- `.env`
- `generated/prisma/`
- `dist/`
- `backend/dev.db`
- `.codex/`
- `.cursor/`
- 各种日志、临时文件、编辑器缓存文件

原因：

- `node_modules/` 体积很大，而且别人可以重新安装
- `.env` 可能包含敏感信息
- `generated/prisma/` 是自动生成文件，可以重新生成
- `backend/dev.db` 是你本地数据库快照，不适合作为协作源文件
- `.codex/`、`.cursor/` 是本地开发辅助目录，不是项目业务代码

特别注意：

- 你们项目当前仓库根目录还没有统一的根级 `.gitignore`
- 所以在提交前，一定要先看 `git status`
- 如果看到 `backend/dev.db`、`.codex/`、`.cursor/` 出现在待提交列表里，不要把它们加进去

---

## 3. Git 的核心概念，先用大白话理解

### 3.1 工作区

就是你现在电脑里正在修改的文件。

### 3.2 暂存区

就是“准备提交”的文件清单。

执行下面命令时，就是把文件放进暂存区：

```powershell
git add 文件名
```

### 3.3 提交 commit

就是给这一次改动拍一张快照，并写一句说明。

```powershell
git commit -m "说明你做了什么"
```

### 3.4 远程仓库 origin

就是 GitHub 上的仓库。

### 3.5 push

把本地提交上传到 GitHub。

```powershell
git push
```

### 3.6 pull

把 GitHub 上别人提交的最新内容拉到本地。

```powershell
git pull
```

### 3.7 branch 分支

每个人在自己的分支上开发，做完后再合并到主分支，这样最安全。

---

## 4. 你当前这次本地进度，如何正确上传到 GitHub

你一周前已经往 GitHub 上传过项目脚手架，所以现在不是“新建仓库”，而是“把本地新进度更新到已有仓库”。

只要你本地仓库和 GitHub 仓库本来就是同一个项目，那么：

- 远程仓库中的原文件可以被正确更新
- 新增文件会被新增
- 被修改的文件会被替换为新版本
- 没被改动的文件不会受影响

前提是：

- 你先拉取远程最新代码
- 再提交自己的修改
- 最后再推送

---

## 5. 你现在应该怎么做

以下命令请在项目根目录执行：

```powershell
cd D:\杂物\资料\大三下\SPM\library-management-system1
```

### 第一步：查看当前状态

```powershell
git status
```

作用：

- 看哪些文件被修改了
- 看哪些文件是新文件
- 看哪些文件不该提交

### 第二步：先拉取远程最新内容

```powershell
git pull origin main
```

如果你们仓库默认分支不是 `main`，可能是 `master`，则改为：

```powershell
git pull origin master
```

作用：

- 避免你本地提交时落后于远程仓库
- 减少后面冲突

如果这里出现冲突，不要慌，先停下来，再处理冲突。

### 第三步：只添加应该上传的文件

建议不要一上来用 `git add .`

因为你们当前仓库里可能会把这些不该上传的东西也一起加进去：

- `backend/dev.db`
- `.codex/`
- `.cursor/`

推荐手动添加真正该提交的内容，例如：

```powershell
git add backend
git add frontend
git add readme.md
git add database.md
git add "接口设计.md"
git add "Product Backlog(Reader).md"
git add workflow.md
```

如果你不想提交 `frontend`，就不要加那一行。

### 第四步：再次确认暂存区内容

```powershell
git status
```

重点检查：

- 是否误加入了 `backend/dev.db`
- 是否误加入了 `.codex/`
- 是否误加入了 `.cursor/`

如果误加了，撤销暂存：

```powershell
git restore --staged backend/dev.db
git restore --staged .codex
git restore --staged .cursor
```

### 第五步：提交

```powershell
git commit -m "feat: update backend reader module and docs"
```

作用：

- 记录这次修改
- 形成一条清晰历史

### 第六步：推送到 GitHub

如果你当前就在主分支：

```powershell
git push origin main
```

如果默认分支是 `master`：

```powershell
git push origin master
```

---

## 6. 如何判断你现在在 main 还是 master

执行：

```powershell
git branch
```

带 `*` 的就是你当前所在分支。

例如：

```text
* main
```

说明你当前在 `main`。

---

## 7. 更安全的推荐做法：用分支开发，再合并

强烈建议以后不要大家都直接往 `main` 上改。

推荐流程：

1. 先从主分支拉最新代码
2. 新建自己的功能分支
3. 在自己分支开发
4. 提交并推送自己的分支
5. 在 GitHub 发起 Pull Request
6. 审查后合并到 `main`

---

## 8. 你自己以后开发的标准流程

### 8.1 先切到主分支

```powershell
git checkout main
```

### 8.2 拉最新代码

```powershell
git pull origin main
```

### 8.3 新建并切换到自己的功能分支

分支名建议清晰一些，例如：

- `feature/reader-backend`
- `feature/wishlist`
- `feature/login-page`

命令：

```powershell
git checkout -b feature/reader-backend
```

### 8.4 开发完成后查看状态

```powershell
git status
```

### 8.5 添加需要提交的文件

```powershell
git add backend
git add database.md
git add "接口设计.md"
```

### 8.6 提交

```powershell
git commit -m "feat: implement reader backend release1"
```

### 8.7 推送自己的分支到 GitHub

第一次推送这个分支时：

```powershell
git push -u origin feature/reader-backend
```

以后继续推这个分支时：

```powershell
git push
```

---

## 9. 你的组员应该怎么做

每个组员都应该遵守下面这套流程：

### 9.1 第一次把仓库拉到本地

```powershell
git clone https://github.com/Whaleril/library-management-system.git
```

然后进入目录：

```powershell
cd library-management-system
```

### 9.2 每次开始开发前

```powershell
git checkout main
git pull origin main
git checkout -b feature/自己的功能名
```

例如：

```powershell
git checkout -b feature/reader-profile
```

### 9.3 开发完成后

```powershell
git status
git add 相关文件
git commit -m "feat: 完成某某功能"
git push -u origin feature/reader-profile
```

### 9.4 去 GitHub 发起 Pull Request

组员推送后，在 GitHub 网页上：

1. 打开仓库
2. 点击自己分支对应的 `Compare & pull request`
3. 目标分支选 `main`
4. 填写说明
5. 提交 Pull Request

### 9.5 合并前，先确认这些事

- 没有把 `node_modules` 传上去
- 没有把 `.env` 传上去
- 没有把 `backend/dev.db` 传上去
- 没有把 `.codex`、`.cursor` 传上去
- 提交信息清楚
- 改动范围只覆盖自己的功能

---

## 10. 如果两个人改了同一个文件，会发生什么

这时可能出现冲突 conflict。

常见场景：

- 你改了 `接口设计.md`
- 组员也改了 `接口设计.md`
- 你先 pull 远程代码时，Git 发现同一位置双方都改过

这时 Git 不会随便覆盖，而是要求你手动决定保留哪部分内容。

---

## 11. 遇到冲突时怎么处理

假设你在 `git pull` 时发生冲突。

### 11.1 先查看状态

```powershell
git status
```

Git 会告诉你哪些文件冲突了。

### 11.2 打开冲突文件

你会看到类似：

```text
<<<<<<< HEAD
这是你本地的内容
=======
这是远程的内容
>>>>>>> origin/main
```

处理方法：

- 删除这些标记
- 手动保留正确内容
- 保存文件

### 11.3 冲突解决后重新添加

```powershell
git add 冲突文件名
```

### 11.4 完成合并提交

如果是 `pull` 产生的冲突，解决完后执行：

```powershell
git commit -m "fix: resolve merge conflicts"
```

然后再：

```powershell
git push
```

---

## 12. 常用命令速查表

查看状态：

```powershell
git status
```

查看当前分支：

```powershell
git branch
```

切换到主分支：

```powershell
git checkout main
```

拉取主分支最新代码：

```powershell
git pull origin main
```

新建并切换分支：

```powershell
git checkout -b feature/xxx
```

添加文件到暂存区：

```powershell
git add 文件名
```

提交：

```powershell
git commit -m "提交说明"
```

推送当前分支：

```powershell
git push
```

第一次推送新分支：

```powershell
git push -u origin 分支名
```

撤销暂存：

```powershell
git restore --staged 文件名
```

查看远程仓库地址：

```powershell
git remote -v
```

---

## 13. 对你这 4 个问题的直接回答

### 问题 1：哪些文件该上传，哪些不该上传？

该上传：

- 源代码
- 文档
- `schema.prisma`
- `seed.js`
- `package.json`
- `package-lock.json`

不该上传：

- `node_modules`
- `.env`
- `generated/prisma`
- `backend/dev.db`
- `.codex`
- `.cursor`

### 问题 2：每一步如何操作，作用是什么？

核心流程就是：

1. `git status`
2. `git pull`
3. `git add`
4. `git commit`
5. `git push`

作用分别是：

1. 看状态
2. 先同步远程
3. 选择要提交的文件
4. 生成一次历史记录
5. 上传到 GitHub

### 问题 3：一周前上传了脚手架，现在 merge 当前进度，原文件能否被正确更新？

可以。

只要：

- 你的本地仓库和远程仓库对应的是同一个项目
- 你先拉取远程最新代码
- 再提交自己的修改

那么 Git 会正确地：

- 更新被改动的文件
- 增加新增文件
- 保留未改动文件

如果同一文件同一位置被两边同时修改，才需要手动解决冲突。

### 问题 4：组员们也要通过 Git 开发，他们应该怎么做？

正确做法是：

- 每人从 `main` 拉最新代码
- 每人新建自己的功能分支
- 在自己的分支开发
- 推送自己的分支
- 在 GitHub 发 Pull Request
- 合并到 `main`

不要所有人都直接在 `main` 上开发。

---

## 14. 给组员的最简版口令

如果你要把最短版本直接发给组员，可以发这段：

```text
1. 先 git checkout main
2. 再 git pull origin main
3. 新建自己的分支：git checkout -b feature/你的功能名
4. 开发完成后 git status
5. 只 add 该提交的文件，不要 add node_modules、.env、backend/dev.db、.codex、.cursor
6. git commit -m "feat: 说明你做了什么"
7. git push -u origin 你的分支名
8. 去 GitHub 发 Pull Request，合并到 main
```

---

## 15. 最后的建议

- 提交前一定先看 `git status`
- 不会的时候不要直接 `git add .`
- 不要把本地数据库和环境变量传上去
- 每个人都走“分支开发 + Pull Request”流程
- 一个功能尽量一个分支，一次提交信息写清楚

如果后续需要，可以再补一份：

- `.gitignore` 推荐模板
- “冲突处理示例图文版”
- “GitHub Pull Request 提交流程图”
