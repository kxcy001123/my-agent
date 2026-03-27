## Why

当前机器人对所有消息都会回复并发送到群里，导致群里消息过多。需要实现智能过滤：
1. 如果用户@了本机器人，必须回复
2. 如果是风险识别场景，发送到群里
3. 其他不相干的大模型回复不要发送到群里

另外，当前代码存在 bug：使用 `text.includes('@')` 判断是否被@，但 text 已经被移除了@标签，导致判断永远为 false。

## What Changes

1. **修复@机器人判断 bug**：使用 `mentionIds` 数组判断是否@了本机器人，而不是依赖 text 中的@
2. **获取机器人自己的 open_id**：通过飞书 API 获取机器人 ID，用于精确匹配
3. **实现消息过滤逻辑**：在 EventHandlerService 中根据场景判断是否发送消息
4. **风险场景识别**：让 AI 返回场景标签或在工具调用时记录场景类型

## Capabilities

### New Capabilities
- `message-filtering`: 消息过滤能力，根据是否@机器人和场景类型决定是否发送回复到群里
- `bot-mention-detection`: 机器人@识别能力，精确判断消息是否@了本机器人

### Modified Capabilities
- 无

## Impact

- **修改文件**：
  - `src/feishu/feishu.service.ts` - 修复@判断 bug，添加获取机器人 ID 方法
  - `src/event-handler/event-handler.service.ts` - 添加消息过滤逻辑
  - `src/ai/ai.service.ts` - 可能需要添加场景标签返回
- **依赖**：飞书 contact.users.me API 获取机器人信息