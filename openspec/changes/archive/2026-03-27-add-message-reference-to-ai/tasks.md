## 1. 扩展事件类型定义

- [x] 1.1 在 `src/feishu/feishu.service.ts` 中扩展 `EventHandler` 类型，添加 `messageId`, `parentId`, `rootId` 可选字段

## 2. 提取消息引用字段

- [x] 2.1 在 `FeishuService.handleMessageEvent()` 中提取 `message.message_id`
- [x] 2.2 在 `FeishuService.handleMessageEvent()` 中提取 `message.parent_id`
- [x] 2.3 在 `FeishuService.handleMessageEvent()` 中提取 `message.root_id`
- [x] 2.4 将提取的字段传递给 `processMessageAsync()` 方法

## 3. 传递字段到 AI 服务

- [x] 3.1 在 `EventHandlerService.handleEvent()` 中接收新字段
- [x] 3.2 在 `EventHandlerService.handleWithAI()` 中传递新字段到 `aiService.runChain()`

## 4. AI 服务集成

- [x] 4.1 在 `AiService.runChain()` 方法签名中添加 `messageId`, `parentId`, `rootId` 参数
- [x] 4.2 在构建 `HumanMessage` 时添加消息引用元数据到 prompt 中
- [x] 4.3 格式：`[当前消息ID: xxx]\n[父消息ID: xxx]\n[根消息ID: xxx]`

## 5. 测试验证

- [x] 5.1 TypeScript 编译验证通过
- [x] 5.2 代码修改完成，等待运行时测试