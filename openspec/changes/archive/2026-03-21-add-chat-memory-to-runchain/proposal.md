## Why

当前的 [`runChain()`](src/ai/ai.service.ts:80) 函数在每次调用时都会创建一个新的消息列表，无法保留历史对话记录。这导致 AI 助手无法记住之前的对话内容，限制了多轮对话场景的使用。需要增加基于 `chatId` 的消息记忆能力，使 AI 能够维护对话上下文。

## What Changes

- 在 [`runChain()`](src/ai/ai.service.ts:80) 函数中增加消息历史加载逻辑
- 使用 `chatId` 作为 history 的 key，从存储服务中加载历史消息
- 在对话结束后，将新的对话消息保存到存储服务中
- 保持与现有工具调用逻辑的兼容性

## Capabilities

### New Capabilities
- `chat-memory-storage`: 定义消息存储接口，支持按 chatId 加载和保存对话历史

### Modified Capabilities
- 

## Impact

- [`src/ai/ai.service.ts`](src/ai/ai.service.ts): `runChain()` 函数需要修改，增加历史消息的加载和保存逻辑
- 需要引入消息存储服务接口（如 `MessageHistoryService`）
- 依赖 [`ai.module.ts`](src/ai/ai.module.ts) 提供存储服务的具体实现
- 保持与现有 `chatId` 参数传递的兼容性
