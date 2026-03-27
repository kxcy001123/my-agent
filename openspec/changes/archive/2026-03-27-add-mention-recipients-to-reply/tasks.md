## 1. 类型定义

- [x] 1.1 修改 `EventHandler` 类型定义，添加 `mentionIds?: string[]` 字段
- [x] 1.2 确保 `FeishuService.processMessageAsync` 方法签名支持 `mentionIds` 参数

## 2. mentionIds 传递链路

- [x] 2.1 修改 `FeishuService.handleMessageEvent` 方法，提取 mentionIds 并传递给 `processMessageAsync`
- [x] 2.2 修改 `FeishuService.processMessageAsync` 方法，接收 mentionIds 并传递给事件处理器
- [x] 2.3 修改 `EventHandlerService.handleEvent` 方法，接收并传递 mentionIds 给 AI 服务
- [x] 2.4 修改 `AiService.runChain` 方法签名，添加 `mentionIds` 参数
- [x] 2.5 在 `AiService.runChain` 的 human message 中注入 mentionIds 信息

## 3. @多人消息发送

- [x] 3.1 修改 `FeishuService.sendTextMessage` 方法，支持 `assigneeIds?: string[]` 参数
- [x] 3.2 在 `sendTextMessage` 中实现多个 `<at user_id="${id}"></at>` 标签拼接逻辑
- [x] 3.3 更新 `ScheduledTaskService.notifyExecutionResult` 调用 `sendTextMessage` 时的参数

