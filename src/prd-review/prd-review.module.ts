import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { PrdReviewService } from './prd-review.service';
import { AiService } from '../ai/ai.service';
import { AiModule } from '../ai/ai.module';


@Module({
  imports: [SharedModule, AiModule],
  providers: [PrdReviewService, AiService],
  exports: [PrdReviewService],
})
export class PrdReviewModule {}
