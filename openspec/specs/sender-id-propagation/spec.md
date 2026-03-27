# sender-id-propagation Specification

## Purpose
TBD - created by archiving change add-sender-mention-to-scheduled-task. Update Purpose after archive.
## Requirements
### Requirement: senderId 从飞书消息处理器传递到 AI 服务
系统 SHALL 支持将飞书消息发送者的 ID 从消息处理器逐层传递到 AI 服务，确保 AI 上下文中有发送者信息。

#### Scenario: 收到飞书消息时提取 senderId
- **WHEN** 飞书消息处理器收到 `im.message.receive_v1` 事件
- **THEN** 系统从 `event.event.sender.sender_id.open_id` 中提取 senderId

#### Scenario: senderId 传递给事件处理器
- **WHEN** FeishuService 处理消息事件
- **THEN** 调用 `eventHandler({ type, chatId, text, docUrl, senderId })` 传递 senderId

#### Scenario: senderId 传递给 AI 服务
- **WHEN** EventHandlerService 处理需要 AI 响应的消息
- **THEN** 调用 `aiService.runChain(text, chatId, senderId)` 传递 senderId

### Requirement: AI 在 system message 中接收 senderId
系统 SHALL 在 AI 的 system message 中包含 senderId，让大模型知道当前消息的发送者。

#### Scenario: AI 收到包含 senderId 的 prompt
- **WHEN** AiService.runChain 被调用时传入了 senderId
- **THEN** system message 中包含"当前消息发送者的 ID 是：{senderId}"的信息

#### Scenario: AI 在创建任务时使用 senderId
- **WHEN** 用户创建定时任务且需要关联人员
- **THEN** AI 调用 create_scheduled_task tool 时传入 assigneeId 参数为 senderId

