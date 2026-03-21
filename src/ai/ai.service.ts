import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'

import { CreateAiDto } from './dto/create-ai.dto';
import { UpdateAiDto } from './dto/update-ai.dto';

import { ChatOpenAI } from '@langchain/openai'
import type { Runnable } from '@langchain/core/runnables';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'


import { tool } from '@langchain/core/tools'


import {
  SystemMessage, HumanMessage, ToolMessage, AIMessage, BaseMessage,
  AIMessageChunk
} from '@langchain/core/messages';

import { z } from 'zod'

const database = {
  users: {
    '001': { id: '001', name: '张三', email: 'zhangsan@example.com', role: 'admin' },
    '002': { id: '002', name: '李四', email: 'lisi@example.com', role: 'user' },
    '003': { id: '003', name: '王五', email: 'wangwu@example.com', role: 'user' },
  },
};

const queryUserArgsSchema = z.object({
  userId: z.string().describe('用户 ID，例如：001, 002, 003')
})

type QueryUserArgs = {
  userId: string;
}


// const queryUserTool = tool(async({userId})=>{
//   const user = database.users[userId];
//   if (!user) {
//     throw new Error(`用户 ${userId} 不存在`);
//   }
//   return`用户信息：\n- ID: ${user.id}\n- 姓名：${user.name}\n- 邮箱：${user.email}\n- 角色：${user.role}`;
// }, {
//   name: 'query_user',
//   description: '查询数据库中的用户信息。输入用户 ID，返回该用户的详细信息（姓名、邮箱、角色）。',
//   schema: queryUserArgsSchema,
// })

// const tools = [queryUserTool]

@Injectable()
export class AiService {

  private chain: Runnable;
  private chainWithMemory: RunnableWithMessageHistory<any, any>
  private tools: any[];
  private model: ChatOpenAI;
  private modelWithTools: Runnable<any, AIMessage>
  private readonly logger = new Logger(AiService.name);

  // 使用 Map 存储每个 chatId 的历史记录
  private chatHistories: Map<string, InMemoryChatMessageHistory> = new Map();

  constructor(
    @Inject('CHAT_MODEL') model: ChatOpenAI,
    @Inject('QUERY_USER_TOOL') private readonly queryUserTool: any,
    @Inject('CREATE_SCHEDULED_TASK_TOOL') private readonly createScheduledTaskTool: any,
  ) {

    const prompt = ChatPromptTemplate.fromTemplate(`
      请回答以下问题:\n\n{query}
      `)
    this.model = model;
    this.chain = prompt.pipe(model).pipe(new StringOutputParser());

    this.tools = [this.queryUserTool, this.createScheduledTaskTool]
    this.modelWithTools = model.bindTools(this.tools);
  }

