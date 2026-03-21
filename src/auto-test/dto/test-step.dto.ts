export enum ActionType {
  // 导航操作
  NAVIGATE = 'navigate',
  GO_BACK = 'go_back',
  GO_FORWARD = 'go_forward',
  REFRESH = 'refresh',

  // 点击操作
  CLICK = 'click',
  DOUBLE_CLICK = 'double_click',
  RIGHT_CLICK = 'right_click',
  HOVER = 'hover',

  // 输入操作
  FILL = 'fill',
  TYPE = 'type',
  CLEAR = 'clear',
  PRESS = 'press',

  // 选择操作
  SELECT = 'select',
  CHECK = 'check',
  UNCHECK = 'uncheck',

  // 等待操作
  WAIT = 'wait',
  WAIT_FOR_SELECTOR = 'wait_for_selector',
  WAIT_FOR_NAVIGATION = 'wait_for_navigation',
  WAIT_FOR_LOAD_STATE = 'wait_for_load_state',

  // 断言验证
  ASSERT_TEXT = 'assert_text',
  ASSERT_VALUE = 'assert_value',
  ASSERT_VISIBLE = 'assert_visible',
  ASSERT_HIDDEN = 'assert_hidden',
  ASSERT_ENABLED = 'assert_enabled',
  ASSERT_DISABLED = 'assert_disabled',
  ASSERT_URL = 'assert_url',
  ASSERT_TITLE = 'assert_title',

  // 截图和录制
  SCREENSHOT = 'screenshot',
  FULL_SCREENSHOT = 'full_screenshot',

  // 高级操作
  DRAG_AND_DROP = 'drag_and_drop',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  DIALOG_ACCEPT = 'dialog_accept',
  DIALOG_DISMISS = 'dialog_dismiss',

  // iframe 操作
  FRAME_SWITCH = 'frame_switch',
  FRAME_EXIT = 'frame_exit',

  // 鼠标操作
  MOUSE_MOVE = 'mouse_move',
  SCROLL = 'scroll',
}

export class TestStepDto {
  action: ActionType;
  selector?: string;
  value?: string;
  description: string;
  timeout?: number;
}

export class TestCaseDto {
  targetUrl: string;
  steps: TestStepDto[];
  description?: string;
}
