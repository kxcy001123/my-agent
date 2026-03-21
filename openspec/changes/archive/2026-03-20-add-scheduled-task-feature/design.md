# 定时任务功能设计

## Context（上下文）

当前项目是一个 NestJS 应用，已集成：
- **FeishuService**: 通过 WebSocket 长连接接收飞书消息事件
- **EventHandlerService**: 路由分发不同类型的消息指令
- **AiService**: 基于 LangChain + ChatOpenAI 的 AI 服务，支持 Tool 调用
- **AutoTestService**: 自动化测试执行服务
- **PrdReviewService**: PRD 评审服务

现有架构已支持 Tool 调用模式（如 `query_user` Tool），本次设计在此基础上扩展定时任务创建能力。

## Goals / Non-Goals

### Goals
- 实现飞书自然语言创建定时任务（周期性）
- 实现飞书自然语言创建延时任务（一次性，如"10 分钟后执行"）
- AI 解析自然语言生成 Cron 表达式或延时毫秒数
- 使用 LangChain Tool 封装创建任务功能
- 支持任务管理命令（查看/删除/启用/禁用）
- 任务执行结果通过飞书通知
- 仅内存存储
- 支持调用任意服务方法或执行简单的飞书消息发送

### Non-Goals
- 不支持任务持久化存储
- 不支持任务执行历史记录
- 不支持任务依赖关系
- 不支持并发任务控制
- 不支持任务优先级

## Decisions（设计决策）

### 1. 模块结构设计

**决策**: 创建独立的 ScheduledTaskModule，包含三个核心服务

**理由**:
- 遵循单一职责原则，每个服务专注一个功能
- 便于测试和维护
- 与现有 AutoTestModule 结构保持一致

**模块结构**:
```
src/scheduled-task/
├── scheduled-task.module.ts          # 模块定义，导出 Tool
├── scheduled-task.service.ts         # 核心服务（创建/删除/启用/禁用）
├── task-registry.service.ts          # 任务注册表（内存存储）
├── interfaces/
│   └── scheduled-task.interface.ts   # 任务接口定义
└── tools/
    └── create-scheduled-task.tool.ts # LangChain Tool 封装
```

### 2. AI Tool 设计

**决策**: 使用 LangChain `tool()` 函数封装创建任务功能

**理由**:
- 复用现有 AiService 的 Tool 调用基础设施
- AI 模型可自主决定何时调用 Tool
- 结构化输入输出，便于验证

**Tool Schema**:
```typescript
{
  name: 'create_scheduled_task',
  description: `创建一个定时任务或延时任务。可用的任务类型：
- 调用服务方法：如 autoTestService.runTest, prdReviewService.reviewPrd
- 发送飞书消息：直接发送一条消息到指定聊天

调度类型：
- cron: 周期性任务，使用 Cron 表达式，如"每天早上 9 点"
- delay: 一次性延时任务，如"10 分钟后"`,
  schema: z.object({
    scheduleType: z.enum(['cron', 'delay']).describe('调度类型：cron（周期性）或 delay（一次性延时）'),
    cronExpression: z.string().optional().describe('Cron 表达式，如 "0 9 * * *" 表示每天 9 点（仅 cron 类型需要）'),
    delayMs: z.number().optional().describe('延迟毫秒数，如 600000 表示 10 分钟后（仅 delay 类型需要）'),
    taskType: z.enum(['service_call', 'message_send']).describe('任务类型'),
    serviceName: z.string().optional().describe('服务名（仅 service_call 类型需要）'),
    methodName: z.string().optional().describe('方法名（仅 service_call 类型需要）'),
    messageContent: z.string().optional().describe('消息内容（仅 message_send 类型需要）'),
    chatId: z.string().optional().describe('目标聊天 ID（仅 message_send 类型需要）'),
    taskName: z.string().describe('任务名称'),
    params: z.array(z.any()).optional().describe('可选参数（仅 service_call 类型需要）'),
  }),
}
```

### 3. 任务注册表设计

**决策**: 使用 Map 存储任务，支持 CronJob（周期性）和 Timeout（延时）两种调度器

**理由**:
- Map 提供 O(1) 的查找性能
- 任务与调度器实例一一绑定，便于管理
- 内存存储简单高效
- `@nestjs/schedule` 的 `SchedulerRegistry` 同时支持 `CronJob` 和 `Timeout`

**数据结构**:
```typescript
interface ScheduledTask {
  id: string;           // 唯一标识
  name: string;         // 任务名称
  scheduleType: 'cron' | 'delay';  // 调度类型
  cronExpression?: string;         // Cron 表达式（仅 cron 类型）
  delayMs?: number;                // 延迟毫秒数（仅 delay 类型）
  taskType: 'service_call' | 'message_send';
  // service_call 类型字段
  serviceName?: string;
  methodName?: string;
  params?: any[];
  // message_send 类型字段
  messageContent?: string;
  chatId?: string;
  // 通用字段
  enabled: boolean;
  createdAt: Date;
  lastExecutedAt?: Date;
  cronJob?: CronJob;    // CronJob 实例
}
```

