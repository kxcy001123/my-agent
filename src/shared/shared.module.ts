import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FEISHU_CLIENT, createFeishuClient } from './feishu-client.token';
import { FeishuDocService } from './feishu-doc.service';

// 提供飞书客户端实例
const feishuClientProvider: Provider = {
  provide: FEISHU_CLIENT,
  useFactory: (configService: ConfigService) => createFeishuClient(configService),
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [feishuClientProvider, FeishuDocService],
  exports: [FEISHU_CLIENT, FeishuDocService],
})
export class SharedModule {}
