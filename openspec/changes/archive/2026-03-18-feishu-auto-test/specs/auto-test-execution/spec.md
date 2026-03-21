## ADDED Requirements

### Requirement: 用户可以发送"测试"指令触发自动化测试
系统 SHALL 允许用户通过飞书消息发送"测试"指令来触发自动化测试流程。

#### Scenario: 用户发送以"测试"开头的消息
- **WHEN** 用户发送以"测试"开头的飞书消息
- **THEN** 系统识别该消息为自动化测试请求

### Requirement: 系统解析飞书文档中的测试步骤
系统 SHALL 解析飞书文档中的自由文本测试步骤，将其转换为结构化的测试指令。

#### Scenario: 成功解析文档
- **WHEN** 消息中包含有效的飞书文档链接
- **THEN** 系统读取文档内容并使用 AI 解析测试步骤

#### Scenario: 文档链接无效
- **WHEN** 消息中的文档链接格式不正确或无法访问
- **THEN** 系统返回错误提示，要求用户提供有效的文档链接

### Requirement: 系统支持多种 Playwright 操作类型
系统 SHALL 支持 30+ 种 Playwright 操作类型，包括导航、点击、输入、选择、等待、断言、截图等。

#### Scenario: 执行导航操作
- **WHEN** 测试步骤包含 navigate 操作
- **THEN** 系统导航到指定的 URL

#### Scenario: 执行点击操作
- **WHEN** 测试步骤包含 click 操作和 CSS 选择器
- **THEN** 系统点击指定的元素

#### Scenario: 执行输入操作
- **WHEN** 测试步骤包含 fill 操作、选择器和值
- **THEN** 系统在指定元素中输入指定的值

#### Scenario: 执行断言操作
- **WHEN** 测试步骤包含 assert_text 操作
- **THEN** 系统验证元素文本是否与预期值匹配

### Requirement: 系统执行测试并返回结果
系统 SHALL 按顺序执行测试步骤，并将测试结果通过飞书消息回复给用户。

#### Scenario: 测试全部通过
- **WHEN** 所有测试步骤执行成功
- **THEN** 系统返回测试通过报告，包含步骤执行详情

#### Scenario: 测试部分失败
- **WHEN** 部分测试步骤执行失败
- **THEN** 系统返回测试失败报告，包含失败步骤和错误信息

#### Scenario: 测试执行异常
- **WHEN** 测试执行过程中发生异常（如浏览器启动失败）
- **THEN** 系统返回错误信息，提示用户检查配置或重试

### Requirement: 系统支持非 headless 模式
系统 SHALL 支持通过环境变量配置 Playwright 是否以 headless 模式运行。

#### Scenario: 非 headless 模式
- **WHEN** PLAYWRIGHT_HEADLESS 环境变量设置为 false
- **THEN** 系统启动有界面的浏览器，便于观察测试过程

#### Scenario: headless 模式
- **WHEN** PLAYWRIGHT_HEADLESS 环境变量设置为 true
- **THEN** 系统启动无界面的浏览器，节省资源