### 4. 动态 CronJob 创建

**决策**: 使用 `CronJob` 类动态创建任务

**理由**:
- `@nestjs/schedule` 的装饰器方式不支持运行时动态创建
- `CronJob` 类支持运行时创建和销毁
- 支持启用/禁用控制

**创建方式**:
```typescript
const job = new CronJob(cronExpression, async () => {
  try {
    let result: string;
    
    if (task.taskType === 'service_call') {
      // 调用服务方法
      const service = this.getServiceInstance(task.serviceName);
      result = await service[task.methodName](...task.params);
    } else if (task.taskType === 'message_send') {
      // 发送飞书消息（兜底逻辑）
      await this.feishuService.sendTextMessage(task.chatId, task.messageContent);
      result = '消息发送成功';
    }
    
    // 记录执行时间
    task.lastExecutedAt = new Date();
    
    // 发送执行结果通知（可选）
    if (task.notifyResult) {
      await this.notifyResult(task, result);
    }
  } catch (error) {
    console.error(`任务 ${task.id} 执行失败:`, error);
    await this.notifyError(task, error);
  }
});
job.start();
```

### 5. 服务方法调用

**决策**: 通过模块引用获取服务实例，反射调用方法

**理由**:
- 支持调用任意已注册的服务方法
- 灵活扩展，无需硬编码

**调用方式**:
```typescript
private getServiceInstance(serviceName: string): any {
  try {
    const service = this.moduleRef.get(serviceName, { strict: false });
    return service;
  } catch (error) {
    throw new Error(`无法获取服务实例：${serviceName}`);
  }
}
```

### 6. 任务执行通知

**决策**: 任务执行完成后通过飞书发送执行结果（可选）

**理由**:
- 用户需要知道任务执行情况
- 失败时及时通知便于排查

**通知内容**:
```
【定时任务执行报告】
任务名称：每天早上 9 点执行自动化测试
执行时间：2026-03-19 09:00:00
执行结果：✅ 成功 / ❌ 失败
耗时：12.5 秒
```

### 7. 兜底逻辑设计

**决策**: 支持简单的飞书消息发送作为兜底任务类型

**理由**:
- 用户可能只需要定时发送消息提醒
- 无需依赖其他服务即可工作
- 降低使用门槛

**示例场景**:
- 每天上午 10 点发送站会提醒
- 每周五下午发送周报提醒
- 每小时发送一次系统状态检查提醒

## Risks / Trade-offs

### Risk 1: 服务方法签名匹配
- **风险**: AI 可能生成错误的参数类型或数量
- **缓解**: Tool Schema 中明确列出参数要求；执行前进行参数验证

### Risk 2: 内存存储限制
- **风险**: 服务重启后任务丢失
- **缓解**: 当前设计明确不需要持久化；未来可扩展支持文件/数据库存储

### Risk 3: 任务执行失败
- **风险**: 任务执行异常可能影响系统稳定性
- **缓解**: 每个任务独立 try/catch 包裹；失败时发送错误通知

### Risk 4: CronJob 资源泄漏
- **风险**: 删除任务时未正确释放 CronJob 资源
- **缓解**: 删除任务时调用 `cronJob.stop()` 并清理引用

### Risk 5: AI 解析准确性
- **风险**: 自然语言解析可能产生错误的 Cron 表达式
- **缓解**: 使用 Cron 验证库验证表达式；提供确认机制

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        飞书消息交互层                            │
│  用户：帮我创建一个定时任务，每天早上 9 点发送站会提醒            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EventHandlerService                          │
│  识别意图 → 调用 AiService 处理                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AiService + LangChain                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ChatOpenAI with Tools                                    │  │
│  │  - 系统 Prompt: 你是一个定时任务助手...                    │  │
│  │  - 可用 Tools: [create_scheduled_task, query_user, ...]   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ (Tool 调用)
┌─────────────────────────────────────────────────────────────────┐
│              create_scheduled_task Tool                         │
│  输入：{ cronExpression, taskType, taskName, ... }              │
│  输出：任务创建结果                                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              ScheduledTaskModule                                │
│  ┌──────────────────┐    ┌──────────────────────────────────┐  │
│  │ ScheduledTask    │    │ TaskRegistry                     │  │
│  │ Service          │    │ - Map<string, ScheduledTask>     │  │
│  │ - createTask()   │    │ - register()                     │  │
│  │ - deleteTask()   │    │ - unregister()                   │  │
│  │ - enableTask()   │    │ - enable()                       │  │
│  │ - disableTask()  │    │ - disable()                      │  │
│  └──────────────────┘    └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    @nestjs/schedule                             │
│  Dynamic CronJob 动态创建和管理                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
    ┌───────────────────┐           ┌───────────────────┐
    │  service_call     │           │  message_send     │
    │  调用服务方法      │           │  发送飞书消息      │
    │  autoTestService  │           │  兜底逻辑         │
    └───────────────────┘           └───────────────────┘
```
