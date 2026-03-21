import { Injectable, OnModuleInit } from '@nestjs/common';
import { FeishuService, EventHandler } from '../feishu/feishu.service';
import { PrdReviewService } from '../prd-review/prd-review.service';
import { AutoTestService } from '../auto-test/auto-test.service';
import { ScheduledTaskService } from '../scheduled-task/scheduled-task.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class EventHandlerService implements OnModuleInit {
  constructor(
    private readonly feishuService: FeishuService,
    private readonly prdReviewService: PrdReviewService,
    private readonly autoTestService: AutoTestService,
    private readonly scheduledTaskService: ScheduledTaskService,
    private readonly aiService: AiService,
  ) {}

  // 模块初始化时注册事件处理器
  onModuleInit() {
    this.feishuService.setEventHandler(this.handleEvent.bind(this));
  }

  // 统一事件处理逻辑
  private async handleEvent(event: {
    type: 'mention' | 'private_message';
    chatId: string;
    text: string;
    docUrl?: string;
  }): Promise<string> {
    const { type, text, docUrl, chatId } = event;

    console.log(`📨 处理事件：type=${type}, text=${text}, docUrl=${docUrl}, chatId=${chatId}`);

    // 检查是否包含测试指令（优先判断）
    if (text.startsWith('测试')) {
      return this.handleAutoTest(docUrl);
    }

    // 检查是否包含评审指令
    if (text.includes('评审')) {
      return this.handlePrdReview(docUrl);
    }

    // 检查是否包含定时任务管理指令
    if (text.startsWith('查看定时任务')) {
      return this.handleListTasks();
    }

    if (text.startsWith('删除定时任务')) {
      const taskId = text.replace('删除定时任务', '').trim();
      return this.handleDeleteTask(taskId);
    }

    if (text.startsWith('启用定时任务')) {
      const taskId = text.replace('启用定时任务', '').trim();
      return this.handleEnableTask(taskId);
    }

    if (text.startsWith('禁用定时任务')) {
      const taskId = text.replace('禁用定时任务', '').trim();
      return this.handleDisableTask(taskId);
    }

    // 其他消息交给 AI 处理，让 AI 进行意图识别
    // AI 会自动判断是否需要调用 create_scheduled_task 工具
    return this.handleWithAI(text, chatId);
  }

  // 处理自动化测试功能
  private async handleAutoTest(docUrl?: string): Promise<string> {
    if (!docUrl) {
      return '请提供飞书文档链接，例如：\n测试 https://xxx.feishu.cn/doc/xxx';
    }

    try {
      const result = await this.autoTestService.runTest(docUrl);
      return result;
    } catch (err) {
      console.error('自动化测试出错:', err);
      return `测试执行失败：${err.message}`;
    }
  }

  // 处理 PRD 评审功能
  private async handlePrdReview(docUrl?: string): Promise<string> {
    if (!docUrl) {
      return '请提供飞书文档链接，例如：\n评审 https://xxx.feishu.cn/doc/xxx';
    }

    try {
      // 调用 PRD 评审服务
      const reviewResult = await this.prdReviewService.reviewPrd(docUrl);
      return reviewResult;
    } catch (err) {
      console.error('评审过程出错:', err);
      return `评审失败：${err.message}`;
    }
  }

  // 处理查看任务列表
  private async handleListTasks(): Promise<string> {
    const tasks = this.scheduledTaskService.getAllTasks();
    
    if (tasks.length === 0) {
      return '暂无定时任务';
    }

    const taskList = tasks.map((task, index) => {
      const statusEmoji = task.enabled ? '✅' : '⏸️';
      return `${index + 1}. ${statusEmoji} ${task.name}
   ID: ${task.id}
   Cron: ${task.cronExpression}
   类型：${task.taskType === 'service_call' ? '调用服务' : '发送消息'}
   状态：${task.enabled ? '已启用' : '已禁用'}`;
    }).join('\n\n');

    return `【定时任务列表】\n\n${taskList}`;
  }

  // 处理删除任务
  private async handleDeleteTask(taskId: string): Promise<string> {
    if (!taskId) {
      return '请提供任务 ID，例如：\n删除定时任务 task-123';
    }

    const success = this.scheduledTaskService.deleteTask(taskId.trim());
    if (success) {
      return `✅ 任务 ${taskId.trim()} 已删除`;
    } else {
      return `❌ 未找到任务：${taskId.trim()}`;
    }
  }

  // 处理启用任务
  private async handleEnableTask(taskId: string): Promise<string> {
    if (!taskId) {
      return '请提供任务 ID，例如：\n启用定时任务 task-123';
    }

    const success = this.scheduledTaskService.enableTask(taskId.trim());
    if (success) {
      return `✅ 任务 ${taskId.trim()} 已启用`;
    } else {
      return `❌ 未找到任务：${taskId.trim()}`;
    }
  }

  // 处理禁用任务
  private async handleDisableTask(taskId: string): Promise<string> {
    if (!taskId) {
      return '请提供任务 ID，例如：\n禁用定时任务 task-123';
    }

    const success = this.scheduledTaskService.disableTask(taskId.trim());
    if (success) {
      return `✅ 任务 ${taskId.trim()} 已禁用`;
    } else {
      return `❌ 未找到任务：${taskId.trim()}`;
    }
  }

  // 使用 AI 处理消息（意图识别 + 工具调用）
  private async handleWithAI(text: string, chatId: string): Promise<string> {
    try {
      // 调用 AI 服务，AI 会自动进行意图识别并调用相应的工具
      const response = await this.aiService.runChain(text, chatId);
      // 如果 AI 返回空响应，说明无法处理
      if (!response || response.trim() === '') {
        return '抱歉，我无法理解您的需求。您可以：\n- 说"测试"来执行自动化测试\n- 说"评审"来评审 PRD\n- 说"查看定时任务"来管理任务\n- 或者直接描述您想创建的定时任务，如"每天早上 9 点执行自动化测试"';
      }
      
      return response;
    } catch (err) {
      console.error('AI 处理失败:', err);
      return '抱歉，处理过程中出现错误，请稍后重试。';
    }
  }
}
