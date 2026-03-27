## Context

当前智能助手在以下场景会发送消息到飞书群：

1. **任务创建确认** ([`create-scheduled-task.tool.ts`](src/scheduled-task/tools/create-scheduled-task.tool.ts:101)) - 创建定时任务后返回确认消息
2. **任务执行结果** ([`scheduled-task.service.ts`](src/scheduled-task/scheduled-task.service.ts:112)) - 定时任务执行后发送执行报告（目前已注释）
3. **AI 回复** ([`event-handler.service.ts`](src/event-handler/event-handler.service.ts:165)) - 每次用户消息都会触发 AI 回复
4. **任务管理反馈** ([`event-handler.service.ts`](src/event-handler/event-handler.service.ts:103)) - 查看/删除/启用/禁用任务的反馈

用户希望助手能够"默默观察"，只在关键时机发送消息，减少群消息干扰。

## Goals / Non-Goals

**Goals:**
- 提供可配置的消息通知策略，支持按场景控制是否发送消息
- 支持通过环境变量灵活配置各场景的消息发送行为
- 默认策略只开启关键场景的消息通知

**Non-Goals:**
- 不需要支持动态热更新配置（需要重启服务生效）
- 不需要支持按群聊/用户维度的个性化配置
- 不需要持久化配置到数据库

## Decisions

### 1. 配置方式

**决策**: 使用环境变量 + 配置服务的方式

**方案**:
```env
# 消息通知策略配置 (true=发送, false=静默)
NOTIFY_TASK_CREATED=false
NOTIFY_TASK_EXECUTED=true
NOTIFY_RISK_DETECTED=true
NOTIFY_PROGRESS_UPDATE=false
NOTIFY_USER_QUERY=true
```

**理由**:
- 环境变量配置简单，符合 12-factor app 原则
- 与现有项目配置方式一致（使用 ConfigService）
- 运维人员可以轻松调整配置

### 2. 场景分类定义

**决策**: 定义 5 种消息场景

| 场景 ID | 描述 | 默认值 |
|---------|------|--------|
| `task_created` | 任务创建确认 | false |
| `task_executed` | 任务执行结果 | true |
| `risk_detected` | 风险识别预警 | true |
| `progress_update` | 进度状态变更 | false |
| `user_query` | 用户主动查询回复 | true |

**理由**:
- 覆盖当前所有消息发送场景
- 默认值符合"关键时机才发送"的需求
- 可扩展，未来可以添加更多场景

### 3. 策略服务设计

**决策**: 创建 NotificationPolicyService 提供统一的策略查询接口

**方案**:
```typescript
// src/common/notification-policy.service.ts
@Injectable()
export class NotificationPolicyService {
  constructor(private configService: ConfigService) {}
  
  shouldNotify(scene: NotificationScene): boolean {
    const key = `NOTIFY_${scene.toUpperCase()}`;
    return this.configService.get(key, this.getDefaultValue(scene));
  }
  
  private getDefaultValue(scene: NotificationScene): boolean {
    const defaults = {
      task_created: false,
      task_executed: true,
      risk_detected: true,
      progress_update: false,
      user_query: true,
    };
    return defaults[scene];
  }
}
```

**理由**:
- 集中管理策略逻辑
- 提供类型安全的接口
- 易于测试和扩展

### 4. 静默模式实现

**决策**: 在各服务中注入 NotificationPolicyService，根据策略决定是否发送消息

**方案**:

1. **任务创建** - 修改 [`create-scheduled-task.tool.ts`](src/scheduled-task/tools/create-scheduled-task.tool.ts):
```typescript
// 如果策略关闭，返回空字符串或简化确认
if (!this.notificationPolicy.shouldNotify('task_created')) {
  return ''; // 静默，不返回确认消息
}
```

2. **AI 回复** - 修改 [`ai.service.ts`](src/ai/ai.service.ts) 的 system prompt:
```typescript
// 在 prompt 中添加静默规则
当执行工具调用（如创建任务）时，如果工具返回空响应，不要主动解释或确认。
```

3. **任务执行** - 修改 [`scheduled-task.service.ts`](src/scheduled-task/scheduled-task.service.ts):
```typescript
// 根据策略决定是否发送执行结果
if (this.notificationPolicy.shouldNotify('task_executed')) {
  await this.notifyExecutionResult(input, result);
}
```

**理由**:
- 最小化代码改动
- 保持现有逻辑结构
- 策略判断逻辑集中

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 配置项过多增加复杂度 | 提供合理的默认值，用户无需配置即可使用 |
| 静默模式导致用户不知道操作是否成功 | 在关键场景（如任务执行失败）强制发送通知 |
| AI 可能在静默模式下仍然回复 | 在 prompt 中明确指示静默行为 |

## Migration Plan

1. **第一步**: 创建 NotificationPolicyService 和类型定义
2. **第二步**: 在 AppModule 中注册服务
3. **第三步**: 修改 CreateScheduledTaskTool，支持静默模式
4. **第四步**: 修改 AiService 的 system prompt，添加静默规则
5. **第五步**: 修改 ScheduledTaskService，根据策略发送执行结果
6. **第六步**: 添加环境变量配置到 .env.example
7. **第七步**: 测试验证各场景

无需停机，可热更新部署。

## Open Questions

无
