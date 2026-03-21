import { Module } from '@nestjs/common';
import { AutoTestService } from './auto-test.service';
import { TestStepParserService } from './test-step-parser.service';
import { PlaywrightService } from './playwright.service';
import { SharedModule } from '../shared/shared.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SharedModule, AiModule],
  providers: [AutoTestService, TestStepParserService, PlaywrightService],
  exports: [AutoTestService],
})
export class AutoTestModule {}
