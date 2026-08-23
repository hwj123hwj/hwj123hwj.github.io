# Hwj AI Infrastructure

> 🌐 **线上访问：<https://hwj123hwj.github.io/>**
>
> 由 GitHub Pages 托管，`main` 分支推送后自动部署。

`hwj123hwj.github.io` 是跨项目基础设施的公开状态页，展示公开仓库、当前主目标和经过脱敏的发布进度。

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
  自动从 GitHub API 拉取最新的仓库活跃时间、Stars、语言标签，并自动发现新创建的公开仓库。

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
