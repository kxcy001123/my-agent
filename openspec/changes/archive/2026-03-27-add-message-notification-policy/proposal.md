## Why

当前智能助手在每次操作后都会发送消息到群里，包括：
- 创建任务后发送确认消息
- 识别风险后发送预警消息
- 任务状态变更后发送通知

这种"每次都回复"的行为会导致群消息冗余，干扰用户正常工作。用户希望助手能够"默默观察"，只在关键时机主动发送消息，而不是每次操作都通知。

## What Changes

- **消息通知策略配置**：提供可配置的消息发送策略，控制每种场景是否发送消息
- **场景分类**：将消息发送场景分为以下类别，每类可独立配置
  - `task_created` - 任务创建确认
  - `task_executed` - 任务执行结果
  - `risk_detected` - 风险识别预警
  - `progress_update` - 进度状态变更
  - `user_query` - 用户主动查询回复
- **默认策略**：默认只开启 `task_executed` 和 `risk_detected`，其他场景静默处理

## Capabilities

### New Capabilities

- `message-notification-policy`: 消息通知策略配置能力，支持按场景控制消息发送行为

### Modified Capabilities

- `event-handler`: 事件处理器需要根据策略决定是否发送消息
- `ai-service`: AI 服务需要支持静默模式，不返回确认消息
- `scheduled-task`: 定时任务服务需要根据策略决定是否发送执行结果

## Impact

- `src/common/notification-policy.config.ts`: 新增消息通知策略配置
- `src/event-handler/event-handler.service.ts`: 根据策略过滤消息发送
- `src/ai/ai.service.ts`: 支持静默响应模式
- `src/scheduled-task/scheduled-task.service.ts`: 根据策略决定是否发送执行结果
- `.env`: 新增环境变量配置项
