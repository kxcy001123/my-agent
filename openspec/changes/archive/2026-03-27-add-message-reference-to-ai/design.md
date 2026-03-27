## Context

当前飞书群聊消息处理流程：
1. `FeishuService` 接收飞书长连接事件 (`im.message.receive_v1`)
2. 解析消息内容，提取 `chat_id`, `text`, `sender_id`, `mentions` 等
3. 通过 `EventHandler` 传递给业务处理
4. `AiService` 使用 LangChain 处理对话，当前按 `chatId` 区分会话

飞书消息事件已包含 `message_id`, `parent_id`, `root_id`，但未被提取和使用。

## Goals / Non-Goals

**Goals:**
- 提取消息的 `message_id`, `parent_id`, `root_id` 字段
- 将这些字段传递给 AI，让 AI 理解消息的引用关系
- 不需要获取被引用消息的详细内容（用户要求只传递 ID）

**Non-Goals:**
- 不构建完整的对话树结构
- 不持久化消息引用关系（保持内存存储）
- 不修改现有的 chatId 会话历史机制

## Decisions

### 1. 消息引用字段提取
在 `FeishuService.handleMessageEvent()` 中提取：
- `message.message_id` - 当前消息ID
- `message.parent_id` - 父消息ID（回复的消息）
- `message.root_id` - 根消息ID（话题起始）

### 2. 事件类型扩展
扩展 `EventHandler` 类型定义，添加可选字段：
- `messageId?: string`
- `parentId?: string`
- `rootId?: string`

### 3. AI Prompt 增强
在 `AiService.runChain()` 的用户消息中添加元数据：
```
[当前消息ID: om_xxx]
[父消息ID: om_xxx]
[根消息ID: om_xxx]
```

## Risks / Trade-offs

- [低风险] 消息ID作为字符串传递，不影响现有功能
- [低风险] 现有内存存储机制不变，重启后历史丢失
- [无] 无需外部依赖新增