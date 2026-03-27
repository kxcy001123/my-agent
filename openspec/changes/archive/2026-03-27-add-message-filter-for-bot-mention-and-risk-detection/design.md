## Context

当前系统架构：
- 用户在飞书群聊中发送消息
- FeishuService 接收消息事件，提取 text 和 mentionIds
- EventHandlerService 处理消息，调用 AI 服务
- AI 返回结果后，通过 FeishuService.sendTextMessage 发送到群里

当前问题：
1. **Bug**: feishu.service.ts:128 使用 `text.includes('@')` 判断是否被@，但 text 已经被移除了@标签，导致判断永远为 false
2. **消息过载**: 所有 AI 回复都会发送到群里，包括日常闲聊等不相干内容

## Goals / Non-Goals

**Goals:**
- 修复@机器人判断 bug，正确识别是否@了本机器人
- 实现消息过滤逻辑：@机器人必回复、风险识别才发送、其他静默
- 减少群消息噪音，提升机器人可用性

**Non-Goals:**
- 不修改 AI 本身的意图识别逻辑
- 不修改现有的定时任务、自动化测试等功能
- 不处理私聊场景（私聊默认回复）

## Decisions

### 决策 1: 如何判断@的是本机器人

**方案 A**: 通过飞书 API 获取机器人自己的 open_id，然后与 mentionIds 匹配
- 优点：精确匹配，不依赖名字
- 缺点：需要额外 API 调用

**方案 B**: 通过 mentions 数组中的 name 匹配机器人名字
- 优点：简单，无需额外 API
- 缺点：依赖名字，可能变化

**选择**: 方案 A - 使用飞书 API 获取机器人 open_id

### 决策 2: 如何判断风险识别场景

**方案 A**: AI 返回带场景标签的 JSON（如 `{scene: 'risk_detected', content: '...'}`）
- 优点：明确
- 缺点：需要修改 AI prompt 和解析逻辑

**方案 B**: 检测 AI 返回内容中是否包含风险关键词
- 优点：简单
- 缺点：可能误判

**选择**: 方案 A - 让 AI 返回场景标签

### 决策 3: 在哪个阶段拦截消息

**方案 A**: 在 FeishuService.processMessageAsync 中拦截
- 优点：消息发送前最后一关
- 缺点：需要传递场景信息

**方案 B**: 在 EventHandlerService.handleWithAI 中拦截
- 优点：逻辑集中，易于维护
- 缺点：需要修改返回值

**选择**: 方案 B - 在 EventHandlerService.handleWithAI 中处理

## Risks / Trade-offs

- [Risk] 机器人首次启动时需要调用 API 获取 open_id，可能有延迟 → [Mitigation] 启动时缓存机器人 ID
- [Risk] AI 返回格式可能变化，导致场景解析失败 → [Mitigation] 添加解析失败的兜底逻辑（默认不发送）
- [Risk] 群里@多人的场景，需要区分@的是否包含机器人 → [Mitigation] 使用 mentionIds 精确匹配

## Migration Plan

1. 修改 FeishuService：
   - 添加 getBotOpenId() 方法获取机器人 ID
   - 修复 eventType 判断逻辑（使用 mentionIds 而非 text）
2. 修改 EventHandlerService：
   - 注入 FeishuService 获取机器人 ID
   - 在 handleWithAI 中添加消息过滤逻辑
3. 修改 AiService：
   - 让 AI 返回场景标签（可选，或使用关键词检测）

无数据迁移，无需停机。