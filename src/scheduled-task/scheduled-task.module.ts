import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskRegistryService } from './task-registry.service';
import { ScheduledTaskService } from './scheduled-task.service';
import { FeishuModule } from '../feishu/feishu.module';

/**
 * 定时任务模块
 * 
 * 提供定时任务创建、管理功能，支持：
 * - 自然语言创建定时任务（通过 LangChain Tool）
 * - 调用任意服务方法执行任务
 * - 发送飞书消息（兜底逻辑）
 * - 任务管理（查看/删除/启用/禁用）
 */
@Global()
@Module({
  imports: [
    // 导入 ScheduleModule 以使用 SchedulerRegistry
    ScheduleModule.forRoot(),
    // 导入 FeishuModule 用于发送通知消息
    FeishuModule,
  ],
  providers: [
    TaskRegistryService,
    ScheduledTaskService,
    // 导出 createScheduledTaskTool 工厂函数
    {
      provide: 'CREATE_SCHEDULED_TASK_TOOL',
      useFactory: (scheduledTaskService: ScheduledTaskService) => {
        const { createScheduledTaskTool } = require('./tools/create-scheduled-task.tool');
        return createScheduledTaskTool(scheduledTaskService);
      },
      inject: [ScheduledTaskService],
    },
  ],
  exports: [
    ScheduledTaskService,
    TaskRegistryService,
    'CREATE_SCHEDULED_TASK_TOOL',
  ],
})
export class ScheduledTaskModule {}
