## Context

当前实现使用了自定义的 `MessageHistoryService` 接口来管理对话历史，虽然功能正常，但没有充分利用 LangChain 框架提供的官方 memory 能力。LangChain 提供了完整的 memory 解决方案：

- `InMemoryChatMessageHistory`: 内存版消息历史存储
- `RunnableWithMessageHistory`: 自动处理消息历史的 Runnable 包装器
- `MessagesPlaceholder`: 在 prompt 中动态插入历史消息

这些组件经过充分测试，与 LangChain 生态深度集成，支持更灵活的扩展。

## Goals / Non-Goals

**Goals:**
- 使用 LangChain 官方的 `InMemoryChatMessageHistory` 替代自定义存储
- 使用 `RunnableWithMessageHistory` 包装 model，自动管理消息历史
- 使用 `MessagesPlaceholder` 在 system prompt 中预留历史消息位置
- 简化 `runChain()` 函数，移除手动加载/保存历史的代码
- 移除自定义的 `MessageHistoryService` 相关文件

**Non-Goals:**
- 不改变 `runChain()` 的 API 签名（保持 `chatId` 参数可选）
- 不修改 `runChainStream2()` 等其他链式函数
- 不改变现有的工具调用逻辑

## Decisions

### 1. 使用 Map 存储每个 chatId 的历史记录
**Decision:** 使用 `Map<string, InMemoryChatMessageHistory>` 来管理多个会话的历史记录，key 为 chatId。

**Rationale:** 
- `InMemoryChatMessageHistory` 是 LangChain 官方提供的标准组件
- Map 结构支持多会话并发
- 与 LangChain 的 `RunnableWithMessageHistory` 完美集成

### 2. 使用 RunnableWithMessageHistory 包装 model
**Decision:** 使用 `model.bindTools()` 的结果与 `RunnableWithMessageHistory` 组合，创建带有 memory 能力的 chain。

**Rationale:**
- `RunnableWithMessageHistory` 自动处理历史消息的加载和保存
- 简化业务代码，无需手动管理消息数组
- 支持 getSessionHistory 回调，灵活获取每个会话的历史

### 3. 使用 MessagesPlaceholder 在 prompt 中预留位置
**Decision:** 使用 `ChatPromptTemplate` 替代 `PromptTemplate`，并使用 `MessagesPlaceholder` 在 system message 后插入历史消息。

**Rationale:**
- `MessagesPlaceholder` 是 LangChain 推荐的方式
- 自动将历史消息插入到正确位置
- 代码更清晰，意图更明确

## Risks / Trade-offs

**Risk:** `InMemoryChatMessageHistory` 是内存存储，重启后数据丢失
- **Mitigation:** 后续可实现基于 Redis 或数据库的自定义存储，LangChain 支持自定义 `BaseChatMessageHistory`

**Risk:** 内存中的 Map 可能无限增长
- **Mitigation:** 后续可实现消息截断策略或 LRU 淘汰机制

**Trade-off:** 使用 LangChain 官方组件增加了框架依赖
- **Benefit:** 获得更好的生态集成和长期维护保障
