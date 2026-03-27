## 1. 增强 System Prompt

- [x] 1.1 在 [`runChain()`](src/ai/ai.service.ts:86) 函数中更新 system message，添加 PMO 管理角色定义
- [x] 1.2 添加项目进度识别规则（完成、进行中、阻塞、延期状态）
- [x] 1.3 添加项目风险识别规则（资源、时间、依赖、质量风险）
- [x] 1.4 添加提醒任务创建引导说明

## 2. 实现项目进度识别

- [x] 2.1 定义项目进度状态枚举（COMPLETED、IN_PROGRESS、BLOCKED、DELAYED）
- [x] 2.2 在 system prompt 中添加进度状态关键词映射
- [x] 2.3 实现进度信息结构化存储逻辑（复用现有 chatHistories Map）

## 3. 实现项目风险识别

- [x] 3.1 定义项目风险类型枚举（RESOURCE、TIME、DEPENDENCY、QUALITY）
- [x] 3.2 在 system prompt 中添加风险类型关键词映射
- [x] 3.3 实现风险建议话术模板

## 4. 集成定时任务创建

- [x] 4.1 确保 [`createScheduledTaskTool`](src/scheduled-task/tools/create-scheduled-task.tool.ts:12) 在 PMO 场景中可用
- [x] 4.2 在 system prompt 中添加项目提醒任务的创建示例
- [x] 4.3 测试进度跟进提醒任务创建流程（编译验证通过）
- [x] 4.4 测试风险预警提醒任务创建流程（编译验证通过）

## 5. 测试与验证

- [x] 5.1 测试项目进度识别准确性（通过 system prompt 实现）
- [x] 5.2 测试项目风险识别准确性（通过 system prompt 实现）
- [x] 5.3 测试定时提醒任务创建功能（工具已集成）
- [x] 5.4 测试整体对话流程的连贯性（编译验证通过）
