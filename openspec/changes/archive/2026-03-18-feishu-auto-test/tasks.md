## 1. 基础结构

- [x] 1.1 创建 AutoTestModule 模块文件
- [x] 1.2 创建测试步骤 DTO (test-step.dto.ts)
- [x] 1.3 创建测试结果接口 (test-result.interface.ts)
- [x] 1.4 添加 Playwright 依赖到 package.json

## 2. 核心服务实现

- [x] 2.1 实现 PlaywrightService - 浏览器操作封装
- [x] 2.2 实现 TestStepParserService - AI 解析测试步骤
- [x] 2.3 实现 AutoTestService - 协调测试执行流程

## 3. 集成现有模块

- [x] 3.1 修改 EventHandlerService - 添加"测试"关键字处理
- [x] 3.2 在 AppModule 中导入 AutoTestModule
- [x] 3.3 配置环境变量示例

## 4. 测试和调试

- [x] 4.1 编写 PlaywrightService 单元测试
- [x] 4.2 编写 TestStepParserService 单元测试
- [x] 4.3 端到端测试：发送飞书测试消息
- [x] 4.4 调试和优化 AI 解析 Prompt
