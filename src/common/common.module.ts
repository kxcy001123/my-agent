import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationPolicyService } from './notification-policy.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationPolicyService],
  exports: [NotificationPolicyService],
})
export class CommonModule {}
