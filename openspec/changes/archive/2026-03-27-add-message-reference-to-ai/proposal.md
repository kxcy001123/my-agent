## Why

当前群聊消息处理中，AI 无法理解消息之间的引用关系。飞书消息包含 `parent_id`（回复的消息）和 `root_id`（话题起始），但这些信息没有被传递给 AI，导致 AI 无法理解对话上下文和引用链。

## What Changes

- 在 [`src/feishu/feishu.service.ts`](src/feishu/feishu.service.ts) 中提取 `message_id`、`parent_id`、`root_id` 字段
- 扩展 `EventHandler` 类型定义，添加新字段
- 在 [`src/event-handler/event-handler.service.ts`](src/event-handler/event-handler.service.ts) 中传递新字段到 AI 处理
- 在 [`src/ai/ai.service.ts`](src/ai/ai.service.ts) 的 prompt 中包含消息引用关系信息

## Capabilities

### New Capabilities
- `message-reference-support`: 支持将消息的 parent_id、message_id、root_id 传递给 AI，让 AI 理解群聊中的引用关系

### Modified Capabilities
- (无)

## Impact

- 修改文件：`src/feishu/feishu.service.ts`、`src/event-handler/event-handler.service.ts`、`src/ai/ai.service.ts`
- 无新增依赖
- AI 模型收到的消息将包含消息引用元数据