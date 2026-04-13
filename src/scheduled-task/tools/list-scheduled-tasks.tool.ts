import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ScheduledTaskService } from '../scheduled-task.service';

/**
 * 查询定时任务列表 Tool
 *
 * @param scheduledTaskService 定时任务服务实例
 * @returns LangChain Tool
 */
export const listScheduledTasksTool = (
  scheduledTaskService: ScheduledTaskService,
) => {
  return tool(
    async ({
      filterEnabled
    }) => {
      try {
        const allTasks = scheduledTaskService.getAllTasks();
        
        // 根据过滤条件筛选任务
        const tasks = filterEnabled !== undefined
          ? allTasks.filter(task => task.enabled === filterEnabled)
          : allTasks;
        
        if (tasks.length === 0) {
          return filterEnabled === true
            ? '当前没有已启用的定时任务。'
            : filterEnabled === false
            ? '当前没有已禁用的定时任务。'
            : '当前没有任何定时任务。';
        }
        
        return formatTasksList(tasks);
      } catch (error) {
        console.error(`❌ [查询任务列表失败] error=${error.message}`);
        return `❌ 查询任务列表失败：${error.message}`;
      }
    },
    {
      name: 'list_scheduled_tasks',
      description: `查询当前已创建的定时任务列表。当用户想要查看有哪些任务、不确定要取消哪个任务、或者想确认任务是否已创建时使用。

参数说明：
- filterEnabled: 可选，过滤条件
  - true - 只返回已启用的任务
  - false - 只返回已禁用的任务
  - 不传 - 返回所有任务

使用场景：
1. 用户问"有哪些定时任务？"、"查看任务列表"
2. 用户说"取消刚才的提醒"，但不确定具体是哪个任务时，先查询列表
3. 用户想确认任务是否已创建
4. 用户想了解当前任务状态`,
      schema: z.object({
        filterEnabled: z.boolean().optional().describe('可选，过滤条件：true-只返回启用的任务，false-只返回禁用的任务，不传 - 返回所有任务')
      }),
    },
  );
};

/**
 * 格式化任务列表响应
 */
function formatTasksList(tasks: any[]): string {
  const lines = [`📋 当前共有 ${tasks.length} 个定时任务：`, ''];
  
  tasks.forEach((task, index) => {
    const statusEmoji = task.enabled ? '✅' : '⏸️';
    const typeEmoji = task.scheduleType === 'cron' ? '🔄' : '⏱️';
    const scheduleInfo = task.scheduleType === 'cron'
      ? `Cron: ${task.cronExpression}`
      : `延时：${task.delayMs}ms`;
    
    lines.push(`${index + 1}. ${statusEmoji} ${task.name}`);
    lines.push(`   ID: ${task.id}`);
    lines.push(`   类型：${typeEmoji} ${task.scheduleType === 'cron' ? '周期性' : '一次性'}`);
    lines.push(`   ${scheduleInfo}`);
    if (task.lastExecutedAt) {
      lines.push(`   最后执行：${task.lastExecutedAt.toLocaleString('zh-CN')}`);
    }
    lines.push(`   创建时间：${task.createdAt.toLocaleString('zh-CN')}`);
    lines.push('');
  });
  
  return lines.join('\n');
}
