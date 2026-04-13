import { Injectable } from '@nestjs/common';
import { FeishuDocService, StructuredDocContent } from '../shared/feishu-doc.service';
import { AiService } from '../ai/ai.service';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class PrdReviewService {
  constructor(private readonly feishuDocService: FeishuDocService, private readonly aiService: AiService) {}

  // 核心：PRD 评审逻辑（支持多模态输入）
  async reviewPrd(docUrl: string): Promise<string> {
    try {
      // 1. 读取飞书文档内容（返回结构化数据）
      const docContent = await this.feishuDocService.getDocContent(docUrl, true);
      
      let reviewResult: string;
      if (typeof docContent === 'string') {
        // 纯文本内容
        reviewResult = await this.generateReviewResult(docContent);
      } else {
        // 结构化内容（文本 + 图片），使用多模态消息
        reviewResult = await this.generateReviewResultWithImages(docContent);
      }

      // 3. 构造结构化评审报告
      return `
【PRD 自动评审报告】
🕒 评审时间：${new Date().toLocaleString()}

【核心评审意见】
${reviewResult}
      `;
    } catch (err) {
      return `评审失败：${err.message}`;
    }
  }

  private async generateReviewResult(docContent: string): Promise<string> {
    return await this.aiService.runReviewPrdChain(docContent)
  }

  private async generateReviewResultWithImages(content: StructuredDocContent): Promise<string> {
    // 构造多模态消息
    const messageContent: any[] = [];
    
    // 添加所有图片
    for (const image of content.images) {
      messageContent.push({
        type: 'image_url',
        image_url: { url: image }
      });
    }
    
    // 添加文本
    if (content.text) {
      messageContent.push({
        type: 'text',
        text: content.text
      });
    }
    
    return await this.aiService.runReviewPrdChainWithMultimodal(messageContent);
  }
}
