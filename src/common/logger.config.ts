import { utilities as nestWinstonModuleUtilities, WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// 确保 logs 目录存在
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 自定义格式：将 nestLike 的输出同时写入文件
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, context }) => {
    return `${timestamp} [${context || 'NestJS'}] ${level}: ${message}`;
  }),
);

// 创建共享的 File transport 实例
const fileTransport = new winston.transports.File({
  filename: path.join(logsDir, 'app.log'),
  format: fileFormat,
});

const errorFileTransport = new winston.transports.File({
  filename: path.join(logsDir, 'error.log'),
  level: 'error',
  format: fileFormat,
});

export const winstonConfig: WinstonModuleOptions = {
  level: 'info', // 设置全局日志级别
  transports: [
    // 控制台输出 - 使用 nestLike 格式
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        nestWinstonModuleUtilities.format.nestLike('MyApp', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    // 所有日志写入文件
    fileTransport,
    // 错误日志单独写入文件
    errorFileTransport,
  ],
};
