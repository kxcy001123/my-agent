import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationScene,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_ENV_KEYS,
} from './notification-policy.types';

/**
 * 消息通知策略服务
 * 
 * 提供统一的消息发送策略查询接口，根据环境变量配置决定各场景是否发送消息
 */
@Injectable()
export class NotificationPolicyService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 检查指定场景是否应该发送消息
   * 
   * @param scene 消息场景
   * @returns true 表示应该发送消息，false 表示静默
   */
  shouldNotify(scene: NotificationScene): boolean {
    const envKey = NOTIFICATION_ENV_KEYS[scene];
    const defaultValue = NOTIFICATION_DEFAULTS[scene];
    
    // 从环境变量读取配置，如果没有配置则使用默认值
    const envValue = this.configService.get<string>(envKey);
    
    if (envValue === undefined || envValue === '') {
      return defaultValue;
    }
    
    // 解析环境变量值（支持 'true', 'false', '1', '0'）
    return envValue.toLowerCase() === 'true' || envValue === '1';
  }

  /**
   * 获取所有场景的通知策略
   * 
   * @returns 所有场景的策略配置
   */
  getAllPolicies(): Record<NotificationScene, boolean> {
    const scenes: NotificationScene[] = [
      'task_created',
      'task_executed',
      'risk_detected',
      'progress_update',
      'user_query',
    ];
    
    return scenes.reduce((acc, scene) => {
      acc[scene] = this.shouldNotify(scene);
      return acc;
    }, {} as Record<NotificationScene, boolean>);
  }
}
