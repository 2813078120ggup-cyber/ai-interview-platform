# 2026-07-25 通知中心外部点击关闭

## 问题

通知中心点开后，点击页面其它空白区域不会关闭，需要再次点击通知按钮，交互不符合常见弹层使用习惯。

## 为什么是问题

通知中心属于轻量浮层，用户通常预期点击外部区域或按 Esc 即可收起。如果不能关闭，会遮挡页面内容和操作按钮，尤其在管理端表格页面上会影响继续操作。

## 如何修改

在 `frontend-react/src/components/notification-center.tsx` 中增加：

- `rootRef` 判断点击是否发生在通知中心内部。
- `pointerdown` 监听：点击组件外部时关闭浮层。
- `keydown` 监听：按 Esc 时关闭浮层。
- 组件卸载或浮层关闭时自动移除监听，避免事件泄漏。

## 修改文件

- `frontend-react/src/components/notification-center.tsx`

## 验证

已执行：

```bash
npm run build
```

结果：构建通过。Vite 仍提示主 chunk 超过 500KB，这是既有拆包优化项，不影响本次交互修复。
