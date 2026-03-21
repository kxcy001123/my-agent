import { Injectable } from '@nestjs/common';
import { FeishuDocService } from '../shared/feishu-doc.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class PrdReviewService {
  constructor(private readonly feishuDocService: FeishuDocService, private readonly aiService: AiService) {}

  // 核心：PRD 评审逻辑（测试阶段先模拟，后续可接入大模型）
  async reviewPrd(docUrl: string): Promise<string> {
    try {
      // 1. 读取飞书文档内容
      const docContent = await this.feishuDocService.getDocContent(docUrl);
      const reviewResult = await this.generateReviewResult(docContent);

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
}
