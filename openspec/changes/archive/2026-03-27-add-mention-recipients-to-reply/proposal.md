## Why

当前在创建定时任务时，无法关联到消息中被 mention 的相关人员，导致任务执行时无法@到这些人。在群聊场景中，当用户消息中 mention 了某个人并创建任务时，任务执行结果应该通知到被 mention 的人。

## What Changes

- **mentionIds 传递链路**：从飞书消息处理器到 AI 服务的完整 mentionIds 传递链路
- **定时任务关联人员**：AI 在创建定时任务时，可以将 mentionIds 中的人员 ID 作为 `assigneeId` 参数传递给任务
- **任务执行@人**：任务执行时，使用 `assigneeId` 在消息中自动添加 `<at user_id="assigneeId"></at>` 标签

## Capabilities

### New Capabilities

- `mention-recipients-reply`: 在创建定时任务时关联 mention 人员的能力

### Modified Capabilities

- `sender-id-propagation`: 扩展为同时传递 senderId 和 mentionIds
- `scheduled-task-creation`: 定时任务创建能力需要支持 assigneeId 参数

## Impact

- `src/feishu/feishu.service.ts`: 需要传递 mentionIds 给事件处理器
- `src/event-handler/event-handler.service.ts`: 需要接收并传递 mentionIds
- `src/ai/ai.service.ts`: 需要在 human message 中包含 mentionIds 列表，让 AI 在创建任务时使用 assigneeId
- `src/scheduled-task/tools/create-scheduled-task.tool.ts`: tool 描述中说明 assigneeId 的用途
