# 定时任务功能提案

## Why（为什么需要这个功能）

当前项目已支持通过飞书消息触发自动化测试和 PRD 评审功能，但缺乏定时任务管理能力。用户需要手动执行测试，无法实现定期自动执行。通过自然语言创建定时任务，用户可以用简单的语言描述任务需求，AI 自动解析并创建 Cron 任务，大幅提升自动化程度。

**新增需求**：用户还需要支持一次性延时任务，例如"10 分钟后执行测试"、"30 分钟后发送提醒"等场景。

## What Changes（变更内容）

### 新增功能
- **自然语言创建定时任务**：用户通过飞书消息发送自然语言描述（如"每天早上 9 点执行自动化测试"），AI 自动解析并创建定时任务
- **自然语言创建延时任务**：用户发送"10 分钟后执行测试"等描述，AI 自动解析并创建一次性延时任务
- **LangChain Tool 封装**：将"创建定时任务"功能封装成 LangChain Tool，供 AI 模型自主调用
- **任务管理命令**：支持查看/删除/启用/禁用定时任务
- **执行结果通知**：任务执行完成后通过飞书消息通知用户

### 技术实现
- 使用 `@nestjs/schedule` 的 `SchedulerRegistry` 进行 Cron 调度和延时任务调度
- 使用 LangChain Tool 模式封装创建任务功能
- 动态创建和管理 CronJob（周期性任务）和 Timeout（一次性延时任务）
- 仅内存存储，不需要持久化

## Capabilities（能力）

### New Capabilities

- `scheduled-task-creation`: 自然语言创建定时任务能力，包括 AI 解析、Cron 表达式生成、任务注册
- `scheduled-task-management`: 定时任务管理能力，包括查看/删除/启用/禁用任务
- `scheduled-task-notification`: 任务执行结果飞书通知能力

### Modified Capabilities

- `ai-service`: 扩展 AiService，新增 `create_scheduled_task` Tool 支持
- `event-handler`: 扩展事件处理器，新增定时任务管理命令处理

## Impact（影响范围）

### 新增模块
- `src/scheduled-task/` 目录
  - `scheduled-task.module.ts` - 模块定义
  - `scheduled-task.service.ts` - 核心服务
  - `task-registry.service.ts` - 任务注册表
  - `interfaces/scheduled-task.interface.ts` - 接口定义
  - `tools/create-scheduled-task.tool.ts` - LangChain Tool 封装

### 修改文件
- `src/ai/ai.module.ts` - 导出 `create_scheduled_task` Tool
- `src/ai/ai.service.ts` - 集成定时任务 Tool
- `src/event-handler/event-handler.service.ts` - 添加任务管理命令处理
- `src/app.module.ts` - 导入 ScheduledTaskModule

### 依赖
- `@nestjs/schedule` - 已安装，无需新增
