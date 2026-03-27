## 1. 类型定义与配置服务

- [x] 1.1 创建 `src/common/notification-policy.types.ts`，定义 `NotificationScene` 类型
- [x] 1.2 创建 `src/common/notification-policy.service.ts`，实现策略查询服务
- [x] 1.3 在 `src/common/common.module.ts` 中导出 NotificationPolicyService
- [x] 1.4 在 `src/app.module.ts` 中导入 CommonModule

## 2. 环境变量配置

- [x] 2.1 在 `.env` 中添加消息通知策略环境变量
- [x] 2.2 更新 `.env.example` 文档，说明各环境变量的用途

## 3. 任务创建静默模式

- [x] 3.1 修改 `src/scheduled-task/tools/create-scheduled-task.tool.ts`，注入 NotificationPolicyService
- [x] 3.2 在任务创建成功后，根据策略决定是否返回确认消息
- [x] 3.3 如果策略关闭，返回空字符串或简化的静默标识

## 4. AI 服务静默规则

- [x] 4.1 修改 `src/ai/ai.service.ts` 的 system prompt，添加静默规则说明
- [x] 4.2 在 prompt 中指示：当工具返回空响应时，不要主动解释或确认
- [x] 4.3 确保 AI 在静默场景下不会主动回复

## 5. 任务执行结果通知

- [x] 5.1 修改 `src/scheduled-task/scheduled-task.service.ts`，注入 NotificationPolicyService
- [x] 5.2 在 `executeTask` 方法中，根据策略决定是否调用 `notifyExecutionResult`
- [x] 5.3 取消注释 `notifyExecutionResult` 调用代码

