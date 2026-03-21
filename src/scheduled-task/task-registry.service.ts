import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduledTask, CreateScheduledTaskInput, ScheduleType } from './interfaces/scheduled-task.interface';

/**
 * 任务注册表服务
 * 使用 Map 存储任务信息，使用 SchedulerRegistry 管理 CronJob 和 Timeout
 */
@Injectable()
export class TaskRegistryService {
  /** 任务存储 Map */
  private readonly tasks = new Map<string, ScheduledTask>();

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  /**
   * 生成唯一任务 ID
   */
  generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 生成 CronJob 名称
   */
  generateCronJobName(taskId: string): string {
    return `cron-${taskId}`;
  }

  /**
   * 生成 Timeout 名称
   */
  generateTimeoutName(taskId: string): string {
    return `timeout-${taskId}`;
  }

  /**
   * 创建并注册任务
   */
  createTask(input: CreateScheduledTaskInput, executeCallback: () => Promise<void>): ScheduledTask {
    const taskId = this.generateTaskId();

    // 创建任务对象
    const task: ScheduledTask = {
      id: taskId,
      name: input.name,
      scheduleType: input.scheduleType,
      cronExpression: input.cronExpression,
      delayMs: input.delayMs,
      taskType: input.taskType,
      serviceName: input.serviceName,
      methodName: input.methodName,
      params: input.params,
      messageContent: input.messageContent,
      chatId: input.chatId,
      enabled: true,
      createdAt: new Date(),
      cronJobName: input.scheduleType === 'cron' ? this.generateCronJobName(taskId) : this.generateTimeoutName(taskId),
      notifyResult: input.notifyResult ?? true,
    };

    // 存储任务
    this.tasks.set(taskId, task);

    // 根据调度类型创建不同的调度器
    if (input.scheduleType === 'cron') {
      // 周期性任务 - 使用 CronJob
      const cronJob = new CronJob(input.cronExpression!, async () => {
        await executeCallback();
      });

      // 注册 CronJob
      this.schedulerRegistry.addCronJob(task.cronJobName, cronJob);

      // 启动任务
      cronJob.start();
    } else if (input.scheduleType === 'delay') {
      // 一次性延时任务 - 使用 Timeout
      const timeout = setTimeout(async () => {
        await executeCallback();
        // 延时任务执行后自动删除
        this.deleteTask(taskId);
      }, input.delayMs!);

      // 注册 Timeout
      this.schedulerRegistry.addTimeout(task.cronJobName, timeout);
    }

    return task;
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 删除任务
   */
  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // 根据调度类型删除不同的调度器
    try {
      if (task.scheduleType === 'cron') {
        this.schedulerRegistry.deleteCronJob(task.cronJobName);
      } else if (task.scheduleType === 'delay') {
        this.schedulerRegistry.deleteTimeout(task.cronJobName);
      }
    } catch (error) {
      console.error(`删除调度器失败：${task.cronJobName}`, error);
    }

    // 删除任务
    return this.tasks.delete(taskId);
  }

  /**
   * 启用任务
   */
  enableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    try {
      if (task.scheduleType === 'cron') {
        const cronJob = this.schedulerRegistry.getCronJob(task.cronJobName);
        cronJob.start();
      } else if (task.scheduleType === 'delay') {
        // 延时任务无法重新启用（已执行完毕）
        console.warn(`延时任务无法重新启用：${taskId}`);
        return false;
      }
      task.enabled = true;
      return true;
    } catch (error) {
      console.error(`启用任务失败：${taskId}`, error);
      return false;
    }
  }

  /**
   * 禁用任务
   */
  disableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    try {
      if (task.scheduleType === 'cron') {
        const cronJob = this.schedulerRegistry.getCronJob(task.cronJobName);
        cronJob.stop();
        task.enabled = false;
        return true;
      } else if (task.scheduleType === 'delay') {
        // 延时任务无法禁用（只能删除）
        console.warn(`延时任务无法禁用，只能删除：${taskId}`);
        return false;
      }
      return false;
    } catch (error) {
      console.error(`禁用任务失败：${taskId}`, error);
      return false;
    }
  }

  /**
   * 更新任务最后执行时间
   */
  updateLastExecutedAt(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.lastExecutedAt = new Date();
    }
  }
}
