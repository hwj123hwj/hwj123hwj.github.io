# Hwj AI Infrastructure

> 🌐 **线上访问：<https://hwj123hwj.github.io/>**
>
> 由 GitHub Pages 托管，`main` 分支推送后自动部署。

`hwj123hwj.github.io` 是个人项目展示入口，同时保留跨项目基础设施的公开状态页：展示代表作、个人贡献、分类目录和经过脱敏的发布进度。

## 数据边界

- 私有控制仓库维护完整目标、决策、证据和发布门禁。
- 本仓库只接收生成后的 `data/status.json`，不读取私有仓库 API。
- 私有项目使用公开别名，不展示仓库 URL、内部端点、提交 SHA、日志或凭证。

## 自动同步与验证

页面支持 GitHub Actions 每日定时与手动触发自动同步公共活动：

- **自动同步脚本**：
  ```bash
  node scripts/sync.mjs
  ```
  自动从 GitHub API 拉取最新的仓库活跃时间、Stars、语言标签，并在日志中提示新发现的公开仓库；不会自动收录到展示目录。

- **安全与合规门禁**：
  ```bash
  node scripts/validate.mjs
  ```
  校验数据结构合法性与私有链接防泄露。

- **GitHub Actions 工作流**：
  - `.github/workflows/sync.yml`：每日定时拉取更新并自动提交
  - `.github/workflows/validate.yml`：PR & Push 自动校验门禁

## 本地预览

```bash
python3 -m http.server 4173
```

打开 <http://127.0.0.1:4173/>。

## 展示内容维护

- `data/status.json`：公开状态与已收录项目。自动同步只更新现有项目的 GitHub 元数据和 PR 状态，不把同步日期当成功能验证日期。
- `data/portfolio.json`：人工维护代表作顺序、分类、问题场景、个人贡献和证据入口。`kind` 支持 `tool`、`learning`、`fork`、`other`；未分类项目显示为其他探索。
- 新仓库先确认定位，再加入 `status.json` 和可选的 `portfolio.json`；同步不会覆盖人工写的贡献说明。
- 代表作链接必须指向可访问的源码或实际部署页面。Go 交互页通过独立项目的 GitHub Pages 部署，主页代表作直接链接到在线实验室。

交互：目录可按类型筛选并搜索，发布记录显示合并状态，阶段从状态数据读取。展示元数据加载失败时，目录和状态仍可用。
