# 2026-07-25 全局鼠标跟随交互

## 问题

登录页已有较有质感的鼠标跟随光圈，但进入管理端或候选人端后该交互消失，整体体验不够统一。

## 为什么是问题

当前项目已经形成 Modern AI SaaS 的视觉方向，如果只在登录页存在鼠标反馈，进入主系统后体验会断层。全局保留轻量交互能增强产品一致性，但也需要避免遮挡操作和过度抢眼。

## 如何修改

1. 新增全局鼠标跟随组件
   - `frontend-react/src/components/global-mouse-follower.tsx`
   - 使用 `framer-motion` 的 motion value 和 spring 实现柔和跟随。
   - 仅桌面鼠标设备显示，尊重 `prefers-reduced-motion`。
   - `pointer-events: none`，不会阻挡页面点击。

2. App 根部全局挂载
   - 所有登录页、候选人端、管理员端页面都保留统一交互。

3. 登录页去重
   - 移除登录页内部原有固定鼠标圆点，避免全局组件和登录页组件叠加。
   - 登录页仍保留背景光晕和卡片倾斜动画。

4. 交互细节
   - 略微缩小鼠标周围光圈尺寸。
   - 点击时光圈短暂缩小、小圆点放大，形成轻微按压反馈。

## 修改文件

- `frontend-react/src/components/global-mouse-follower.tsx`
- `frontend-react/src/App.tsx`
- `frontend-react/src/pages/login.tsx`
- `frontend-react/src/styles.css`

## 验证

已执行：

```bash
npm run build
```

结果：构建通过。Vite 仍提示主 chunk 超过 500KB，这是既有拆包优化项，不影响本次交互优化。
