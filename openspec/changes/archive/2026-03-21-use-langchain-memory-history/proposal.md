## Why

当前实现使用了自定义的 `MessageHistoryService` 接口来管理对话历史，但 LangChain 已经提供了更标准和完善的 memory 解决方案，包括 `RunnableWithMessageHistory`、`InMemoryChatMessageHistory` 和 `MessagesPlaceholder` 等组件。使用 LangChain 官方的 memory 组件可以：
- 获得更好的与 LangChain 生态的集成
- 减少自定义代码，降低维护成本
- 更容易扩展到其它存储后端（如 Redis、数据库等）

## What Changes

- 移除自定义的 `MessageHistoryService` 和 `InMemoryMessageHistoryService`
- 使用 LangChain 的 `InMemoryChatMessageHistory` 作为存储后端
- 使用 `RunnableWithMessageHistory` 包装 model，自动处理消息历史
- 使用 `MessagesPlaceholder` 在 prompt 中预留历史消息位置
- 重构 [`runChain()`](src/ai/ai.service.ts:83) 函数，利用 LangChain 的 memory 能力简化代码

## Capabilities

### New Capabilities
- `langchain-memory-integration`: 使用 LangChain 官方的 memory 组件实现对话历史管理

### Modified Capabilities
- 

## Impact

- [`src/ai/ai.service.ts`](src/ai/ai.service.ts): `runChain()` 函数重构，使用 `RunnableWithMessageHistory`
- [`src/ai/message-history.service.ts`](src/ai/message-history.service.ts): **BREAKING** - 移除自定义的 `MessageHistoryService`
- [`src/ai/ai.module.ts`](src/ai/ai.module.ts): 移除 `MessageHistoryService` 提供者注册
- 依赖 LangChain 的 `@langchain/core` 和 `@langchain/openai` 包中的 memory 相关组件
