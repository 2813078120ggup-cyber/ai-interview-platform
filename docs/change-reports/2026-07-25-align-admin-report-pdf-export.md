# 2026-07-25 管理端报告 PDF 导出对齐候选人端

## 问题

管理端“查看报告”弹窗内单独维护了一套报告 DOM 和 PDF 导出结构，候选人端又维护另一套报告页结构。两端虽然都调用 `exportReportPdf`，但打印根节点、布局层级、样式细节不一致，容易出现管理端导出 PDF 排版异常。

## 为什么是问题

PDF 导出依赖浏览器打印能力和 `data-print-root` 打印根节点。一旦两端 DOM 层级不同，遮罩、弹窗容器、打印样式就可能产生差异，导致同一份报告在候选人端正常、管理端异常。

## 如何修改

1. 新增共享报告组件 `ReportDetailView`
   - 统一报告头部、综合得分、四维能力、能力分布、AI 建议区域。
   - 统一 `data-print-root` 打印根节点。
   - 统一“导出 PDF”按钮和文件名传入方式。

2. 候选人端报告页改为使用共享组件。

3. 管理端报告弹窗改为复用共享组件。
   - 管理端只保留弹窗承载层和加载态。
   - 报告正文与候选人端保持一致。

## 修改文件

- `frontend-react/src/components/report-detail-view.tsx`
- `frontend-react/src/pages/candidate-report.tsx`
- `frontend-react/src/pages/admin-interviews.tsx`

## 验证

已执行：

```bash
npm run build
```

结果：构建通过。Vite 仍提示主 chunk 超过 500KB，这是既有拆包优化项，不影响本次修复。
