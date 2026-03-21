import { ConfigService } from '@nestjs/config';
import { Client } from '@larksuiteoapi/node-sdk';

// 导出供其他模块使用
export const FEISHU_CLIENT = 'FEISHU_CLIENT';

// 创建飞书客户端（单例）
export const createFeishuClient = (configService: ConfigService) => {
  return new Client({
    appId: configService.get('FEISHU_APP_ID') as string,
    appSecret: configService.get('FEISHU_APP_SECRET') as string,
    domain: 'https://open.feishu.cn',
  });
};
