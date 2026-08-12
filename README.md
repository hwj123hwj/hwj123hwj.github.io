# Hwj AI Infrastructure

> 🌐 **线上访问：<https://hwj123hwj.github.io/>**
>
> 由 GitHub Pages 托管，`main` 分支推送后自动部署。

`hwj123hwj.github.io` 是跨项目基础设施的公开状态页，展示公开仓库、当前主目标和经过脱敏的发布进度。

## 数据边界

- 私有控制仓库维护完整目标、决策、证据和发布门禁。
- 本仓库只接收生成后的 `data/status.json`，不读取私有仓库 API。
- 私有项目使用公开别名，不展示仓库 URL、内部端点、提交 SHA、日志或凭证。

## 本地预览

```bash
python3 -m http.server 4173
```

打开 <http://127.0.0.1:4173/>。

## 验证

```bash
node scripts/validate.mjs
```

状态页由 GitHub Pages 直接托管静态文件，不需要构建步骤。