  async runChain(query: string, chatId?: string): Promise<string> {
    // 构建 system message
    const systemMessage = new SystemMessage(`你是一个 chenjq 的智能助手，可以在需要时调用工具来完成任务。

## 核心角色
你同时具备以下能力：
1. **PMO 项目管理助手** - 帮助用户跟踪项目进度、识别风险、创建提醒任务
2. **日常助手** - 查询用户信息、创建定时任务等

## 可用工具
- query_user: 查询用户信息
- create_scheduled_task: 创建定时任务或延时任务

---

## PMO 项目管理能力

### 项目进度识别
当用户描述任务状态时，请识别以下进度状态：

| 状态 | 关键词示例 |
|------|-----------|
| COMPLETED (完成) | 已完成、做完了、搞定了、完成了、done |
| IN_PROGRESS (进行中) | 正在进行、在做、进行中、正在做、开发中 |
| BLOCKED (阻塞) | 卡住了、阻塞、等待、依赖、被卡住、无法推进 |
| DELAYED (延期) | 延期、推迟、来不及、超时、延后 |

识别到进度更新时，请：
1. 确认你理解的任务状态
2. 如有阻塞或延期，询问具体原因
3. 建议是否需要创建跟进提醒

### 项目风险识别
当用户描述困难时，请识别以下风险类型：

| 风险类型 | 关键词示例 | 建议话术 |
|---------|-----------|---------|
| RESOURCE (资源风险) | 人手不够、资源不足、没人做、缺人 | 建议协调资源或调整优先级，是否需要向上级申请支援？ |
| TIME (时间风险) | 时间不够、来不及、太紧了、赶不上 | 建议评估是否需要延期或削减范围，是否需要沟通调整截止日期？ |
| DEPENDENCY (依赖风险) | 等别人、依赖XX、卡在XX、等外部 | 建议跟进依赖方或制定备选方案，是否需要主动沟通？ |
| QUALITY (质量风险) | 没时间测试、先上线再说、质量可能有问题 | 提醒注意潜在的技术债务，建议预留修复时间 |

识别到风险时，请：
1. 明确告知用户识别到的风险类型
2. 给出针对性的建议
3. 建议创建风险预警提醒任务

### 项目提醒任务创建引导
以下场景建议引导用户创建提醒任务：

1. **进度跟进提醒** - 当任务阻塞或延期时，建议创建定时提醒跟进进展
2. **风险预警提醒** - 当识别到高风险时，建议创建延时提醒在风险发生前预警
3. **里程碑提醒** - 当用户提及重要节点或截止日期时，建议创建定时提醒

创建提醒任务示例话术：
- "这个任务目前处于阻塞状态，是否需要我创建一个提醒任务，明天跟进一下进展？"
- "识别到时间风险，是否需要我在截止日期前2天提醒你？"

---

## 工具调用规则

### 创建定时任务 (create_scheduled_task)
当用户想要创建定时任务或同意创建提醒任务时调用。

参数说明：
- chatId: 如果用户没有指定，使用当前会话的 chatId
- scheduleType:
  - "cron" - 周期性任务（每天、每周、每月）
  - "delay" - 延时任务（X分钟后、X小时后）
- cronExpression: 当 scheduleType 为 "cron" 时必填
  - 每天 09:00 -> "0 0 9 * * *"
  - 每周一 10:00 -> "0 0 10 * * 1"
- delayMs: 当 scheduleType 为 "delay" 时必填
  - 10分钟后 -> 600000
  - 1小时后 -> 3600000

### 查询用户信息 (query_user)
当用户想要查询用户信息时调用。

---

## 其他规则
- 如果是日常闲聊，可以回答用户的基础问题，并提醒用户不要闲聊
- 保持回复简洁专业，避免过度解读
- 项目状态信息会存储在对话历史中，可以随时总结项目状态`);

    if (!this.chainWithMemory) {
      const prompt = ChatPromptTemplate.fromMessages([
        systemMessage,
        new MessagesPlaceholder('history'),
        ['human', '{question}']
      ])
      const chain = prompt.pipe(this.modelWithTools)
      this.chainWithMemory = new RunnableWithMessageHistory({
        runnable: chain,
        getMessageHistory: (sessionId: string) => {
          if (!this.chatHistories.has(sessionId)) {
            this.chatHistories.set(sessionId, new InMemoryChatMessageHistory());
          }
          return this.chatHistories.get(sessionId)!;
        },
        inputMessagesKey: "question",
        historyMessagesKey: "history",
      })
    }

    // 如果没有 chatId，使用默认的空历史记录
    if (!chatId) {
      chatId = 'default';
    }

    // 获取或创建当前会话的历史记录
    if (!this.chatHistories.has(chatId)) {
      this.chatHistories.set(chatId, new InMemoryChatMessageHistory());
    }
    const history = this.chatHistories.get(chatId)!;

    while (true) {
      // 执行对话
      const aiMessage = await this.chainWithMemory.invoke({
        question: query
      }, {
        configurable: {
          sessionId: chatId,
        }
      });

      const toolCalls = aiMessage.tool_calls ?? [];
      // 如果没有工具调用，返回结果
      if (!toolCalls.length) {
        return aiMessage.content as string;
      }

      // 执行所有工具调用，并将结果添加到历史记录中
      for (const toolCall of toolCalls) {
        const toolCallId = toolCall.id || '';
        const toolName = toolCall.name;

        if (toolName === 'query_user') {
          const args = queryUserArgsSchema.parse(toolCall.args);
          const result = await this.queryUserTool.invoke(args);

          await history.addMessage(
            new ToolMessage({
              tool_call_id: toolCallId,
              name: toolName,
              content: typeof result === 'string' ? result : JSON.stringify(result),
            }),
          );
        } else if (toolName === 'create_scheduled_task') {
          // 如果 AI 没有传入 chatId，使用默认的 chatId
          const args = toolCall.args as any;
          if (!args.chatId && chatId) {
            args.chatId = chatId;
          }
          const result = await this.createScheduledTaskTool.invoke(args);

          await history.addMessage(
            new ToolMessage({
              tool_call_id: toolCallId,
              name: toolName,
              content: typeof result === 'string' ? result : JSON.stringify(result),
            }),
          );
        }
      }
    }


  }

