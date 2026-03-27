/**
 * 任务类型
 * - service_call: 调用服务方法
 * - message_send: 发送飞书消息（兜底逻辑）
 */
export type TaskType = 'service_call' | 'message_send';

/**
 * 调度类型
 * - cron: 周期性定时任务（使用 Cron 表达式）
 * - delay: 一次性延时任务（延迟指定时间后执行）
 */
export type ScheduleType = 'cron' | 'delay';

/**
 * 定时任务接口
 */
export interface ScheduledTask {
  /** 唯一标识 */
  id: string;
  /** 任务名称 */
  name: string;
  /** 调度类型 */
  scheduleType: ScheduleType;
  /** Cron 表达式（仅 cron 类型需要） */
  cronExpression?: string;
  /** 延迟毫秒数（仅 delay 类型需要） */
  delayMs?: number;
  /** 任务类型 */
  taskType: TaskType;
  
  // service_call 类型字段
  /** 服务名（仅 service_call 类型需要） */
  serviceName?: string;
  /** 方法名（仅 service_call 类型需要） */
  methodName?: string;
  /** 可选参数（仅 service_call 类型需要） */
  params?: any[];
  
  // message_send 类型字段
  /** 消息内容（仅 message_send 类型需要） */
  messageContent?: string;
  /** 目标聊天 ID（仅 message_send 类型需要） */
  chatId?: string;
  
  // 通用字段
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后执行时间 */
  lastExecutedAt?: Date;
  /** CronJob 名称（用于 SchedulerRegistry） */
  cronJobName: string;
  /** 是否通知执行结果 */
  notifyResult?: boolean;
  /** 任务关联的人员 ID 列表，用于@这些人 */
  assigneeIds?: string[];
}

/**
 * 创建定时任务输入
 */
export interface CreateScheduledTaskInput {
  name: string;
  scheduleType: ScheduleType;
  cronExpression?: string;
  delayMs?: number;
  taskType: TaskType;
  serviceName?: string;
  methodName?: string;
  params?: any[];
  messageContent?: string;
  chatId?: string;
  notifyResult?: boolean;
  /** 可选，任务关联的人员 ID 列表 */
  assigneeIds?: string[];
}

/**
 * 定时任务执行结果
 */
export interface TaskExecutionResult {
  taskId: string;
  taskName: string;
  executedAt: Date;
  success: boolean;
  result?: string;
  error?: string;
  duration: number;
}
