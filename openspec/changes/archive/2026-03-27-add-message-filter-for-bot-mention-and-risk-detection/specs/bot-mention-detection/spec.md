## ADDED Requirements

### Requirement: Bot mention detection
The system SHALL accurately detect whether the incoming message mentions the bot itself.

#### Scenario: Bot is mentioned in group chat
- **WHEN** user sends a message that includes @bot in a group chat
- **THEN** the system SHALL identify this as a mention event (type='mention')

#### Scenario: Bot is not mentioned
- **WHEN** user sends a message without mentioning the bot
- **THEN** the system SHALL identify this as a private_message event (type='private_message')

#### Scenario: Multiple users mentioned including bot
- **WHEN** user sends a message that mentions multiple users including the bot
- **THEN** the system SHALL correctly identify that the bot was mentioned by checking if bot's open_id exists in mentionIds

### Requirement: Bot identity resolution
The system SHALL obtain and cache the bot's own open_id for accurate mention detection.

#### Scenario: Get bot open_id on startup
- **WHEN** the application starts
- **THEN** the system SHALL call Feishu API to get the bot's open_id and cache it

#### Scenario: Check if bot is in mentionIds
- **WHEN** processing an incoming message with mentionIds array
- **THEN** the system SHALL check if the bot's cached open_id exists in the mentionIds array