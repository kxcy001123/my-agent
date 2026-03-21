import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TaskRegistryService } from './task-registry.service';
import { FeishuService } from '../feishu/feishu.service';
import { CreateScheduledTaskInput, ScheduledTask, TaskExecutionResult } from './interfaces/scheduled-task.interface';

/**
 * 定时任务核心服务
 */
@Injectable()
export class ScheduledTaskService {
  constructor(
    private readonly taskRegistry: TaskRegistryService,
    private readonly moduleRef: ModuleRef,
    @Inject(forwardRef(() => FeishuService))
    private readonly feishuService: FeishuService,
  ) {}

  /**
   * 创建定时任务
   */
  async createTask(input: CreateScheduledTaskInput): Promise<ScheduledTask> {
    // 创建执行回调函数
    const executeCallback = async () => {
      await this.executeTask(input);
    };

    // 注册任务
    const task = this.taskRegistry.createTask(input, executeCallback);

    return task;
  }

  /**
   * 执行任务
   */
  private async executeTask(input: CreateScheduledTaskInput): Promise<void> {
    const startTime = Date.now();
    let result: string;
    let success = true;
    let error: string | undefined;

    try {
      if (input.taskType === 'service_call') {
        // 调用服务方法
        result = await this.callServiceMethod(
          input.serviceName!,
          input.methodName!,
          input.params || [],
        );
      } else if (input.taskType === 'message_send') {
        // 发送飞书消息（兜底逻辑）
        await this.feishuService.sendTextMessage(input.chatId!, input.messageContent!);
        result = '消息发送成功';
      } else {
        throw new Error(`未知的任务类型：${input.taskType}`);
      }
    } catch (err) {
      success = false;
      error = err.message;
      result = `执行失败：${err.message}`;
      console.error(`定时任务执行失败：`, err);
    }

    // 发送执行结果通知
    // if (input.notifyResult !== false) {
    //   await this.notifyExecutionResult(input, {
    //     taskId: input.name, // 使用名称作为 ID 用于通知
    //     taskName: input.name,
    //     executedAt: new Date(),
    //     success,
    //     result,
    //     error,
    //     duration: Date.now() - startTime,
    //   });
    // }
  }

  /**
   * 调用服务方法
   */
  private async callServiceMethod(
    serviceName: string,
    methodName: string,
    params: any[],
  ): Promise<string> {
    try {
      // 从模块注册表获取服务实例
      const service = this.moduleRef.get(serviceName, { strict: false });
      if (!service) {
        throw new Error(`无法获取服务实例：${serviceName}`);
      }

      // 检查方法是否存在
      if (typeof service[methodName] !== 'function') {
        throw new Error(`方法不存在：${serviceName}.${methodName}`);
      }

      // 调用方法
      const result = await service[methodName](...params);
      return result ?? '执行成功';
    } catch (err) {
      throw new Error(`调用服务方法失败：${err.message}`);
    }
  }

  /**
   * 通知执行结果
   */
  private async notifyExecutionResult(
    input: CreateScheduledTaskInput,
    executionResult: TaskExecutionResult,
  ): Promise<void> {
    const statusEmoji = executionResult.success ? '✅' : '❌';
    const statusText = executionResult.success ? '成功' : '失败';

    const message = `
【定时任务执行报告】
任务名称：${executionResult.taskName}
执行时间：${executionResult.executedAt.toLocaleString('zh-CN')}
执行结果：${statusEmoji} ${statusText}
耗时：${(executionResult.duration / 1000).toFixed(1)} 秒
${executionResult.result ? `执行结果：${executionResult.result}` : ''}
${executionResult.error ? `错误信息：${executionResult.error}` : ''}
    `.trim();

    // 发送到默认聊天 ID 或任务指定的聊天 ID
    const chatId = input.chatId;
    if (chatId) {
      await this.feishuService.sendTextMessage(chatId, message);
    }
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.taskRegistry.getTask(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): ScheduledTask[] {
    return this.taskRegistry.getAllTasks();
  }

  /**
   * 删除任务
   */
  deleteTask(taskId: string): boolean {
    return this.taskRegistry.deleteTask(taskId);
  }

  /**
   * 启用任务
   */
  enableTask(taskId: string): boolean {
    return this.taskRegistry.enableTask(taskId);
  }

  /**
   * 禁用任务
   */
  disableTask(taskId: string): boolean {
    return this.taskRegistry.disableTask(taskId);
  }
}
