import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FeishuService } from './feishu/feishu.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启动飞书长连接（EventHandlerService 已在模块初始化时注册事件处理器）
  const feishuService = app.get(FeishuService);
  feishuService.startLongPolling();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
