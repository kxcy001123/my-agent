## ADDED Requirements

### Requirement: mentionIds 传递
系统 SHALL 支持从飞书消息处理器到 AI 服务的 mentionIds 传递，确保回复消息时能够@到所有被 mention 的人。

#### Scenario: 消息中包含 mention 人员
- **WHEN** 飞书消息中包含 mention 标签（如 `<at user_id="xxx"></at>`）
- **THEN** 系统提取所有被 mention 人员的 open_id 列表，并传递给 AI 服务

#### Scenario: 消息中没有 mention 人员
- **WHEN** 飞书消息中不包含任何 mention 标签
- **THEN** mentionIds 为空数组，不影响正常消息处理

### Requirement: AI 回复时@mention 人员
系统 SHALL 支持 AI 在回复消息时，根据 mentionIds 列表@到所有被 mention 的人。

#### Scenario: AI 回复包含@mention 人员
- **WHEN** AI 生成回复消息且 mentionIds 列表非空
- **THEN** 回复消息开头包含所有被 mention 人员的 `<at user_id="xxx"></at>` 标签

#### Scenario: AI 回复没有 mention 人员
- **WHEN** mentionIds 列表为空
- **THEN** 回复消息不包含任何@标签，正常发送

### Requirement: 飞书消息发送支持多人@
系统 SHALL 支持在发送飞书消息时，同时@多个人。

#### Scenario: 发送消息@多个人
- **WHEN** 需要@多个人时
- **THEN** 消息开头拼接多个 `<at user_id="xxx"></at>` 标签，每个标签对应一个人

#### Scenario: 发送消息只@一个人
- **WHEN** 只需要@一个人时
- **THEN** 消息开头只包含一个 `<at user_id="xxx"></at>` 标签
