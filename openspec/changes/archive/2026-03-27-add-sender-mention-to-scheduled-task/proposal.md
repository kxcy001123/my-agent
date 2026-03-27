## Why

当前创建定时任务或延时任务时，无法关联到触发任务的用户，导致任务执行时无法@相关人员。用户需要在任务执行时收到通知，特别是在项目管理场景中，任务执行结果需要通知到具体的负责人。

## What Changes

- **senderId 传递链路**：从飞书消息处理器到 AI 服务的完整 senderId 传递链路
- **assigneeId 字段**：定时任务接口新增 `assigneeId` 字段，用于关联人员
- **@人功能**：任务执行时在消息中自动添加 `<at user_id="assigneeId"></at>` 标签
- **AI 上下文增强**：在 AI 的 system message 中提供 senderId，让大模型知道当前发送者

## Capabilities

### New Capabilities

- `sender-id-propagation`: senderId 从飞书消息到 AI 服务的传递能力
- `task-assignee-association`: 定时任务关联人员的能力，支持在创建任务时指定 assigneeId
- `feishu-at-mention`: 在飞书消息中使用@标签的能力

### Modified Capabilities

- `scheduled-task-creation`: 定时任务创建能力需要支持 assigneeId 参数

## Impact

- `src/feishu/feishu.service.ts`: 需要传递 senderId 给事件处理器
- `src/event-handler/event-handler.service.ts`: 需要接收并传递 senderId
- `src/ai/ai.service.ts`: 需要在 system message 中包含 senderId
- `src/scheduled-task/interfaces/scheduled-task.interface.ts`: 新增 assigneeId 字段
- `src/scheduled-task/tools/create-scheduled-task.tool.ts`: 新增 assigneeId 参数
- `src/scheduled-task/scheduled-task.service.ts`: 任务执行时使用 assigneeId 来@人
