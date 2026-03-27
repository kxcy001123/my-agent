## Context

当前项目中，飞书消息处理器 [`feishu.service.ts`](src/feishu/feishu.service.ts) 已经能够获取到发送者的 `senderId`，但这个信息没有传递给 AI 服务，导致：
1. AI 无法知道是谁在发送消息
2. 创建定时任务时无法关联到具体人员
3. 任务执行时无法@相关人员

项目使用 LangChain 进行 AI 对话，通过 Tool 模式支持创建定时任务。需要在现有架构基础上，建立完整的 senderId 传递链路。

## Goals / Non-Goals

**Goals:**
- 建立从飞书消息处理器到 AI 服务的 senderId 传递链路
- 定时任务支持关联人员（assigneeId）
- 任务执行时在消息中自动添加 `<at user_id="assigneeId"></at>` 标签
- AI 在上下文中知道 senderId，可以在回复中@人

**Non-Goals:**
- 不需要持久化 assigneeId 到数据库（仅内存存储）
- 不需要支持多人员关联（仅关联发送者）
- 不需要修改飞书 SDK 的使用方式

## Decisions

### 1. senderId 传递方式

**决策**: 通过方法参数逐层传递

**方案**:
```
FeishuService.handleMessageEvent() 
  → FeishuService.processMessageAsync(senderId)
  → EventHandlerService.handleEvent(senderId)
  → EventHandlerService.handleWithAI(text, chatId, senderId)
  → AiService.runChain(query, chatId, senderId)
```

**理由**: 
- 保持现有架构不变
- 类型安全，易于维护
- 避免使用全局状态或上下文对象

### 2. AI 上下文中的 senderId

**决策**: 在 system message 中动态注入 senderId

**方案**: 在 [`ai.service.ts`](src/ai/ai.service.ts) 的 `runChain` 方法中，构建 system message 时添加：
```
当前消息发送者的 ID 是：{senderId}
当创建定时任务时，如果需要关联人员，请使用这个 ID 作为 assigneeId
当回复消息时，如果需要@人，请在消息中添加 <at user_id="{senderId}"></at>
```

**理由**:
- 让 AI 自然语言理解发送者信息
- AI 可以自主决定何时关联人员
- 符合 LangChain 的 prompt 工程最佳实践

### 3. assigneeId 数据存储

**决策**: 在现有的 ScheduledTask 接口中添加可选字段

**方案**:
```typescript
interface ScheduledTask {
  // ... 现有字段
  assigneeId?: string;  // 新增：关联人员 ID
}
```

**理由**:
- 向后兼容，不影响现有任务
- 简单直接，无需额外的关联表

### 4. @人消息格式

**决策**: 使用飞书官方的 `<at user_id="xxx"></at>` 标签格式

**方案**: 在 [`feishu.service.ts`](src/feishu/feishu.service.ts) 的 `sendTextMessage` 方法中：
```typescript
// 如果有 assigneeId，在消息开头添加@标签
const mentionTag = assigneeId ? `<at user_id="${assigneeId}"></at>\n` : '';
const finalContent = mentionTag + content;
```

**理由**:
- 飞书官方支持的格式
- 简单可靠，无需调用额外 API

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| senderId 传递链路断裂 | 在每个方法调用处添加类型检查和日志 |
| AI 可能忽略 senderId | 在 prompt 中强调重要性，并提供示例 |
| 现有任务不受影响 | assigneeId 设为可选字段，默认为 undefined |
| 飞书消息格式变化 | 使用飞书官方文档确认标签格式 |

## Migration Plan

1. **第一步**: 修改接口定义（`scheduled-task.interface.ts`）
2. **第二步**: 修改 Tool 定义（`create-scheduled-task.tool.ts`）
3. **第三步**: 修改服务层传递链路（`feishu.service.ts` → `event-handler.service.ts` → `ai.service.ts`）
4. **第四步**: 修改消息发送逻辑（`scheduled-task.service.ts` 和 `feishu.service.ts`）
5. **第五步**: 测试验证

无需停机，可热更新部署。

## Open Questions

无
