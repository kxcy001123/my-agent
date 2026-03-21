## Context

当前项目是一个 NestJS 应用，已集成飞书消息监听和 AI 能力：
- **FeishuService**: 通过 WebSocket 长连接接收飞书消息事件
- **EventHandlerService**: 路由分发不同类型的消息指令
- **FeishuDocService**: 解析飞书文档内容
- **AiService**: 基于 LangChain 的 AI 服务

现有架构支持"评审"指令触发 PRD 评审流程。本次设计在此基础上新增"测试"指令，触发自动化测试流程。

## Goals / Non-Goals

**Goals:**
- 实现飞书消息触发自动化测试的完整流程
- 使用 AI 解析自由文本格式的测试步骤
- 支持 30+ 种 Playwright 操作类型
- 支持非 headless 模式便于观察测试过程
- 测试结果通过飞书消息回复

**Non-Goals:**
- 不支持测试用例持久化存储
- 不支持测试历史记录查询
- 不支持并发执行多个测试用例
- 不支持测试结果截图上传到飞书

## Decisions

### 1. 模块结构设计

**决策**: 创建独立的 AutoTestModule，包含三个核心服务

**理由**: 
- 遵循单一职责原则，每个服务专注一个功能
- 便于测试和维护
- 与现有 PrdReviewModule 结构保持一致

**模块结构**:
```
src/auto-test/
├── auto-test.module.ts
├── auto-test.service.ts          # 主服务，协调流程
├── test-step-parser.service.ts   # AI 解析测试步骤
├── playwright.service.ts         # Playwright 封装
├── dto/
│   └── test-step.dto.ts          # 测试步骤数据结构
└── interfaces/
    └── test-result.interface.ts  # 测试结果接口
```

### 2. AI 解析策略

**决策**: 使用 LangChain + Prompt Engineering 解析自由文本

**理由**:
- 复用现有 AiService 基础设施
- 通过精心设计的 Prompt 将自然语言转换为结构化 JSON
- 无需额外的 NLP 模型或服务

**Prompt 设计要点**:
- 明确列出所有支持的操作类型
- 提供操作类型的详细说明
- 要求输出结构化 JSON 格式

### 3. Playwright 配置策略

**决策**: 通过环境变量配置，默认非 headless 模式

**理由**:
- 非 headless 模式便于开发调试和观察测试过程
- 环境变量配置灵活，可根据部署环境调整
- 支持 slowMo 延迟，便于观察操作步骤

**配置项**:
| 变量 | 默认值 | 说明 |
|------|--------|------|
| PLAYWRIGHT_HEADLESS | false | 是否无头模式 |
| PLAYWRIGHT_TIMEOUT | 30000 | 操作超时(ms) |
| PLAYWRIGHT_SLOW_MO | 100 | 操作延迟(ms) |
| PLAYWRIGHT_BROWSER | chromium | 浏览器类型 |

### 4. 错误处理策略

**决策**: 步骤失败时继续执行，收集所有失败信息

**理由**:
- 一次性发现所有问题，提高调试效率
- 失败时自动截图，便于问题定位
- 最终报告包含所有步骤的执行状态

## Risks / Trade-offs

### Risk 1: AI 解析准确性
- **风险**: 自由文本解析可能存在歧义，导致测试步骤解析错误
- **缓解**: 设计详细的 Prompt，包含操作类型说明和示例；对解析结果进行验证

### Risk 2: 选择器稳定性
- **风险**: CSS 选择器可能因页面结构变化而失效
- **缓解**: Prompt 中引导使用语义化选择器（如 data-testid）；失败时截图便于调试

### Risk 3: 执行时间
- **风险**: 测试可能耗时较长，影响用户体验
- **缓解**: 复用现有异步消息处理机制；先回复"正在执行测试"，完成后发送结果

### Risk 4: 资源消耗
- **风险**: Playwright 启动浏览器消耗资源
- **缓解**: 测试完成后立即关闭浏览器；限制并发测试数量（当前设计不支持并发）

### Risk 5: 安全性
- **风险**: 恶意用户可能利用测试功能访问内部系统
- **缓解**: 后续可添加 URL 白名单限制；当前依赖飞书消息的访问控制
