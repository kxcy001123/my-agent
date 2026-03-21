## 1. 重构 AiService 使用 LangChain Memory

- [x] 1.1 导入 LangChain 的 `InMemoryChatMessageHistory`、`RunnableWithMessageHistory`、`MessagesPlaceholder`、`ChatPromptTemplate`
- [x] 1.2 创建 `Map<string, InMemoryChatMessageHistory>` 存储每个 chatId 的历史记录
- [x] 1.3 使用 `ChatPromptTemplate` 和 `MessagesPlaceholder` 重构 prompt
- [x] 1.4 使用 `RunnableWithMessageHistory` 包装 model，配置 `getSessionHistory` 回调
- [x] 1.5 重构 `runChain()` 函数，利用 LangChain memory 组件管理历史

## 2. 清理自定义代码

- [x] 2.1 移除 `src/ai/message-history.service.ts` 文件
- [x] 2.2 从 `AiModule` 中移除 `MessageHistoryService` 提供者
- [x] 2.3 从 `AiService` 中移除 `MessageHistoryService` 依赖注入
