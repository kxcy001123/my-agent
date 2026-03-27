import { Module } from '@nestjs/common';
import { FeishuModule } from '../feishu/feishu.module';
import { PrdReviewModule } from '../prd-review/prd-review.module';
import { AutoTestModule } from '../auto-test/auto-test.module';
import { AiModule } from '../ai/ai.module';
import { CommonModule } from '../common/common.module';
import { EventHandlerService } from './event-handler.service';

@Module({
  imports: [FeishuModule, PrdReviewModule, AutoTestModule, AiModule, CommonModule],
  providers: [EventHandlerService],
})
export class EventHandlerModule {}
