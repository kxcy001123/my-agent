import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ScheduledTaskService } from '../scheduled-task.service';
import { ScheduledTask } from '../interfaces/scheduled-task.interface';
import { NotificationPolicyService } from '../../common/notification-policy.service';

/**
 * 创建定时任务 Tool
 *
 * @param scheduledTaskService 定时任务服务实例
 * @param notificationPolicyService 消息通知策略服务实例
 * @returns LangChain Tool
 */
export const createScheduledTaskTool = (
  scheduledTaskService: ScheduledTaskService,
  notificationPolicyService: NotificationPolicyService,
) => {
  return tool(
    async ({
      scheduleType,
      cronExpression,
      delayMs,
      taskType,
      serviceName,
      methodName,
      params,
      messageContent,
      taskName,
      notifyResult,
      chatId,
      assigneeIds
    }) => {
      try {
        
        // 创建任务
        const task = await scheduledTaskService.createTask({
          name: taskName,
          scheduleType,
          cronExpression,
          delayMs,
          taskType,
          serviceName,
          methodName,
          params,
          messageContent,
          notifyResult,
          chatId,
          assigneeIds
        });
        
        // 根据策略决定是否返回确认消息
        if (notificationPolicyService.shouldNotify('task_created')) {
          return formatTaskCreatedResponse(task);
        }else{
          console.log('静默创建任务', formatTaskCreatedResponse(task))
        }
        
        // 静默模式：返回空字符串，AI 不会回复确认消息
        return '';
      } catch (error) {
        console.error(`❌ [定时任务创建失败] error=${error.message}`);
        return `❌ 创建任务失败：${error.message}`;
      }
    },
    {
      name: 'create_scheduled_task',
      description: `创建一个定时任务或延时任务。用户可以用自然语言描述任务。

调度类型：
- cron: 周期性任务，如"每天早上 9 点执行自动化测试"
- delay: 一次性延时任务，如"10 分钟后执行测试"

可用的任务类型：
1. service_call - 调用服务方法执行
    - autoTestService.runTest(docUrl: string) - 执行自动化测试
    - prdReviewService.reviewPrd(docUrl: string) - 评审 PRD 文档
    
2. message_send - 发送飞书消息（兜底逻辑）
    - 直接发送一条消息到指定聊天，适用于简单的定时提醒

参数说明：
- scheduleType: 调度类型，"cron"（周期性）或 "delay"（一次性延时）
- cronExpression: Cron 表达式，如 "0 9 * * *" 表示每天 9 点（仅 cron 类型需要）
- delayMs: 延迟毫秒数，如 600000 表示 10 分钟后（仅 delay 类型需要）
- taskType: 任务类型，"service_call" 或 "message_send"
- serviceName: 服务名（仅 service_call 需要），如 "autoTestService"
- methodName: 方法名（仅 service_call 需要），如 "runTest"
- params: 参数数组（仅 service_call 需要），如 ["/path/to/doc"]
- messageContent: 消息内容（仅 message_send 需要）
- taskName: 任务的友好名称，用于显示
- notifyResult: 是否通知执行结果，默认 true
- assigneeIds: 可选，任务执行时需要@的人员 ID 列表。如果原始消息中 mention 了某些人，且任务与这些人相关，传入这些人的 ID 列表，任务执行时会自动@这些人`,
      schema: z.object({
        scheduleType: z.enum(['cron', 'delay']).describe('调度类型：cron（周期性）或 delay（一次性延时）'),
        cronExpression: z.string().optional().describe('Cron 表达式，如 "0 9 * * *" 表示每天 9 点（仅 cron 类型需要）'),
        delayMs: z.number().optional().describe('延迟毫秒数，如 600000 表示 10 分钟后（仅 delay 类型需要）'),
        taskType: z.enum(['service_call', 'message_send']).describe('任务类型'),
        serviceName: z.string().optional().describe('服务名（仅 service_call 类型需要），如 "autoTestService"'),
        methodName: z.string().optional().describe('方法名（仅 service_call 类型需要），如 "runTest"'),
        params: z.array(z.any()).optional().describe('参数数组（仅 service_call 类型需要），如 ["/path/to/doc"]'),
        messageContent: z.string().optional().describe('消息内容（仅 message_send 类型需要）'),
        taskName: z.string().describe('任务的友好名称，如 "每天早上 9 点执行自动化测试"或"10 分钟后测试"'),
        notifyResult: z.boolean().optional().describe('是否通知执行结果，默认 false'),
        chatId: z.string().optional().describe('可选，如果没有传入，则使用默认值'),
        assigneeIds: z.array(z.string()).optional().describe('可选，任务关联的人员 ID 列表，用于执行时@这些人')
      }),
    },
  );
};

/**
 * 格式化任务创建成功响应
 */
function formatTaskCreatedResponse(task: ScheduledTask): string {
  return `✅ 定时任务已创建！

任务 ID: ${task.id}
任务名称：${task.name}
任务类型：${task.scheduleType}
Cron 表达式：${task.cronExpression}
延时时间: ${task.delayMs}
状态：${task.enabled ? '已启用' : '已禁用'}
创建时间：${task.createdAt.toLocaleString('zh-CN')}
`.trim();
}
