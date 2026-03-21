import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { TestCaseDto, TestStepDto, ActionType } from './dto/test-step.dto';

@Injectable()
export class TestStepParserService {
  constructor(private readonly aiService: AiService) {}

  private readonly TEST_STEP_PARSER_PROMPT = `
你是一个自动化测试专家。请将以下自然语言描述的测试步骤转换为结构化的测试指令。

文档内容：
{docContent}

请按以下 JSON 格式输出：
{
  "targetUrl": "测试目标的 URL",
  "steps": [
    {
      "action": "操作类型（见下方支持列表）",
      "selector": "CSS 选择器（如需要）",
      "value": "输入值或断言值（如需要）",
      "description": "步骤描述",
      "timeout": 超时毫秒数（可选）
    }
  ]
}

支持的操作类型：
【导航操作】
- navigate: 导航到 URL（value 为 URL）
- go_back: 浏览器后退
- go_forward: 浏览器前进
- refresh: 刷新页面

【点击操作】
- click: 单击元素
- double_click: 双击元素
- right_click: 右键点击
- hover: 鼠标悬停

【输入操作】
- fill: 填写输入框（清空后输入，value 为输入内容）
- type: 逐字符输入（不清空，value 为输入内容）
- clear: 清空输入框
- press: 按键操作（value 为按键名，如 Enter、Escape、Tab）

【选择操作】
- select: 选择下拉框选项（value 为选项值）
- check: 勾选复选框
- uncheck: 取消勾选复选框

【等待操作】
- wait: 固定时间等待（value 为毫秒数）
- wait_for_selector: 等待元素出现（selector 为目标元素）
- wait_for_navigation: 等待页面跳转
- wait_for_load_state: 等待页面加载状态（value 为 load/domcontentloaded/networkidle）

【断言验证】
- assert_text: 验证元素文本（value 为预期文本）
- assert_value: 验证输入框值（value 为预期值）
- assert_visible: 验证元素可见
- assert_hidden: 验证元素隐藏
- assert_enabled: 验证元素可用
- assert_disabled: 验证元素禁用
- assert_url: 验证当前 URL（value 为预期 URL）
- assert_title: 验证页面标题（value 为预期标题）

【截图操作】
- screenshot: 元素截图
- full_screenshot: 全页面截图

【高级操作】
- drag_and_drop: 拖拽操作（selector 为源元素，value 为目标元素选择器）
- upload: 文件上传（value 为文件路径）
- download: 文件下载
- dialog_accept: 确认对话框
- dialog_dismiss: 取消对话框

【iframe 操作】
- frame_switch: 切换到 iframe（selector 为 iframe 选择器）
- frame_exit: 退出 iframe

【鼠标操作】
- mouse_move: 移动鼠标到元素
- scroll: 滚动页面（value 为滚动距离或元素选择器）

注意事项：
1. - 优先使用文本定位：page.click('text=业务按钮名称')（如 text=客户联系）；
   - 其次使用角色定位：page.getByRole('button', { name: '业务按钮名称' })；
   - 禁止使用 ID/Class/XPath 等易变的技术选择器；
2. 每个步骤必须有 description，清晰描述该步骤的目的
3. 断言操作的 value 为预期值
4. 只输出 JSON，不要有其他内容
5. 确保步骤顺序合理，先导航再操作
`;

  async parse(docContent: string): Promise<TestCaseDto> {
    const prompt = this.buildPrompt(docContent);
    const response = await this.aiService.runChain(prompt);

    return this.parseResponse(response);
  }

  private buildPrompt(content: string): string {
    return this.TEST_STEP_PARSER_PROMPT.replace('{docContent}', content);
  }

  private parseResponse(response: string): TestCaseDto {
    try {
      // 尝试提取 JSON 内容（可能包含在代码块中）
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;

      const parsed = JSON.parse(jsonStr);

      // 验证基本结构
      if (!parsed.targetUrl) {
        throw new Error('解析结果缺少 targetUrl 字段');
      }

      if (!Array.isArray(parsed.steps)) {
        throw new Error('解析结果缺少 steps 数组');
      }

      // 验证并转换步骤
      const steps: TestStepDto[] = parsed.steps.map((step: any, index: number) => {
        if (!step.action) {
          throw new Error(`步骤 ${index + 1} 缺少 action 字段`);
        }

        // 验证 action 是否为有效枚举值
        if (!Object.values(ActionType).includes(step.action as ActionType)) {
          throw new Error(
            `步骤 ${index + 1} 的 action "${step.action}" 不是有效的操作类型`,
          );
        }

        return {
          action: step.action as ActionType,
          selector: step.selector,
          value: step.value,
          description: step.description || `步骤 ${index + 1}`,
          timeout: step.timeout,
        };
      });

      return {
        targetUrl: parsed.targetUrl,
        steps,
        description: parsed.description,
      };
    } catch (error) {
      console.error('解析 AI 响应失败:', error);
      console.error('原始响应:', response);
      throw new Error(
        `测试步骤解析失败：${error.message}。请检查文档格式是否正确。`,
      );
    }
  }
}
