import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FEISHU_CLIENT, createFeishuClient } from './feishu-client.token';
import { FeishuService } from './feishu.service';

// 提供飞书客户端实例
const feishuClientProvider: Provider = {
  provide: FEISHU_CLIENT,
  useFactory: (configService: ConfigService) => createFeishuClient(configService),
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [feishuClientProvider, FeishuService],
  exports: [FeishuService, FEISHU_CLIENT],
})
export class FeishuModule {}
