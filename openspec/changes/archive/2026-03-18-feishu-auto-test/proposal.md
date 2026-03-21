## Why

当前项目已支持通过飞书消息触发 PRD 评审功能，但缺乏自动化测试能力。测试人员需要手动执行测试用例，效率低下且容易遗漏。通过飞书消息触发自动化测试，可以让测试人员直接在飞书中编写测试用例文档，系统自动解析并执行，大幅提升测试效率和覆盖率。

## What Changes

- 新增飞书消息指令：以"测试"开头的消息将触发自动化测试流程
- 新增 AutoTestModule 模块，包含以下核心服务：
  - TestStepParserService：使用 AI 解析飞书文档中的自由文本测试步骤
  - PlaywrightService：封装 Playwright 浏览器自动化操作
  - AutoTestService：协调测试执行流程
- 支持 30+ 种 Playwright 操作类型（导航、点击、输入、断言、截图等）
- 支持非 headless 模式，便于观察测试过程
- 测试结果通过飞书消息回复

## Capabilities

### New Capabilities

- `auto-test-execution`: 飞书消息触发的自动化测试执行能力，包括解析测试文档、执行 Playwright 操作、返回测试报告

### Modified Capabilities

- `event-handler`: 扩展事件处理器，新增"测试"关键字路由

## Impact

- **新增模块**: `src/auto-test/` 目录
- **修改文件**: `src/event-handler/event-handler.service.ts` 添加测试指令处理
- **新增依赖**: `playwright`, `playwright-core`
- **环境变量**: 新增 `PLAYWRIGHT_HEADLESS`, `PLAYWRIGHT_TIMEOUT`, `PLAYWRIGHT_SLOW_MO` 等配置
