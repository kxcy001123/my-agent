## ADDED Requirements

### Requirement: 定时任务支持关联人员 (assigneeId)
系统 SHALL 支持在创建定时任务时指定关联人员 ID，用于任务执行时@该人员。

#### Scenario: 创建定时任务时传入 assigneeId
- **WHEN** 调用 `createScheduledTaskTool` 时传入 `assigneeId` 参数
- **THEN** 创建的 ScheduledTask 对象包含 `assigneeId` 字段

#### Scenario: AI 自动传入 senderId 作为 assigneeId
- **WHEN** 用户说"创建一个提醒任务"且 AI 决定关联人员
- **THEN** AI 调用 create_scheduled_task tool 时传入 `assigneeId` 为当前 senderId

#### Scenario: 定时任务接口支持可选的 assigneeId
- **WHEN** 定义 `CreateScheduledTaskInput` 接口
- **THEN** `assigneeId` 字段为可选类型 `assigneeId?: string`

### Requirement: 定时任务服务存储 assigneeId
系统 SHALL 在创建定时任务时保存 assigneeId 信息。

#### Scenario: 任务注册时保留 assigneeId
- **WHEN** ScheduledTaskService.createTask 被调用
- **THEN** 任务对象中包含传入的 assigneeId（如果有）
