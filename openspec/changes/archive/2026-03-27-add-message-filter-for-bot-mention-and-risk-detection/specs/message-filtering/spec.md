## ADDED Requirements

### Requirement: Message filtering based on scene
The system SHALL filter AI responses before sending to the group chat based on the message scene.

#### Scenario: Bot is mentioned
- **WHEN** user sends a message that mentions the bot (mentionIds includes bot's open_id)
- **THEN** the AI response SHALL be sent to the group chat

#### Scenario: Risk detected
- **WHEN** the AI response indicates a risk scenario (risk_detected scene)
- **THEN** the AI response SHALL be sent to the group chat

#### Scenario: Regular query without mention
- **WHEN** user sends a regular message without mentioning the bot and it's not a risk scenario
- **THEN** the AI response SHALL NOT be sent to the group chat (silent mode)

### Requirement: Scene detection
The system SHALL detect the scene type from the AI response to determine whether to send.

#### Scenario: Risk scene detection
- **WHEN** AI returns content containing risk-related keywords (风险、资源、时间、依赖、质量等)
- **THEN** the system SHALL identify this as risk_detected scene

#### Scenario: Regular query scene
- **WHEN** AI returns a normal conversational response without risk keywords
- **THEN** the system SHALL identify this as user_query scene