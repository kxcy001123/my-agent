# 定时任务功能实现任务清单

## 1. 基础结构

- [x] 1.1 创建 ScheduledTaskModule 模块文件
- [x] 1.2 创建定时任务接口 (scheduled-task.interface.ts)
- [x] 1.3 创建任务 DTO（如需要）

## 2. 核心服务实现

- [x] 2.1 实现 TaskRegistryService - 任务注册表（内存存储）
- [x] 2.2 实现 ScheduledTaskService - 核心调度逻辑
- [x] 2.3 实现 create_scheduled_task Tool - LangChain Tool 封装

## 3. 集成现有模块

- [x] 3.1 在 AiModule 中导入 ScheduledTaskModule
- [x] 3.2 在 AiService 中集成 create_scheduled_task Tool
- [x] 3.3 在 AppModule 中导入 ScheduledTaskModule
- [x] 3.4 扩展 EventHandlerService - 添加任务管理命令处理（查看/删除/启用/禁用）

## 4. 通知功能

- [x] 4.1 实现任务执行结果通知
- [x] 4.2 实现任务执行错误通知

## 5. 延时任务支持（新增）

- [x] 5.1 更新 ScheduledTask 接口，支持 scheduleType 字段（cron/delay）
- [x] 5.2 更新 TaskRegistryService，支持 Timeout 任务注册和管理
- [x] 5.3 更新 ScheduledTaskService，支持延时任务创建
- [x] 5.4 更新 create_scheduled_task Tool，支持 delay 调度类型
- [x] 5.5 更新 AI Prompt，支持延时任务意图识别（如"10 分钟后"）

## 6. 测试和调试

- [ ] 6.1 单元测试：TaskRegistryService（含延时任务）
- [ ] 6.2 单元测试：ScheduledTaskService（含延时任务）
- [ ] 6.3 端到端测试：发送飞书创建延时任务消息
- [ ] 6.4 调试和优化 AI Tool 的 Prompt

## 7. 验证

- [ ] 7.1 验证 Cron 表达式解析正确性
- [ ] 7.2 验证延时时间解析正确性
- [ ] 7.3 验证服务方法调用
- [ ] 7.4 验证飞书消息发送兜底逻辑
- [ ] 7.5 验证任务管理命令
