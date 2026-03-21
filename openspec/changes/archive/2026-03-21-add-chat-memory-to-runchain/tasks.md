## 1. 创建消息历史存储服务

- [x] 1.1 创建 `MessageHistoryService` 接口，定义 `getHistory(chatId: string)` 和 `saveHistory(chatId: string, messages: BaseMessage[])` 方法
- [x] 1.2 创建 `InMemoryMessageHistoryService` 实现类，使用内存 Map 存储历史消息
- [x] 1.3 在 `AiModule` 中注册 `MessageHistoryService` 提供者

## 2. 修改 AiService 实现消息记忆

- [x] 2.1 在 `AiService` 中注入 `MessageHistoryService`
- [x] 2.2 修改 `runChain()` 函数，在对话开始时加载历史消息
- [x] 2.3 修改 `runChain()` 函数，在对话结束后保存历史消息
- [x] 2.4 添加错误处理，确保存储失败不影响主流程
