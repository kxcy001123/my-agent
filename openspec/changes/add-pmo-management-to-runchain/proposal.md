## Why

当前的 `runChain` 函数仅支持基础对话和工具调用（查询用户信息、创建定时任务），但缺乏项目管理能力。用户需要在对话中自动识别项目进度、风险，并能够创建提醒任务，以提升项目管理效率。

## What Changes

- 在 [`runChain()`](src/ai/ai.service.ts:86) 函数中增加 PMO（项目管理办公室）管理功能
- AI 助手可以自动分析用户消息，识别项目进度更新
- AI 助手可以识别潜在的项目风险并提醒用户
- 支持创建定时或延时任务来提醒用户项目相关事项
- 增强 system prompt，使 AI 具备项目管理意识和能力

## Capabilities

### New Capabilities

- `pmo-management`: PMO 项目管理能力，包括项目进度识别、风险识别、项目提醒任务创建

### Modified Capabilities

- `chat-memory`: 需要存储项目进度和风险相关的上下文信息，以便追踪项目状态变化

## Impact

- 修改 [`src/ai/ai.service.ts`](src/ai/ai.service.ts:86) 中的 `runChain` 函数，增强 system prompt
- 可能需要新增 PMO 相关的工具（如 `track_project_progress`、`identify_risk`）
- 与现有的 `create_scheduled_task` 工具集成，用于创建项目提醒任务
- 消息历史记录需要支持项目状态的结构化存储
