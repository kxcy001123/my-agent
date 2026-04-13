import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ScheduledTaskService } from '../scheduled-task.service';
import { NotificationPolicyService } from '../../common/notification-policy.service';

/**
 * 取消定时任务 Tool
 *
 * @param scheduledTaskService 定时任务服务实例
 * @param notificationPolicyService 消息通知策略服务实例
 * @returns LangChain Tool
 */
export const cancelScheduledTaskTool = (
  scheduledTaskService: ScheduledTaskService,
  notificationPolicyService: NotificationPolicyService,
) => {
  return tool(
    async ({
      taskId,
      taskName,
      reason
    }) => {
      try {
        // 如果传入了 taskId，直接使用
        let taskToDelete = taskId ? scheduledTaskService.getTask(taskId) : null;
        
        // 如果没有 taskId，尝试通过 taskName 查找
        if (!taskToDelete && taskName) {
          const allTasks = scheduledTaskService.getAllTasks();
          taskToDelete = allTasks.find(task => task.name.includes(taskName) || taskName.includes(task.name));
        }
        
        if (!taskToDelete) {
          return `❌ 未找到要取消的任务。请提供正确的任务 ID 或任务名称。`;
        }

        // 删除任务
        const deleted = scheduledTaskService.deleteTask(taskToDelete.id);
        
        if (!deleted) {
          return `❌ 取消任务失败。任务可能已被删除。`;
        }
        
        // 根据策略决定是否返回确认消息
        if (notificationPolicyService.shouldNotify('task_cancelled')) {
          return formatTaskCancelledResponse(taskToDelete, reason);
        } else {
          console.log('静默取消任务', formatTaskCancelledResponse(taskToDelete, reason));
        }
        
        // 静默模式：返回空字符串，AI 不会回复确认消息
        return '';
      } catch (error) {
        console.error(`❌ [定时任务取消失败] error=${error.message}`);
        return `❌ 取消任务失败：${error.message}`;
      }
    },
    {
      name: 'cancel_scheduled_task',
      description: `取消/删除已创建的定时任务。当用户想要取消之前创建的提醒、定时任务时使用。

触发场景：
1. 用户明确说"取消刚才的提醒"、"删除那个定时任务"
2. 聊天上下文变化导致任务不再需要执行（如：问题已解决、任务已完成、情况有变）
3. 用户说"不需要了"、"算了"、"问题已经解决了"等表示任务不再需要的话语

参数说明：
- taskId: 可选，要取消的任务 ID。如果用户明确提到了任务 ID，使用它
- taskName: 可选，任务名称或名称关键词。如果用户说"取消刚才的提醒"，根据上下文推断任务名称
- reason: 可选，取消原因，用于记录和通知`,
      schema: z.object({
        taskId: z.string().optional().describe('要取消的任务 ID（如果已知）'),
        taskName: z.string().optional().describe('任务名称或关键词，用于查找任务'),
        reason: z.string().optional().describe('取消原因，如"问题已解决"、"用户取消"、"情况变化"等')
      }),
    },
  );
};

/**
 * 格式化任务取消成功响应
 */
function formatTaskCancelledResponse(task: any, reason?: string): string {
  const reasonText = reason ? `\n取消原因：${reason}` : '';
  return `✅ 定时任务已取消！

任务 ID: ${task.id}
任务名称：${task.name}
任务类型：${task.scheduleType}
原状态：${task.enabled ? '已启用' : '已禁用'}
取消时间：${new Date().toLocaleString('zh-CN')}${reasonText}
`.trim();
}
