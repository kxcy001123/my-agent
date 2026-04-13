/**
 * 消息通知场景类型
 * 
 * 定义所有可能发送消息的场景，用于控制消息发送策略
 */
export type NotificationScene =
  | 'task_created'      // 任务创建确认
  | 'task_executed'     // 任务执行结果
  | 'task_cancelled'    // 任务取消确认
  | 'risk_detected'     // 风险识别预警
  | 'progress_update'   // 进度状态变更
  | 'user_query'        // 用户主动查询回复

/**
 * 消息通知场景的默认值配置
 */
export const NOTIFICATION_DEFAULTS: Record<NotificationScene, boolean> = {
  task_created: false,      // 默认不发送任务创建确认
  task_executed: true,      // 默认发送任务执行结果
  task_cancelled: false,    // 默认不发送任务取消确认
  risk_detected: true,      // 默认发送风险识别预警
  progress_update: false,   // 默认不发送进度状态变更
  user_query: true,         // 默认发送用户查询回复
};

/**
 * 环境变量名称映射
 */
export const NOTIFICATION_ENV_KEYS: Record<NotificationScene, string> = {
  task_created: 'NOTIFY_TASK_CREATED',
  task_executed: 'NOTIFY_TASK_EXECUTED',
  task_cancelled: 'NOTIFY_TASK_CANCELLED',
  risk_detected: 'NOTIFY_RISK_DETECTED',
  progress_update: 'NOTIFY_PROGRESS_UPDATE',
  user_query: 'NOTIFY_USER_QUERY',
};
