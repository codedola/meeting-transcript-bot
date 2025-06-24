/**
 * Meeting Transcript Bot - Constants & Configuration
 * Tất cả selectors, timing, và config tập trung tại đây
 */

// ============================================================
// SELECTORS - Organized by functionality
// ============================================================

const SELECTORS = {
  // Join meeting flow
  NAME_INPUT: [
    'input[aria-label*="Tên của bạn"]',
    'input[placeholder*="Tên của bạn"]',
    'input[aria-label*="Your name"]',
    'input[placeholder*="Your name"]',
    'input[jsname="YPqjbf"]',
    '#c9',
    'input[aria-label*="Tên của bạn"]'
  ],

  CAMERA_BUTTON: [
    'div[data-is-muted="false"][aria-label*="camera"]',
    'div[jsname="BOHaEe"]',
    'button[aria-label*="Turn off camera"]',
    'button[aria-label*="Tắt camera"]'
  ],

  MIC_BUTTON: [
    'div[data-is-muted="false"][aria-label*="microphone"]',
    'div[jsname="BOHaEe"]',
    'button[aria-label*="Turn off microphone"]', 
    'button[aria-label*="Tắt micrô"]'
  ],

  JOIN_BUTTON: [
    'span:has-text("Ask to join")',
    'span:has-text("Yêu cầu tham gia")',
    'span:has-text("Join now")',
    'span:has-text("Tham gia ngay")',
    'button[jsname="Qx7uuf"]',
    'div[role="button"]:has-text("Join")'
  ],

  // Meeting access control
  MEETING_BLOCKED: [
    'div:has-text("You can\'t join this video call")',
    'div:has-text("Bạn không thể tham gia cuộc gọi video này")',
    'h1:has-text("You can\'t join this video call")',
    'span:has-text("No one can join a meeting unless invited")',
    'button:has-text("Return to home screen")'
  ],

  ASK_TO_JOIN: [
    'button:has-text("Ask to join")',
    'button:has-text("Yêu cầu tham gia")',
    'button:has-text("Xin phép tham gia")',
    'div[role="button"]:has-text("Ask to join")'
  ],

  DISABLE_MEDIA: [
    'span:has-text("Tiếp tục mà không sử dụng micrô và máy ảnh")',
    'span:has-text("Continue without microphone and camera")'
  ],

  // Transcript & Captions
  TRANSCRIPT_BUTTON: [
    'button[aria-label*="Turn on captions"]',
    'button[aria-label*="captions"]',
    'button[jsname="r8qRAd"]',
    'div[data-tooltip*="captions"]'
  ],

  TRANSCRIPT_CONTENT: [
    '[jsname="dsyhDe"] [jsname="YSxPC"]',
    '.iTTPOb .zs7s8d.jxFHg',
    '[data-speaking-while-muted-tooltip]',
    '.a4cQT',
    'div[jsname="YSxPC"]'
  ],

  TRANSCRIPT_SPEAKER: [
    '[jsname="dsyhDe"] [jsname="GbLWUe"]',
    '.iTTPOb .zs7s8d.jxFHg',
    'div[jsname="GbLWUe"]',
    '.GbLWUe'
  ],

  // Chat messages
  CHAT_TOGGLE: [
    'button[aria-label*="Chat"]',
    'button[aria-label*="Trò chuyện"]',
    'div[data-tooltip*="Chat"]'
  ],

  CHAT_MESSAGES: [
    'div[jsname="b0t70b"]',
    '.z38b6',
    'div[data-sender-name]'
  ],

  CHAT_SENDER: [
    'div[jsname="GbLWUe"]',
    '.GbLWUe',
    'span[data-sender-name]'
  ],

  CHAT_TEXT: [
    'div[jsname="YSxPC"]',
    '.YSxPC'
  ],

  // Meeting info
  MEETING_TITLE: [
    'h1[jsname="r4nke"]',
    'div[jsname="r4nke"]',
    'span[jsname="r4nke"]',
    'h1',
    'title'
  ],

  // Meeting end detection
  MEETING_END: [
    'span:has-text("You left the meeting")',
    'span:has-text("Bạn đã rời khỏi cuộc họp")',
    'div:has-text("Meeting ended")',
    'button:has-text("Rejoin")',
    'button:has-text("Tham gia lại")'
  ]
};

