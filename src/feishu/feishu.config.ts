import { ConfigService } from '@nestjs/config';
import { Client } from '@larksuiteoapi/node-sdk';

// 创建飞书客户端（单例）
export const createFeishuClient = (configService: ConfigService) => {
  return new Client({
    appId: configService.get('FEISHU_APP_ID') as string,
    appSecret: configService.get('FEISHU_APP_SECRET') as string,
    // 测试企业用国内环境
    domain: 'https://open.feishu.cn',
  });
};

// 导出供依赖注入使用
export const FEISHU_CLIENT = 'FEISHU_CLIENT';