  async runReviewPrdChain(query): Promise<string> {
    const messages: BaseMessage[] = [
      new SystemMessage(`你是一个 20 年经验的高级产品总监，并且有很强的工程研发背景，擅长进行产品架构规划，产品细节把控，对 prd 的评审有丰富的经验。请根据以下内容进行评审，并给出详细的评审意见。
        你的输出格式是
        评审意见
        改进意见
        评审结果：通过/不通过
        `),
      new HumanMessage(query),
    ]

    return this.model.pipe(new StringOutputParser()).invoke(messages)
  }

  async runGenerateTest(query): Promise<string> {
    return this.model.pipe(new StringOutputParser()).invoke(query)
  }

  async runChainStream(query): Promise<AsyncIterableIterator<string>> {
    return this.chain.stream({ query });
  }

  async *runChainStream2(query): AsyncIterableIterator<string> {
    const messages: BaseMessage[] = [
      new SystemMessage('你是一个智能助手，可以在需要时调用工具（如 query_user）来查询用户信息，再用结果回答用户的问题。'),
      new HumanMessage(query),
    ]

    while (true) {
      // 一轮对话：先让模型思考并（可能）提出工具调用
      const stream = await this.modelWithTools.stream(messages);

      let fullAIMessage: AIMessageChunk | null = null;

      for await (const chunk of stream as AsyncIterable<AIMessageChunk>) {
        // 使用 concat 持续拼接，得到本轮完整的 AIMessageChunk
        fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;

        const hasToolCallChunk =
          !!fullAIMessage.tool_call_chunks &&
          fullAIMessage.tool_call_chunks.length > 0;

        // 只要当前轮次还没出现 tool 调用的 chunk，就可以把文本内容流式往外推
        if (!hasToolCallChunk && chunk.content) {
          yield chunk.content as string
        }
      }

      for await (const chunk of stream as AsyncIterable<AIMessageChunk>) {
        // 使用 concat 持续拼接，得到本轮完整的 AIMessageChunk
        fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;

        const hasToolCallChunk =
          !!fullAIMessage.tool_call_chunks &&
          fullAIMessage.tool_call_chunks.length > 0;

        // 只要当前轮次还没出现 tool 调用的 chunk，就可以把文本内容流式往外推
        if (!hasToolCallChunk && chunk.content) {
          yield chunk.content as string
        }
      }

      if (!fullAIMessage) {
        return;
      }

      messages.push(fullAIMessage);

      const toolCalls = fullAIMessage.tool_calls ?? [];

      // 没有工具调用：说明这一轮就是最终回答，已经在上面的 for-await 中流完了，可以结束
      if (!toolCalls.length) {
        return;
      }

      // 依次执行本轮需要调用的所有工具
      for (const toolCall of toolCalls) {
        const toolCallId = toolCall.id || '';
        const toolName = toolCall.name;
        const tool = this.tools.find(tool => tool.name === toolName)
        if (!tool) {
          return `未找到工具 ${toolName}`;
        }
        const result = await tool.invoke(toolCall.args as any);

        messages.push(
          new ToolMessage({
            tool_call_id: toolCallId,
            name: toolName,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          }),
        );
      }
    }
  }

  create(createAiDto: CreateAiDto) {
    return 'This action adds a new ai';
  }

  findAll() {
    return `This action returns all ai`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ai`;
  }

  update(id: number, updateAiDto: UpdateAiDto) {
    return `This action updates a #${id} ai`;
  }

  remove(id: number) {
    return `This action removes a #${id} ai`;
  }

}
