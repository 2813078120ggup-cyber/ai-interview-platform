# 登录页移除 Live 预览卡片报告

## 本次目标

根据页面截图反馈，移除登录页左侧 AI 动效区域中遮挡视觉主体的 Live 预览卡片。

## 修改内容

1. 移除左侧 AI 动效区域的 Live 预览卡片
   - 删除 “LIVE / AI 面试官 / 题目提示” 小卡片。
   - 避免该卡片遮挡 AI 轨道、图标和声波动效。

2. 调整声波位置
   - 将声波动效下移到底部，让 AI 动效区域更干净。
   - 保留原有轨道、核心呼吸、图标旋转和声波动画。

3. 清理无用代码
   - 移除不再使用的 `Timer` 图标引用。
   - 删除 Live 卡片相关 CSS。

## 涉及文件

- `frontend-react/src/pages/login.tsx`
- `frontend-react/src/styles.css`

## 验证结果

已执行：

```bash
npm run build
```

结果：构建通过。

说明：Vite 仍提示主 JS chunk 超过 500KB，这是前端整体体量导致的既有优化项，不影响本次变更。
