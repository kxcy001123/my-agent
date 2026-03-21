import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { AiModule } from './ai/ai.module';

import { ConfigModule } from '@nestjs/config';

import { SharedModule } from './shared/shared.module';
import { FeishuModule } from './feishu/feishu.module';
import { PrdReviewModule } from './prd-review/prd-review.module';
import { EventHandlerModule } from './event-handler/event-handler.module';
import { AutoTestModule } from './auto-test/auto-test.module';
import { ScheduledTaskModule } from './scheduled-task/scheduled-task.module';

@Module({
  imports: [
    BookModule,
    AiModule,
    SharedModule,
    FeishuModule,
    PrdReviewModule,
    EventHandlerModule,
    AutoTestModule,
    ScheduledTaskModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
