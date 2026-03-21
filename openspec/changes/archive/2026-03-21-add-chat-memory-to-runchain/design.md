## Context

当前的 [`AiService`](src/ai/ai.service.ts:56) 中的 [`runChain()`](src/ai/ai.service.ts:80) 函数在每次调用时都会创建一个新的消息数组，只包含 system message 和用户的当前 query。这导致：
- AI 无法记住之前的对话内容
- 多轮对话场景下，用户需要重复提供上下文信息
- 工具调用的历史结果也无法保留

项目已存在 `chatId` 参数传入，但未实际用于消息历史的存储和检索。

## Goals / Non-Goals

**Goals:**
- 实现基于 `chatId` 的对话历史存储和加载机制
- 在 `runChain()` 函数开始时加载历史消息
- 在对话结束后保存新的消息到历史记录
- 保持与现有代码的向后兼容性（`chatId` 为可选参数）
- 定义清晰的存储接口，便于后续实现不同的存储后端

**Non-Goals:**
- 不实现具体的存储服务（由后续任务实现）
- 不修改 `runChainStream2()` 等其他链式函数
- 不改变现有的工具调用逻辑

## Decisions

### 1. 存储接口设计
**Decision:** 创建一个 `MessageHistoryService` 接口，定义 `getHistory(chatId: string)` 和 `saveHistory(chatId: string, messages: BaseMessage[])` 方法。

**Rationale:** 
- 接口与实现分离，便于后续替换不同的存储后端（内存、Redis、数据库等）
- 符合 NestJS 的依赖注入模式
- 便于单元测试

### 2. 历史消息加载时机
**Decision:** 在 `runChain()` 函数开始时，如果提供了 `chatId`，则先加载历史消息，然后将 system message 和历史消息合并到 messages 数组。

**Rationale:**
- 确保 AI 在回答时能够看到完整的对话历史
- System message 始终放在消息列表最前面

### 3. 历史消息保存时机
**Decision:** 在 `runChain()` 函数返回最终结果之前，保存完整的消息历史（包括所有工具调用和结果）。

**Rationale:**
- 确保每次对话后历史都是最新的
- 保存完整的对话上下文，包括工具调用细节

### 4. 错误处理
**Decision:** 如果存储服务抛出异常，不中断主流程，但记录错误日志。

**Rationale:**
- 存储失败不应影响 AI 的核心功能
- 保证用户体验的稳定性

## Risks / Trade-offs

**Risk:** 历史消息可能无限增长，导致 token 超限
- **Mitigation:** 后续可实现消息截断策略或滑动窗口机制

**Risk:** 存储服务的性能问题可能影响响应时间
- **Mitigation:** 使用异步存储，考虑缓存热点 chatId 的历史

**Risk:** 多用户并发访问同一 chatId 可能导致数据竞争
- **Mitigation:** 存储服务层需要处理并发控制

**Trade-off:** 当前设计每次对话都保存完整历史，可能产生冗余存储
- **Benefit:** 实现简单，历史完整性高
- **Future:** 可优化为增量存储或差分存储
