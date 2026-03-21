import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  chromium,
  firefox,
  webkit,
  Browser,
  BrowserContext,
  Page,
} from 'playwright';
import { TestCaseDto } from './dto/test-step.dto';
import {
  TestResult,
  TestStatus,
  StepResult,
} from './interfaces/test-result.interface';
import { ActionType } from './dto/test-step.dto';

interface PlaywrightConfig {
  headless: boolean;
  timeout: number;
  slowMo: number;
  browser: 'chromium' | 'chrome' | 'firefox' | 'webkit';
  viewport: {
    width: number;
    height: number;
  };
  video: boolean;
  trace: boolean;
}

@Injectable()
export class PlaywrightService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: PlaywrightConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      headless: this.configService.get('PLAYWRIGHT_HEADLESS') === 'true',
      timeout: parseInt(
        this.configService.get('PLAYWRIGHT_TIMEOUT') || '30000',
      ),
      slowMo: parseInt(this.configService.get('PLAYWRIGHT_SLOW_MO') || '100'),
      browser:
        (this.configService.get('PLAYWRIGHT_BROWSER') as
          | 'chromium'
          | 'chrome'
          | 'firefox'
          | 'webkit') || 'chrome',
      viewport: {
        width: parseInt(
          this.configService.get('PLAYWRIGHT_VIEWPORT_WIDTH') || '1280',
        ),
        height: parseInt(
          this.configService.get('PLAYWRIGHT_VIEWPORT_HEIGHT') || '720',
        ),
      },
      video: this.configService.get('PLAYWRIGHT_VIDEO') === 'true',
      trace: this.configService.get('PLAYWRIGHT_TRACE') === 'true',
    };
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async cleanup() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private getBrowserType() {
    switch (this.config.browser) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      case 'chrome':
        // 使用系统已安装的 Google Chrome
        return chromium;
      default:
        return chromium;
    }
  }

  async execute(testCase: TestCaseDto): Promise<TestResult> {
    const result: TestResult = this.initResult(testCase);

    try {
      const browserType = this.getBrowserType();

      // 启动浏览器
      const launchOptions: any = {
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: this.config.headless ? [] : ['--start-maximized'],
      };

      // 如果配置为 chrome，使用系统已安装的 Google Chrome
      if (this.config.browser === 'chrome') {
        launchOptions.channel = 'chrome';
      }

      this.browser = await browserType.launch(launchOptions);

      // 创建页面上下文
      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
        recordVideo: this.config.video
          ? { dir: './test-videos/' }
          : undefined,
      });

      const page = await this.context.newPage();
      page.setDefaultTimeout(this.config.timeout);

      // 逐步执行测试步骤
      for (const step of testCase.steps) {
        const stepResult = await this.executeStep(page, step);
        result.stepResults.push(stepResult);

        if (stepResult.status === TestStatus.FAILED) {
          result.failedSteps++;
        } else {
          result.passedSteps++;
        }
      }

      // 汇总结果
      result.status = result.failedSteps === 0 ? TestStatus.PASSED : TestStatus.FAILED;
    } catch (error) {
      result.status = TestStatus.ERROR;
      result.errorSummary = error.message;
    } finally {
      await this.cleanup();
      result.endTime = new Date();
      result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
    }

    return result;
  }

  private initResult(testCase: TestCaseDto): TestResult {
    return {
      status: TestStatus.PASSED,
      targetUrl: testCase.targetUrl,
      totalSteps: testCase.steps.length,
      passedSteps: 0,
      failedSteps: 0,
      stepResults: [],
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: 0,
    };
  }

  private async executeStep(page: Page, step: any): Promise<StepResult> {
    const startTime = Date.now();
    const stepResult: StepResult = {
      step,
      status: TestStatus.PASSED,
      duration: 0,
    };

    try {
      switch (step.action) {
        // 导航操作
        case ActionType.NAVIGATE:
          await page.goto(step.value, { waitUntil: 'networkidle' });
          break;
        case ActionType.GO_BACK:
          await page.goBack();
          break;
        case ActionType.GO_FORWARD:
          await page.goForward();
          break;
        case ActionType.REFRESH:
          await page.reload();
          break;

        // 点击操作
        case ActionType.CLICK:
          await page.click(step.selector);
          break;
        case ActionType.DOUBLE_CLICK:
          await page.dblclick(step.selector);
          break;
        case ActionType.RIGHT_CLICK:
          await page.click(step.selector, { button: 'right' });
          break;
        case ActionType.HOVER:
          await page.hover(step.selector);
          break;

        // 输入操作
        case ActionType.FILL:
          await page.fill(step.selector, step.value);
          break;
        case ActionType.TYPE:
          await page.type(step.selector, step.value);
          break;
        case ActionType.CLEAR:
          await page.fill(step.selector, '');
          break;
        case ActionType.PRESS:
          await page.press(step.selector, step.value);
          break;

        // 选择操作
        case ActionType.SELECT:
          await page.selectOption(step.selector, step.value);
          break;
        case ActionType.CHECK:
          await page.check(step.selector);
          break;
        case ActionType.UNCHECK:
          await page.uncheck(step.selector);
          break;

        // 等待操作
        case ActionType.WAIT:
          await page.waitForTimeout(parseInt(step.value));
          break;
        case ActionType.WAIT_FOR_SELECTOR:
          await page.waitForSelector(step.selector);
          break;
        case ActionType.WAIT_FOR_NAVIGATION:
          await page.waitForNavigation();
          break;
        case ActionType.WAIT_FOR_LOAD_STATE:
          await page.waitForLoadState(
            step.value as 'load' | 'domcontentloaded' | 'networkidle',
          );
          break;

        // 断言验证
        case ActionType.ASSERT_TEXT: {
          const text = await page.textContent(step.selector);
          if (text && !text.includes(step.value)) {
            throw new Error(`期望文本包含 "${step.value}"，实际为 "${text}"`);
          }
          break;
        }
        case ActionType.ASSERT_VALUE: {
          const value = await page.inputValue(step.selector);
          if (value !== step.value) {
            throw new Error(`期望值 "${step.value}"，实际为 "${value}"`);
          }
          break;
        }
        case ActionType.ASSERT_VISIBLE: {
          const isVisible = await page.isVisible(step.selector);
          if (!isVisible) {
            throw new Error(`元素 "${step.selector}" 不可见`);
          }
          break;
        }
        case ActionType.ASSERT_HIDDEN: {
          const isHidden = await page.isHidden(step.selector);
          if (!isHidden) {
            throw new Error(`元素 "${step.selector}" 未隐藏`);
          }
          break;
        }
        case ActionType.ASSERT_URL: {
          const url = page.url();
          if (!url.includes(step.value)) {
            throw new Error(`期望 URL 包含 "${step.value}"，实际为 "${url}"`);
          }
          break;
        }
        case ActionType.ASSERT_TITLE: {
          const title = await page.title();
          if (!title.includes(step.value)) {
            throw new Error(`期望标题包含 "${step.value}"，实际为 "${title}"`);
          }
          break;
        }

        // 截图操作
        case ActionType.SCREENSHOT: {
          const elementScreenshot = await page
            .locator(step.selector)
            .screenshot();
          stepResult.screenshot = elementScreenshot.toString('base64');
          break;
        }
        case ActionType.FULL_SCREENSHOT: {
          const fullScreenshot = await page.screenshot({ fullPage: true });
          stepResult.screenshot = fullScreenshot.toString('base64');
          break;
        }

        // 高级操作
        case ActionType.DRAG_AND_DROP:
          await page.dragAndDrop(step.selector, step.value);
          break;
        case ActionType.UPLOAD:
          await page.setInputFiles(step.selector, step.value);
          break;
        case ActionType.DIALOG_ACCEPT:
          page.on('dialog', (dialog) => dialog.accept());
          break;
        case ActionType.DIALOG_DISMISS:
          page.on('dialog', (dialog) => dialog.dismiss());
          break;

        // iframe 操作
        case ActionType.FRAME_SWITCH:
          // 切换到 iframe（需要在上下文中保存 frame）
          await page.frameLocator(step.selector);
          break;
        case ActionType.FRAME_EXIT:
          // 返回主页面（通过重新获取 page 实现）
          break;

        // 鼠标操作
        case ActionType.MOUSE_MOVE: {
          const [x, y] = step.value.split(',').map(Number);
          await page.mouse.move(x, y);
          break;
        }
        case ActionType.SCROLL: {
          if (step.selector) {
            await page.locator(step.selector).scrollIntoViewIfNeeded();
          } else {
            const scrollY = parseInt(step.value);
            await page.evaluate((y) => window.scrollBy(0, y), scrollY);
          }
          break;
        }

        default:
          throw new Error(`不支持的操作类型：${step.action}`);
      }

      stepResult.duration = Date.now() - startTime;
    } catch (error) {
      stepResult.status = TestStatus.FAILED;
      stepResult.error = error.message;
      stepResult.duration = Date.now() - startTime;

      // 失败时自动截图
      try {
        const screenshot = await page.screenshot();
        stepResult.screenshot = screenshot.toString('base64');
      } catch (screenshotError) {
        console.warn('截图失败:', screenshotError);
      }
    }

    return stepResult;
  }
}
