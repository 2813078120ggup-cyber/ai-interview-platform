# 讯飞 Web SDK 虚拟人接入

日期：2026-07-26  
分支：`test`

## 变更内容

- 将面试间的讯飞虚拟人实现切换为官方 Web SDK（ESM）直连模式。
- 后端新增 `GET /v1/virtual-human/sdk-config`，仅下发签名 URL、AppID、接口服务 ID、形象 ID 与发音人；不向浏览器暴露 API Secret。
- 前端通过 XRTC 启动官方播放器，虚拟人画面与播报由 SDK 管理。
- 在用户点击“启动虚拟人”后才创建会话；离开面试间、结束面试或卸载页面时调用 SDK `stop/destroy`，减少授权路数残留。
- 语音回答优先使用 SDK Recorder 与讯飞 ASR；不支持时回退浏览器语音识别。
- 主面试追问在虚拟人已启动时由讯飞 SDK 的 NLP 交互处理；选择题仍保持不追问、提交后进入下一题。
- 保留浏览器语音朗读作为虚拟人不可用时的降级能力，并加入浏览器自动播放恢复按钮。

## 配置前提

系统设置中的讯飞 Provider 必须属于同一个接口服务，且已填写并启用：

1. Base URL
2. 接口服务 ID（sceneId）
3. App ID
4. API Key 与 API Secret
5. 虚拟人形象 ID
6. 发音人 / 音色（VCN）

## 验证结果

- `frontend-react`: `npm run build` 通过。
- `backend`: `mvn -q -DskipTests package` 通过。

## 运行验证建议

1. 以 HTTPS（或 localhost）进入候选人面试间。
2. 点击“启动虚拟人”，首次播放若被浏览器拦截，点击“恢复声音”。
3. 确认右侧显示讯飞播放器画面，再发送一条文字回答。
4. 点击麦克风，确认转写结果进入回答框。
5. 结束面试或离开页面后，在讯飞交互日志中确认会话已终止。
