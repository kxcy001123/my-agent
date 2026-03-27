import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, EventDispatcher, WSClient } from '@larksuiteoapi/node-sdk';
import { FEISHU_CLIENT } from './feishu-client.token';

// 定义事件处理回调类型
export type EventHandler = (event: {
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
}) => Promise<string>;

@Injectable()
export class FeishuService {
  private eventHandler?: EventHandler;
  private wsClient?: WSClient;
  private eventDispatcher?: EventDispatcher;

  constructor(
    @Inject(FEISHU_CLIENT) private readonly feishuClient: Client,
    private readonly configService: ConfigService,
  ) {}

  // 设置事件处理器（由外部模块注入）
  setEventHandler(handler: EventHandler) {
    this.eventHandler = handler;
  }

  // 初始化事件调度器
  private initEventDispatcher(): EventDispatcher {
    const verificationToken = this.configService.get('FEISHU_VERIFICATION_TOKEN') as string;
    const encryptKey = this.configService.get('FEISHU_ENCRYPT_KEY') as string;

    if (!verificationToken || !encryptKey) {
      console.warn('⚠️ 缺少 FEISHU_VERIFICATION_TOKEN 或 FEISHU_ENCRYPT_KEY 配置');
    }

    return new EventDispatcher({
      verificationToken: verificationToken || '',
      encryptKey: encryptKey || '',
    });
  }

  // 启动长连接接收飞书事件
  startLongPolling() {
    try {
      // 创建事件调度器
      this.eventDispatcher = this.initEventDispatcher();

      // 注册 im.message.receive_v1 事件（包含@机器人和私聊）
      this.eventDispatcher.register({
        'im.message.receive_v1': async (event: any) => {
          await this.handleMessageEvent(event);
        },
      });

      // 创建 WSClient 实例
      this.wsClient = new WSClient({
        appId: this.configService.get('FEISHU_APP_ID') as string,
        appSecret: this.configService.get('FEISHU_APP_SECRET') as string,
        domain: 'https://open.feishu.cn',
      });

      // 启动长连接
      this.wsClient
        .start({
          eventDispatcher: this.eventDispatcher,
        })
        .then(() => {
          console.log('✅ 飞书长连接已启动，等待事件...');
        })
        .catch((err: any) => {
          console.error('❌ 长连接启动失败:', err);
        });
    } catch (err) {
      console.error('❌ 启动长连接失败:', err);
    }
  }

  // 处理消息事件（统一处理@机器人和私聊）
  private async handleMessageEvent(event: any) {
    try {
      const { message, sender } = event.event || event;
      if (!message) {
        console.warn('⚠️ 无效的事件数据');
        return;
      }

      const senderId = sender.sender_id.open_id;
      const mentions = message.mentions;
      const mentionIds = message.mentions?.map(item => item.id.open_id) || [];
      const appId = this.configService.get('FEISHU_APP_ID') as string;
      
      
      if (senderId && senderId === appId) {
        console.log('🤖 跳过机器人自己发送的消息');
        return;
      }
      console.log('event', message, message.quoted_message)
      const chatId = message.chat_id;
      const messageId = message.message_id;
      const parentId = message.parent_id;
      const rootId = message.root_id;
      const content = JSON.parse(message.content);
      const text = content.text?.replace(/@_user_\d+/g, '').trim() || '';
      console.log(`📩 收到消息：${text}, messageId: ${messageId}, parentId: ${parentId}, rootId: ${rootId}`);
      // 提取文档链接
      const docUrl = text.match(/https:\/\/\S+?\.feishu\.cn\/\S+/)?.[0];

      // 先回复"思考中"，避免飞书 3 秒超时重推
      // await this.sendTextMessage(chatId, '🤔 正在思考中，请稍候...');
      
      this.processMessageAsync(chatId, text, docUrl, senderId, mentionIds, mentions, messageId, parentId, rootId).catch((err) => {
        console.error('异步处理消息失败:', err);
        this.sendTextMessage(chatId, '处理失败，请稍后重试！').catch(() => {});
      });

      // 立即返回，让飞书认为消息已处理
      return;
    } catch (err) {
      console.error('处理消息事件失败:', err);
    }
  }

  // 异步处理消息业务逻辑
  private async processMessageAsync(chatId: string, text: string, docUrl?: string, senderId?: string, mentionIds?: string[], mentions?: any[], messageId?: string, parentId?: string, rootId?: string) {
    if (this.eventHandler) {
      // 使用 mentionIds 判断是否@了机器人，而不是 text（因为@标签已被移除）
      const eventType = mentionIds && mentionIds.length > 0 ? 'mention' : 'private_message';
      const reply = await this.eventHandler({
        type: eventType,
        chatId,
        text,
        docUrl,
        senderId,
        mentionIds,
        mentions,
        messageId,
        parentId,
        rootId,
      });
      // 发送最终结果
      console.log('最终结果', reply)
      reply && await this.sendTextMessage(chatId, reply, mentionIds);
    } else {
      await this.sendTextMessage(chatId, '未配置事件处理器，无法处理消息。请检查配置。');
      console.warn('未配置事件处理器，无法处理消息。请检查配置。');
    }
  }

  // 发送文本消息到飞书
  async sendTextMessage(chatId: string, content: string, assigneeIds?: string[]) {
    try {
      // 如果有 assigneeIds，在消息内容前添加多个@标签
      const mentionTags = assigneeIds && assigneeIds.length > 0
        ? assigneeIds.map(id => `<at user_id="${id}"></at>`).join('') + '\n'
        : '';
      const finalContent = mentionTags
        ? `${mentionTags}${content}\n Power by chenjq`
        : `${content}\n Power by chenjq`;
      
      await (this.feishuClient).im.message.create({
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: chatId,
          content: JSON.stringify({ text: finalContent }),
          msg_type: 'text',
        },
      });
      console.log('✅ 消息发送成功', content);
    } catch (err) {
      console.error('❌ 发送消息失败:', err);
    }
  }
}
