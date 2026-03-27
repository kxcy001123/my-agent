import { Injectable, OnModuleInit } from '@nestjs/common';
import { FeishuService, EventHandler } from '../feishu/feishu.service';
import { PrdReviewService } from '../prd-review/prd-review.service';
import { AutoTestService } from '../auto-test/auto-test.service';
import { ScheduledTaskService } from '../scheduled-task/scheduled-task.service';
import { AiService } from '../ai/ai.service';
import { NotificationPolicyService } from '../common/notification-policy.service';

@Injectable()
export class EventHandlerService implements OnModuleInit {
  constructor(
    private readonly feishuService: FeishuService,
    private readonly prdReviewService: PrdReviewService,
    private readonly autoTestService: AutoTestService,
    private readonly scheduledTaskService: ScheduledTaskService,
    private readonly aiService: AiService,
    private readonly notificationPolicyService: NotificationPolicyService,
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
    senderId?: string;
    mentionIds?: string[];
    mentions?: any[];
    messageId?: string;
    parentId?: string;
    rootId?: string;
  }): Promise<string> {
    const { type, text, docUrl, chatId, senderId, mentionIds, mentions, messageId, parentId, rootId } = event;

    console.log(`📨 处理事件：type=${type}, text=${text}, docUrl=${docUrl}, chatId=${chatId}, senderId=${senderId}, mentionIds=${mentionIds?.join(', ')}, messageId=${messageId}, parentId=${parentId}, rootId=${rootId}`);

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
    return this.handleWithAI(text, chatId, senderId, mentionIds, mentions, messageId, parentId, rootId);
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
  private async handleWithAI(text: string, chatId: string, senderId?: string, mentionIds?: string[], mentions?: any[], messageId?: string, parentId?: string, rootId?: string): Promise<string> {
    try {
      // 调用 AI 服务，AI 会自动进行意图识别并调用相应的工具
      const response = await this.aiService.runChain(text, chatId, senderId, mentionIds, messageId, parentId, rootId);
      
      // 规则1: 如果@了本机器人（通过 mentions 中的 name 判断），必须回复
      const isBotMentioned = this.checkBotMentionedByName(mentions);
      if (isBotMentioned) {
        console.log('📢 检测到@机器人，直接发送回复');
        return response;
      }
      
      // 规则2: 如果是风险识别场景，发送预警内容（不含标记）
      const isRiskScenario = this.detectRiskScenario(response);
      if (isRiskScenario) {
        console.log('📢 检测到风险场景，发送预警');
        // 提取预警内容（去掉标记部分）
        return response;
      }
      
      // 规则3: 其他情况不发送（静默模式）
      console.log('🤫 普通消息，不发送到群里');
      return '';
   
    } catch (err) {
      console.error('AI 处理失败:', err);
      return '抱歉，处理过程中出现错误，请稍后重试。';
    }
  }

  // 通过机器人名字判断是否@了本机器人
  private checkBotMentionedByName(mentions?: any[]): boolean {
    if (!mentions || mentions.length === 0) {
      return false;
    }
    // 机器人名字
    const botName = 'chenjq 助手';
    return mentions.some(m => m.name === botName);
  }

  // 检测是否为风险场景 - 解析 AI 响应中的标记
  private detectRiskScenario(response: string): boolean {
    if (!response) {
      return false;
    }
    // 匹配 [风险:TYPE] 格式的标记
    const riskPattern = /\[风险:(RESOURCE|TIME|DEPENDENCY|QUALITY)\]/i;
    return riskPattern.test(response);
  }

  // 提取风险预警内容（去掉标记部分）
  private extractRiskWarning(response: string): string {
    if (!response) {
      return '';
    }
    // 移除 [风险:TYPE] 标记，保留后续内容
    return response.replace(/\[风险:\w+\]\s*/i, '').trim();
  }
}
