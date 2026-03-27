# feishu-at-mention Specification

## Purpose
TBD - created by archiving change add-sender-mention-to-scheduled-task. Update Purpose after archive.
## Requirements
### Requirement: 飞书消息支持@人功能
系统 SHALL 支持在发送飞书消息时添加 `<at user_id="xxx"></at>` 标签来@指定人员。

#### Scenario: 任务执行时@关联人员
- **WHEN** 定时任务执行完成且任务包含 `assigneeId`
- **THEN** 发送通知消息时在消息开头添加 `<at user_id="${assigneeId}"></at>` 标签

#### Scenario: AI 回复消息时@发送者
- **WHEN** AI 回复消息且需要@发送者
- **THEN** 在消息内容中包含 `<at user_id="${senderId}"></at>` 标签

### Requirement: 飞书服务发送带@标签的消息
系统 SHALL 在 `sendTextMessage` 方法中支持传入 assigneeId 参数。

#### Scenario: 发送消息时添加@标签
- **WHEN** 调用 `feishuService.sendTextMessage(chatId, content, assigneeId)` 且 assigneeId 存在
- **THEN** 实际发送的消息内容为 `<at user_id="${assigneeId}"></at>\n${content}`

#### Scenario: 发送消息时无@标签
- **WHEN** 调用 `feishuService.sendTextMessage(chatId, content)` 未传入 assigneeId
- **THEN** 实际发送的消息内容为 `content`（不添加@标签）

