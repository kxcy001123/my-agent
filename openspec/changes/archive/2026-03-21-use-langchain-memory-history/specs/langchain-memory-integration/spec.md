## ADDED Requirements

### Requirement: 使用 InMemoryChatMessageHistory 存储会话历史
系统 SHALL 使用 LangChain 的 `InMemoryChatMessageHistory` 组件来存储每个会话的历史消息。

#### Scenario: 创建新的会话历史
- **WHEN** 首次使用某个 chatId 进行对话
- **THEN** 系统自动创建一个新的 `InMemoryChatMessageHistory` 实例

#### Scenario: 复用已存在的会话历史
- **WHEN** 使用已存在的 chatId 进行对话
- **THEN** 系统复用之前的 `InMemoryChatMessageHistory` 实例，保留历史消息

### Requirement: 使用 RunnableWithMessageHistory 自动管理历史
系统 SHALL 使用 LangChain 的 `RunnableWithMessageHistory` 包装 model，自动处理消息历史的加载和保存。

#### Scenario: 自动加载历史消息
- **WHEN** 调用带有 chatId 的 runChain 方法
- **THEN** `RunnableWithMessageHistory` 自动加载该 chatId 的历史消息并传递给 model

#### Scenario: 自动保存历史消息
- **WHEN** 对话完成时
- **THEN** `RunnableWithMessageHistory` 自动将新的对话消息保存到历史记录中

### Requirement: 使用 MessagesPlaceholder 在 prompt 中预留历史消息位置
系统 SHALL 使用 `MessagesPlaceholder` 在 system prompt 之后、用户消息之前插入历史消息。

#### Scenario: 历史消息正确插入
- **WHEN** 构建 prompt 时
- **THEN** 历史消息被插入到 system message 之后、当前用户消息之前

## REMOVED Requirements

### Requirement: MessageHistoryService 接口
**Reason**: 被 LangChain 官方的 `InMemoryChatMessageHistory` 和 `RunnableWithMessageHistory` 替代

**Migration**: 
- 移除 `MessageHistoryService` 和 `InMemoryMessageHistoryService` 类
- 使用 `RunnableWithMessageHistory` 包装 model
- 使用 `getSessionHistory` 回调获取每个会话的历史
