# 农行境外贵宾休息室查询

一个无后端的 Next.js 静态查询站，用于把 `W020260702557021741944.xlsx` 中的农行境外贵宾休息室数据做成手机端友好的级联筛选页面。

## 本地开发

```bash
npm install
npm run convert:data
npm run make:asset
npm run dev
```

## 更新数据

替换根目录下的 `W020260702557021741944.xlsx` 后运行：

```bash
npm run convert:data
```

生成的数据位于 `data/lounges.json`。

## 验证

```bash
npm run test
npm run build
```

## Vercel 部署

将仓库导入 Vercel，框架选择 Next.js，Build Command 使用 `npm run build`。本项目不需要后端服务或数据库。
