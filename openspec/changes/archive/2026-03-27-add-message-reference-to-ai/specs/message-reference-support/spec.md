## ADDED Requirements

### Requirement: 消息引用关系传递给 AI
飞书群聊消息处理时 SHALL 将消息的引用关系信息（message_id, parent_id, root_id）传递给 AI 服务，使 AI 能够理解消息之间的引用上下文。

#### Scenario: 提取消息引用字段
- **WHEN** 飞书消息事件包含 `message_id`, `parent_id`, `root_id` 字段
- **THEN** 系统 SHALL 提取这些字段并传递给后续处理流程

#### Scenario: 引用消息 ID 传递给 AI
- **WHEN** 用户在群聊中发送一条引用消息
- **THEN** AI 收到的请求 SHALL 包含 `[父消息ID: om_xxx]` 元数据

#### Scenario: 当前消息 ID 传递给 AI
- **WHEN** 用户在群聊中发送消息
- **THEN** AI 收到的请求 SHALL 包含 `[当前消息ID: om_xxx]` 元数据

#### Scenario: 根消息 ID 传递给 AI
- **WHEN** 用户在群聊中发送消息（无论是直接发送还是回复）
- **THEN** AI 收到的请求 SHALL 包含 `[根消息ID: om_xxx]` 元数据，用于识别话题链

#### Scenario: 无引用关系时传递空值
- **WHEN** 消息没有 parent_id（首条消息或独立消息）
- **THEN** 系统 SHALL 传递空字符串或不传递该字段