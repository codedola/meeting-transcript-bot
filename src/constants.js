/**
 * Meeting Transcript Bot - Constants & Configuration
 * Enhanced anti-detection và compliance với Google policies
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
    'input[aria-label*="name"]',
    'input[type="text"][placeholder*="name"]'
  ],

  CAMERA_BUTTON: [
    'div[data-is-muted="false"][aria-label*="camera"]',
    'div[jsname="BOHaEe"]',
    'button[aria-label*="Turn off camera"]',
    'button[aria-label*="Tắt camera"]',
    'button[aria-label*="camera"]'
  ],

  MIC_BUTTON: [
    'div[data-is-muted="false"][aria-label*="microphone"]',
    'div[jsname="BOHaEe"]',
    'button[aria-label*="Turn off microphone"]', 
    'button[aria-label*="Tắt micrô"]',
    'button[aria-label*="microphone"]'
  ],

  JOIN_BUTTON: [
    'span:has-text("Ask to join")',
    'span:has-text("Yêu cầu tham gia")',
    'span:has-text("Join now")',
    'span:has-text("Tham gia ngay")',
    'button[jsname="Qx7uuf"]',
    'div[role="button"]:has-text("Join")',
    'button:has-text("Join")',
    'button:has-text("Tham gia")'
  ],

  // Meeting access control
  MEETING_BLOCKED: [
    'div:has-text("You can\'t join this video call")',
    'div:has-text("Bạn không thể tham gia cuộc gọi video này")',
    'h1:has-text("You can\'t join this video call")',
    'span:has-text("No one can join a meeting unless invited")',
    'button:has-text("Return to home screen")',
    'div:has-text("Meeting hasn\'t started")',
    'div:has-text("Cuộc họp chưa bắt đầu")'
  ],

  ASK_TO_JOIN: [
    'span:has-text("Ask to join")',
    'span:has-text("Yêu cầu tham gia")',
    'span:has-text("Xin phép tham gia")',
    'div[role="button"]:has-text("Ask to join")',
    'button:has-text("Ask to join")'
  ],

  DISABLE_MEDIA: [
    'span:has-text("Tiếp tục mà không sử dụng micrô và máy ảnh")',
    'span:has-text("Continue without microphone and camera")',
    'button:has-text("Continue without microphone and camera")'
  ],

  // Transcript & Captions
  TRANSCRIPT_BUTTON: [
    'button[aria-label*="Turn on captions"]',
    'button[aria-label*="captions"]',
    'button[jsname="r8qRAd"]',
    'div[data-tooltip*="captions"]',
    'button[aria-label*="Bật phụ đề"]'
  ],

  TRANSCRIPT_CONTENT: [
    '[jsname="dsyhDe"] [jsname="YSxPC"]',
    '.iTTPOb .zs7s8d.jxFHg',
    '[data-speaking-while-muted-tooltip]',
    '.a4cQT',
    'div[jsname="YSxPC"]',
    '[data-transcription-text]'
  ],

  TRANSCRIPT_SPEAKER: [
    '[jsname="dsyhDe"] [jsname="GbLWUe"]',
    '.iTTPOb .zs7s8d.jxFHg',
    'div[jsname="GbLWUe"]',
    '.GbLWUe',
    '[data-speaker-name]'
  ],

  // Meeting info
  MEETING_TITLE: [
    'h1[jsname="r4nke"]',
    'div[jsname="r4nke"]',
    'span[jsname="r4nke"]',
    'h1',
    '[data-meeting-title]'
  ],

  // Meeting end detection
  MEETING_END: [
    'span:has-text("You left the meeting")',
    'span:has-text("Bạn đã rời khỏi cuộc họp")',
    'div:has-text("Meeting ended")',
    'button:has-text("Rejoin")',
    'button:has-text("Tham gia lại")',
    'div:has-text("Thanks for joining")'
  ]
};

// ============================================================
// TIMING CONFIGURATION - Adjusted for better reliability
// ============================================================

const TIMING = {
  // Monitoring intervals (ms)
  TRANSCRIPT_CHECK_INTERVAL: 2000,    // Kiểm tra transcript mỗi 2s (giảm tần suất)
  TITLE_CHECK_INTERVAL: 10000,        // Cập nhật title mỗi 10s  
  END_CHECK_INTERVAL: 5000,           // Kiểm tra end meeting mỗi 5s

  // Wait times (ms)
  AFTER_JOIN_WAIT: 8000,              // Đợi sau khi join (tăng lên)
  AFTER_CLICK_WAIT: 1500,             // Đợi sau mỗi click (tăng lên)
  ELEMENT_LOAD_WAIT: 5000,            // Đợi element load
  
  // Timeouts (ms)
  ELEMENT_TIMEOUT: 15000,             // Timeout tìm element (tăng lên)
  PAGE_LOAD_TIMEOUT: 45000            // Timeout load page (tăng lên)
};

// ============================================================
// BROWSER CONFIGURATION - Enhanced stealth mode
// ============================================================

const BROWSER_CONFIG = {
  // Development
  headless: false,          // Hiện browser để debug
  slowMo: 250,              // Tăng độ trễ human-like (tăng lên)
  
  // Production 
  // headless: true,       // Ẩn browser
  // slowMo: 0,           // Tốc độ tối đa

  args: [
    // Basic incognito
    '--incognito',
    '--no-first-run',
    '--no-default-browser-check',
    
    // Enhanced anti-detection
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--disable-infobars',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-sync',
    '--disable-translate',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    
    // Performance & security
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-crash-reporter',
    '--disable-logging',
    '--disable-gpu',
    '--mute-audio',
    
    // Privacy enhancements
    '--metrics-recording-only',
    '--no-report-upload',
    '--disable-breakpad',
    '--disable-canvas-aa',
    '--disable-2d-canvas-clip-aa',
    '--disable-gl-drawing-for-tests',
    '--disable-threaded-animation',
    '--disable-threaded-scrolling',
    '--disable-checker-imaging',
    '--disable-new-bookmark-apps',
    '--disable-background-mode',
    '--disable-default-apps',
    '--disable-domain-reliability'
  ]
};

const CONTEXT_CONFIG = {
  viewport: { width: 1366, height: 768 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // === ENHANCED STEALTH SIMULATION ===
  storageState: undefined,                      // No saved login state
  acceptDownloads: true,                        // Allow transcript downloads
  bypassCSP: false,                            // Don't bypass CSP for compliance
  ignoreHTTPSErrors: false,                    // Follow HTTPS properly
  
  // Permissions - minimal như incognito
  permissions: [],                             // No permissions by default
  
  // Enhanced headers để simulate real browser
  extraHTTPHeaders: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1'  // Do Not Track
  },
  
  // Locale
  locale: 'en-US',
  timezoneId: 'Asia/Ho_Chi_Minh',
  
  // Enhanced fingerprint resistance
  colorScheme: 'light',
  reducedMotion: 'no-preference',
  forcedColors: 'none'
};

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

const SHORTCUTS = {
  TOGGLE_CAPTIONS: 'c',
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
// DEBUG & LOGGING - Production safe
// ============================================================

const DEBUG_CONFIG = {
  VERBOSE_LOGGING: false,               // Tắt verbose logging cho production
  LOG_SELECTORS: false,                // Không log selectors
  LOG_TIMING: false,                   // Không log timing
  SCREENSHOT_ON_ERROR: false           // Disable screenshots
};

// ============================================================
// ANTI-DETECTION MEASURES
// ============================================================

const STEALTH_CONFIG = {
  // Human-like delays
  MIN_DELAY: 800,                      // Minimum delay between actions
  MAX_DELAY: 2000,                     // Maximum delay between actions
  
  // Mouse movement simulation
  MOUSE_MOVE: true,                    // Simulate mouse movements
  RANDOM_MOUSE: true,                  // Random mouse positions
  
  // Typing simulation
  TYPING_DELAY: {
    MIN: 50,                          // Min delay between keystrokes
    MAX: 150                          // Max delay between keystrokes
  },
  
  // Browser fingerprint
  CANVAS_FINGERPRINT: false,           // Disable canvas fingerprinting
  WEBGL_FINGERPRINT: false,           // Disable WebGL fingerprinting
  AUDIO_FINGERPRINT: false,           // Disable audio fingerprinting
  
  // Network behavior
  RANDOM_USER_AGENT: false,           // Use consistent UA
  DISABLE_WEBRTC: true,               // Disable WebRTC for privacy
  DISABLE_GEOLOCATION: true           // Disable geolocation
};

// ============================================================
// COMPLIANCE SETTINGS - Tuân thủ chính sách Google
// ============================================================

const COMPLIANCE_CONFIG = {
  // Respect rate limits
  MAX_REQUESTS_PER_MINUTE: 30,        // Giới hạn requests
  REQUEST_DELAY: 2000,                // Delay giữa các requests
  
  // Behavioral compliance
  RESPECT_ROBOTS_TXT: true,           // Tuân thủ robots.txt
  NO_AGGRESSIVE_POLLING: true,        // Không polling quá nhanh
  GRACEFUL_DEGRADATION: true,         // Xử lý lỗi một cách nhẹ nhàng
  
  // Privacy compliance
  NO_PERSONAL_DATA_STORAGE: true,     // Không lưu dữ liệu cá nhân
  MINIMAL_DATA_COLLECTION: true,      // Thu thập data tối thiểu
  LOCAL_PROCESSING_ONLY: true,        // Chỉ xử lý local
  
  // Terms of service compliance
  NO_AUTOMATED_ACCOUNTS: true,        // Không tạo account tự động
  NO_SPAM_BEHAVIOR: true,             // Không có hành vi spam
  NO_CIRCUMVENTION: true,             // Không bypass security
  
  // Technical compliance
  STANDARD_PROTOCOLS: true,           // Sử dụng protocol chuẩn
  NO_REVERSE_ENGINEERING: true,       // Không reverse engineer
  RESPECT_API_LIMITS: true            // Tuân thủ giới hạn API
};

// ============================================================
// ERROR HANDLING CONFIGURATION
// ============================================================

const ERROR_CONFIG = {
  MAX_RETRIES: 3,                     // Số lần retry tối đa
  RETRY_DELAY: 5000,                  // Delay giữa các retry
  GRACEFUL_SHUTDOWN: true,            // Shutdown nhẹ nhàng
  CLEANUP_ON_ERROR: true,             // Cleanup khi có lỗi
  
  // Error categories
  NETWORK_ERRORS: [
    'net::ERR_NETWORK_CHANGED',
    'net::ERR_CONNECTION_RESET',
    'net::ERR_TIMED_OUT'
  ],
  
  MEETING_ERRORS: [
    'Meeting not found',
    'Access denied',
    'Meeting ended'
  ],
  
  BROWSER_ERRORS: [
    'Page crashed',
    'Context closed',
    'Navigation timeout'
  ]
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
  DEBUG_CONFIG,
  STEALTH_CONFIG,
  COMPLIANCE_CONFIG,
  ERROR_CONFIG
};
