## 1. FeishuService 修改

- [x] 1.1 添加 getBotOpenId() 方法，通过飞书 API 获取机器人 open_id 并缓存
- [x] 1.2 添加 isBotMentioned(mentionIds: string[]) 方法，判断是否@了本机器人
- [x] 1.3 修复 eventType 判断逻辑，使用 mentionIds 而非 text.includes('@')

## 2. EventHandlerService 修改

- [x] 2.1 注入 FeishuService 以获取机器人 ID 和判断方法
- [x] 2.2 在 handleWithAI 方法中添加消息过滤逻辑
- [x] 2.3 实现 detectRiskScenario() 方法，检测风险关键词

## 3. 测试验证

- [x] 3.1 编译验证通过
- [ ] 3.2 测试@机器人场景：@机器人时必须回复
- [ ] 3.3 测试风险识别场景：识别到风险时发送消息
- [ ] 3.4 测试普通场景：不@机器人且非风险时静默
- [ ] 3.5 测试多人@场景：确认能正确识别机器人被@