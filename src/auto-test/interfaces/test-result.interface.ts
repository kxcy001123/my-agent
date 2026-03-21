import { TestStepDto } from '../dto/test-step.dto';

export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  ERROR = 'error',
}

export interface StepResult {
  step: TestStepDto;
  status: TestStatus;
  error?: string;
  screenshot?: string; // Base64 截图
  duration: number; // 执行耗时（毫秒）
}

export interface TestResult {
  status: TestStatus;
  targetUrl: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  stepResults: StepResult[];
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  errorSummary?: string;
}
