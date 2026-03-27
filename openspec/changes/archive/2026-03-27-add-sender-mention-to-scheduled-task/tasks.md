## 1. 接口定义

- [x] 1.1 在 `ScheduledTask` 接口中添加 `assigneeId?: string` 字段
- [x] 1.2 在 `CreateScheduledTaskInput` 接口中添加 `assigneeId?: string` 字段

## 2. Tool 定义

- [x] 2.1 在 `createScheduledTaskTool` 的 schema 中添加 `assigneeId` 参数
- [x] 2.2 在 `createScheduledTaskTool` 的执行函数中接收并传递 `assigneeId`

## 3. senderId 传递链路

- [x] 3.1 修改 `FeishuService.processMessageAsync` 方法签名，添加 `senderId` 参数
- [x] 3.2 修改 `FeishuService.handleMessageEvent` 调用 `processMessageAsync` 时传递 `senderId`
- [x] 3.3 修改 `EventHandler` 类型定义，添加 `senderId` 字段
- [x] 3.4 修改 `EventHandlerService.handleEvent` 方法，接收并传递 `senderId`
- [x] 3.5 修改 `AiService.runChain` 方法签名，添加 `senderId` 参数
- [x] 3.6 在 `AiService.runChain` 的 human message 中注入 `senderId` 信息

## 4. @人功能实现

- [x] 4.1 修改 `FeishuService.sendTextMessage` 方法，添加 `assigneeId` 可选参数
- [x] 4.2 在 `sendTextMessage` 中实现 `<at user_id="${assigneeId}"></at>` 标签拼接逻辑
- [x] 4.3 修改 `ScheduledTaskService.executeTask` 方法，传递 `assigneeId` 到消息发送
- [x] 4.4 修改 `ScheduledTaskService.notifyExecutionResult` 方法，使用 `assigneeId` 发送@消息

## 5. 验证测试

- [x] 5.1 测试创建定时任务时 assigneeId 正确传递
- [x] 5.2 测试任务执行时消息中包含@标签
- [x] 5.3 测试 AI 在对话中可以@发送者
