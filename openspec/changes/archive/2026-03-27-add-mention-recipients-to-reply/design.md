## Context

当前项目中，飞书消息处理器 [`feishu.service.ts`](src/feishu/feishu.service.ts) 已经能够获取到消息中的 mention 信息（第 92-93 行），但这些 mention 的相关人员 ID 没有被传递给 AI 服务，导致：
1. AI 无法知道消息中 mention 了哪些人
2. 回复消息时无法@到这些被 mention 的人
3. 在群聊场景中，被 mention 的人可能错过重要信息

项目需要在现有 senderId 传递链路的基础上，扩展支持 mentionIds 的传递，并在回复消息时正确@到所有相关人员。

## Goals / Non-Goals

**Goals:**
- 建立从飞书消息处理器到 AI 服务的 mentionIds 传递链路
- 在回复消息时，能够@到所有被 mention 的人
- AI 在上下文中知道 mentionIds，可以在回复中@这些人
- 保持与现有 senderId 传递链路的兼容性

**Non-Goals:**
- 不需要修改飞书 SDK 的使用方式
- 不需要支持@所有人的功能
- 不需要持久化 mentionIds 到数据库

## Decisions

### 1. mentionIds 传递方式

**决策**: 通过方法参数逐层传递，与 senderId 一起传递

**方案**:
```
FeishuService.handleMessageEvent() 
  → FeishuService.processMessageAsync(chatId, text, docUrl, senderId, mentionIds)
  → EventHandlerService.handleEvent({ type, chatId, text, docUrl, senderId, mentionIds })
  → AiService.runChain(query, chatId, senderId, mentionIds)
```

**理由**: 
- 保持现有架构不变
- 类型安全，易于维护
- 避免使用全局状态或上下文对象

### 2. AI 上下文中的 mentionIds

**决策**: 在 system message 中动态注入 mentionIds 列表

**方案**: 在 [`ai.service.ts`](src/ai/ai.service.ts) 的 `runChain` 方法中，构建 system message 时添加：
```
当前消息中 mention 的人员 ID 列表是：{mentionIds}
当回复消息时，如果需要@这些人，请在消息中添加 <at user_id="xxx"></at> 标签
```

**理由**:
- 让 AI 自然语言理解 mention 信息
- AI 可以自主决定何时@这些人
- 符合 LangChain 的 prompt 工程最佳实践

### 3. @多人消息格式

**决策**: 使用飞书官方的 `<at user_id="xxx"></at>` 标签格式，多个@标签拼接在消息开头

**方案**: 在 [`feishu.service.ts`](src/feishu/feishu.service.ts) 的 `sendTextMessage` 方法中：
```typescript
// 支持多个 assigneeIds，在消息开头添加多个@标签
const mentionTags = assigneeIds?.map(id => `<at user_id="${id}"></at>`).join('') || '';
const finalContent = mentionTags + '\n' + content;
```

**理由**:
- 飞书官方支持的格式
- 简单可靠，无需调用额外 API
- 支持@多个人

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| mentionIds 传递链路断裂 | 在每个方法调用处添加类型检查和日志 |
| AI 可能忽略 mentionIds | 在 prompt 中强调重要性，并提供示例 |
| 飞书消息格式变化 | 使用飞书官方文档确认标签格式 |
| @人过多导致消息冗长 | 在 prompt 中建议 AI 合理选择@人 |

## Migration Plan

1. **第一步**: 修改 EventHandler 类型定义，添加 mentionIds 字段
2. **第二步**: 修改 FeishuService 传递链路，传递 mentionIds
3. **第三步**: 修改 EventHandlerService 接收并传递 mentionIds
4. **第四步**: 修改 AiService.runChain 方法，接收 mentionIds 并在 prompt 中注入
5. **第五步**: 修改 FeishuService.sendTextMessage 方法，支持多个@人
6. **第六步**: 测试验证

无需停机，可热更新部署。

## Open Questions

无