// ============================================================
// TIMING CONFIGURATION
// ============================================================

const TIMING = {
  // Monitoring intervals (ms)
  TRANSCRIPT_CHECK_INTERVAL: 1000,    // Kiểm tra transcript mỗi 1s
  TITLE_CHECK_INTERVAL: 5000,         // Cập nhật title mỗi 5s  
  END_CHECK_INTERVAL: 3000,           // Kiểm tra end meeting mỗi 3s

  // Wait times (ms)
  AFTER_JOIN_WAIT: 5000,              // Đợi sau khi join
  AFTER_CLICK_WAIT: 1000,             // Đợi sau mỗi click
  ELEMENT_LOAD_WAIT: 3000,            // Đợi element load
  
  // Timeouts (ms)
  ELEMENT_TIMEOUT: 10000,             // Timeout tìm element
  PAGE_LOAD_TIMEOUT: 30000            // Timeout load page
};

// ============================================================
// BROWSER CONFIGURATION - INCOGNITO MODE
// ============================================================

const BROWSER_CONFIG = {
  // Development
  headless: false,          // Hiện browser để debug
  slowMo: 200,              // Tăng độ trễ human-like
  
  // Production 
  // headless: true,       // Ẩn browser
  // slowMo: 0,           // Tốc độ tối đa

  args: [
    '--incognito',
    '--no-first-run',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=VizDisplayCompositor',
    
    // Thêm human-like flags:
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection'
  ]
};

const CONTEXT_CONFIG = {
  viewport: { width: 1280, height: 720 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // === INCOGNITO SIMULATION ===
  storageState: undefined,                      // No saved login state
  acceptDownloads: false,                       // Security like incognito
  bypassCSP: true,                             // Bypass content security policy
  ignoreHTTPSErrors: true,                     // Ignore SSL errors
  
  // Permissions - minimal như incognito
  permissions: ['microphone', 'camera'],
  
  // Clear headers để simulate fresh session
  extraHTTPHeaders: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'DNT': '1'  // Do Not Track
  },
  
  // Locale
  locale: 'en-US',
  timezoneId: 'Asia/Ho_Chi_Minh'
};

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

const SHORTCUTS = {
  TOGGLE_CAPTIONS: 'c',
  TOGGLE_CHAT: 'Control+Alt+c',
  TOGGLE_MIC: 'd',
  TOGGLE_CAMERA: 'e',
  LEAVE_MEETING: 'Control+d'
};

// ============================================================
// FILE EXPORT SETTINGS
// ============================================================

const EXPORT_CONFIG = {
  ENCODING: 'utf8',
  FOLDER: 'Downloads',  // Relative to user home
  
  // File naming
  FILENAME_PREFIX: 'Transcript',
  TIMESTAMP_FORMAT: 'vi-VN',
  
  // Content formatting
  HEADER_SEPARATOR: '================================',
  SECTION_SEPARATOR: '\n\n',
  
  // Backup settings
  BACKUP_FOLDER: 'Documents/MeetingTranscripts',
  AUTO_BACKUP: true
};

// ============================================================
// DEBUG & LOGGING
// ============================================================

const DEBUG_CONFIG = {
  VERBOSE_LOGGING: true,
  LOG_SELECTORS: false,
  LOG_TIMING: false,
  SCREENSHOT_ON_ERROR: true,
  SCREENSHOT_FOLDER: 'debug-screenshots'
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  SELECTORS,
  TIMING,
  BROWSER_CONFIG,
  CONTEXT_CONFIG,
  SHORTCUTS,
  EXPORT_CONFIG,
  DEBUG_CONFIG
};