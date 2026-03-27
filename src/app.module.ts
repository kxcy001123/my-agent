import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module'
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@nestjs/config';

import { SharedModule } from './shared/shared.module';
import { CommonModule } from './common/common.module';
import { FeishuModule } from './feishu/feishu.module';
import { PrdReviewModule } from './prd-review/prd-review.module';
import { EventHandlerModule } from './event-handler/event-handler.module';
import { AutoTestModule } from './auto-test/auto-test.module';
import { ScheduledTaskModule } from './scheduled-task/scheduled-task.module';
import { User } from './users/entities/user.entity';


@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'admin',
      database: 'hello',
      synchronize: true,
      connectorPackage: 'mysql2',
      logging: true,
      entities: [User]
    }),
    BookModule,
    AiModule,
    SharedModule,
    CommonModule,
    FeishuModule,
    PrdReviewModule,
    EventHandlerModule,
    AutoTestModule,
    ScheduledTaskModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
