import { Injectable } from '@nestjs/common';
import { FeishuDocService } from '../shared/feishu-doc.service';
import { TestStepParserService } from './test-step-parser.service';
import { PlaywrightService } from './playwright.service';
import { TestStatus } from './interfaces/test-result.interface';

@Injectable()
export class AutoTestService {
  constructor(
    private readonly feishuDocService: FeishuDocService,
    private readonly testStepParser: TestStepParserService,
    private readonly playwrightService: PlaywrightService,
  ) {}

  async runTest(docUrl: string): Promise<string> {
    try {
      // 1. 获取文档内容（默认返回字符串格式）
      const docContent = await this.feishuDocService.getDocContent(docUrl, false);
      console.log('docContent', docContent)
      // 确保 docContent 是字符串类型
      const contentStr = typeof docContent === 'string' ? docContent : JSON.stringify(docContent);
      // 2. AI 解析测试步骤
      const testCase = await this.testStepParser.parse(contentStr);
      console.log('生成的测试用例', testCase)
      // 3. 执行测试
      const result = await this.playwrightService.execute(testCase);

      // 4. 格式化结果为飞书消息
      return this.formatResult(result);
    } catch (err) {
      console.error('自动化测试出错:', err);
      return `测试执行失败：${err.message}`;
    }
  }

  private formatResult(result: any): string {
    const statusEmoji = {
      [TestStatus.PASSED]: '✅',
      [TestStatus.FAILED]: '❌',
      [TestStatus.ERROR]: '⚠️',
    };

    const statusText = {
      [TestStatus.PASSED]: '通过',
      [TestStatus.FAILED]: '失败',
      [TestStatus.ERROR]: '错误',
    };

    // 格式化步骤详情
    const stepDetails = result.stepResults
      .map(
        (step: any, index: number) => {
          const stepEmoji = step.status === TestStatus.PASSED ? '✅' : '❌';
          const errorInfo = step.error ? ` - ${step.error}` : '';
          return `${index + 1}. ${stepEmoji} ${step.step.description} (${(step.duration / 1000).toFixed(1)}s)${errorInfo}`;
        },
      )
      .join('\n');

    return `
【自动化测试报告】
🕒 测试时间：${result.startTime.toLocaleString('zh-CN')}
🌐 目标地址：${result.targetUrl}

📊 测试结果：${statusEmoji[result.status]} ${statusText[result.status]}
📝 总步骤：${result.totalSteps}
✅ 通过：${result.passedSteps}
❌ 失败：${result.failedSteps}
⏱️ 耗时：${(result.totalDuration / 1000).toFixed(1)} 秒

【步骤详情】
${stepDetails}
${result.errorSummary ? `\n⚠️ 错误摘要：${result.errorSummary}` : ''}
    `.trim();
  }
}
