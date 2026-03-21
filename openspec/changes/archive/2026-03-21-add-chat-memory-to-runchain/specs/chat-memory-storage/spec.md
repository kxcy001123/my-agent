## ADDED Requirements

### Requirement: 按 chatId 加载对话历史
系统 SHALL 支持根据 chatId 加载该会话的历史消息列表。

#### Scenario: 成功加载历史消息
- **WHEN** 调用加载历史消息接口并传入有效的 chatId
- **THEN** 返回该 chatId 对应的所有历史消息，按时间顺序排列

#### Scenario: chatId 不存在时返回空列表
- **WHEN** 调用加载历史消息接口并传入一个不存在的 chatId
- **THEN** 返回空数组，不抛出异常

### Requirement: 按 chatId 保存对话历史
系统 SHALL 支持将对话历史消息保存到指定的 chatId 下。

#### Scenario: 成功保存历史消息
- **WHEN** 调用保存历史消息接口并传入 chatId 和消息数组
- **THEN** 消息被持久化存储，后续可通过相同 chatId 加载

#### Scenario: 覆盖已存在的历史
- **WHEN** 对同一 chatId 多次调用保存接口
- **THEN** 最新调用覆盖之前的历史数据

### Requirement: 消息存储服务接口
系统 SHALL 提供 MessageHistoryService 接口，包含以下方法：
- `getHistory(chatId: string): Promise<BaseMessage[]>`
- `saveHistory(chatId: string, messages: BaseMessage[]): Promise<void>`

#### Scenario: 接口可被注入到 AiService
- **WHEN** AiService 被实例化时
- **THEN** MessageHistoryService 可通过依赖注入获取
