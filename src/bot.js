#!/usr/bin/env node

/**
 * Meeting Transcript Bot - Main Service với Gmail Login
 * Automated Google Meet transcript extraction
 */
require('dotenv').config();
const config = require('../config');
const { chromium } = require('playwright');
const ContentExtractor = require('./content');
const { 
  SELECTORS, 
  SHORTCUTS, 
  TIMING, 
  BROWSER_CONFIG, 
  CONTEXT_CONFIG,
  DEBUG_CONFIG 
} = require('./constants');
const os = require('os');
const path = require('path');

class MeetingBot {
  constructor(credentials = null) {
    this.browser = null;
    this.page = null;
    this.context = null;
    this.tempDir = null;
    this.isRunning = false;
    this.intervals = {};
    this.extractor = new ContentExtractor();
    this.startTime = new Date();
    this.credentials = credentials;
    this.loginAttempts = 0;
    this.maxLoginAttempts = 3;
  }

  // ============================================================
  // 🚀 1. KHỞI TẠO BROWSER - Enhanced with better error handling
  // ============================================================

  async initBrowser() {
    console.log('🚀 Khởi tạo browser session...');
    
    try {
      // Create temporary directory for user data (persistent for login)
      this.tempDir = path.join(os.tmpdir(), `meet-bot-${Date.now()}`);
      
      // Use launchPersistentContext để lưu login session
      this.context = await chromium.launchPersistentContext(this.tempDir, {
        // Browser config
        headless: BROWSER_CONFIG.headless,
        slowMo: BROWSER_CONFIG.slowMo,
        args: [
          ...BROWSER_CONFIG.args,
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        
        // Context config cho login
        ...CONTEXT_CONFIG,
        
        // Persistent storage cho login session
        acceptDownloads: true,
        ignoreHTTPSErrors: true,
        
        // Clear theo từng session thay vì incognito hoàn toàn
        storageState: undefined
      });

      // Get the browser instance
      this.browser = this.context.browser();
      
      // Get existing page or create new one
      const pages = this.context.pages();
      this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

      // Set longer timeouts
      this.page.setDefaultTimeout(TIMING.ELEMENT_TIMEOUT);
      
      // Debug logging
      if (DEBUG_CONFIG.VERBOSE_LOGGING) {
        this.page.on('console', msg => {
          if (msg.type() === 'error') {
            console.log('🔴 Browser error:', msg.text());
          }
        });
      }

      console.log('✅ Browser khởi tạo thành công');
      console.log(`📂 Profile: ${this.tempDir}`);
      
      return true;
    } catch (error) {
      console.error('❌ Lỗi khởi tạo browser:', error.message);
      throw error;
    }
  }

  // ============================================================
  // 🔐 2. LOGIN GMAIL - Simplified and more reliable
  // ============================================================

  async loginToGmail() {
    if (!this.credentials || !this.credentials.email || !this.credentials.password) {
      console.log('⚠️ Không có credentials Gmail - bỏ qua đăng nhập');
      return false;
    }

    console.log('🔐 Đang đăng nhập Gmail...');
    
    try {
      // Check if already logged in
      await this.page.goto('https://accounts.google.com/', { 
        waitUntil: 'networkidle',
        timeout: TIMING.PAGE_LOAD_TIMEOUT 
      });
      
      await this.page.waitForTimeout(2000);
      
      // If we see account info, we're already logged in
      const currentUrl = this.page.url();
      if (currentUrl.includes('myaccount.google.com') || 
          await this.page.$('div[data-ved]') || 
          await this.page.$('a[href*="myaccount"]')) {
        console.log('✅ Đã đăng nhập từ session trước');
        return true;
      }

      // Navigate to Gmail login
      await this.page.goto('https://accounts.google.com/signin/v2/identifier?service=mail&flowName=GlifWebSignIn', { 
        waitUntil: 'networkidle',
        timeout: TIMING.PAGE_LOAD_TIMEOUT
      });
      
      await this.page.waitForTimeout(2000);
      
      // Fill email
      console.log('📧 Nhập email...');
      const emailFilled = await this.fillEmailField();
      if (!emailFilled) {
        throw new Error('Không thể nhập email');
      }
      
      // Click Next for email
      await this.clickNextButton();
      await this.page.waitForTimeout(3000);
      
      // Fill password
      console.log('🔑 Nhập password...');
      const passwordFilled = await this.fillPasswordField();
      if (!passwordFilled) {
        throw new Error('Không thể nhập password');
      }
      
      // Click Next for password
      await this.clickNextButton();
      await this.page.waitForTimeout(5000);
      
      // Handle potential 2FA
      const twoFactorHandled = await this.handle2FA();
      
      // Verify login
      const loginSuccess = await this.verifyLogin();
      
      if (loginSuccess) {
        console.log('✅ Đăng nhập Gmail thành công');
        return true;
      } else {
        throw new Error('Xác thực đăng nhập thất bại');
      }
      
    } catch (error) {
      this.loginAttempts++;
      console.error(`❌ Lỗi đăng nhập (lần ${this.loginAttempts}):`, error.message);
      
      if (this.loginAttempts < this.maxLoginAttempts) {
        console.log('🔄 Thử lại đăng nhập...');
        await this.page.waitForTimeout(2000);
        return await this.loginToGmail();
      } else {
        console.log('⚠️ Đã hết số lần thử đăng nhập - tiếp tục không đăng nhập');
        return false;
      }
    }
  }

  async fillEmailField() {
    const emailSelectors = [
      'input[type="email"]',
      '#identifierId',
      'input[name="identifier"]',
      'input[aria-label*="email"]'
    ];
    
    for (const selector of emailSelectors) {
      try {
        const emailInput = this.page.locator(selector).first();
        if (await emailInput.isVisible({ timeout: 3000 })) {
          await emailInput.clear();
          await emailInput.fill(this.credentials.email);
          await this.page.waitForTimeout(500);
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  async fillPasswordField() {
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      '#password',
      'input[aria-label*="password"]'
    ];
    
    for (const selector of passwordSelectors) {
      try {
        const passwordInput = this.page.locator(selector).first();
        if (await passwordInput.isVisible({ timeout: 5000 })) {
          await passwordInput.clear();
          await passwordInput.fill(this.credentials.password);
          await this.page.waitForTimeout(500);
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  async clickNextButton() {
    const nextButtonSelectors = [
      '#identifierNext',
      '#passwordNext',
      'button:has-text("Next")',
      'button:has-text("Tiếp theo")',
      '[data-button-name="next"]',
      'button[type="submit"]'
    ];
    
    for (const selector of nextButtonSelectors) {
      try {
        const nextButton = this.page.locator(selector).first();
        if (await nextButton.isVisible({ timeout: 3000 })) {
          await nextButton.click();
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  async handle2FA() {
    try {
      // Check for 2FA prompt
      const twoFactorSelectors = [
        'input[type="tel"]',
        'input[aria-label*="code"]',
        'input[name="totpPin"]',
        '[data-error-id="CHALLENGE_REQUIRED"]'
      ];
      
      let requires2FA = false;
      for (const selector of twoFactorSelectors) {
        try {
          if (await this.page.locator(selector).isVisible({ timeout: 2000 })) {
            requires2FA = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (requires2FA) {
        console.log('⚠️ Tài khoản yêu cầu 2FA. Vui lòng xác thực thủ công trong 120 giây...');
        console.log('📱 Kiểm tra điện thoại và nhập mã xác thực');
        
        // Wait for user to complete 2FA manually
        let waitCount = 0;
        while (waitCount < 120) {
          await this.page.waitForTimeout(1000);
          
          const currentUrl = this.page.url();
          if (currentUrl.includes('myaccount.google.com') || 
              currentUrl.includes('accounts.google.com/b/') ||
              await this.page.$('div[data-ved]')) {
            console.log('✅ 2FA hoàn tất');
            return true;
          }
          
          waitCount++;
        }
        
        console.log('⏰ 2FA timeout - tiếp tục...');
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('📝 Không có 2FA, tiếp tục...');
      return true;
    }
  }

  // ============================================================
  // ✅ 3. VERIFY LOGIN - Improved validation
  // ============================================================

  async verifyLogin() {
    try {
      // Wait for potential redirects
      await this.page.waitForTimeout(3000);
      
      // Check for common post-login indicators
      const currentUrl = this.page.url();
      
      // Success indicators
      if (currentUrl.includes('myaccount.google.com') || 
          currentUrl.includes('accounts.google.com/b/') ||
          await this.page.$('div[data-ved]') ||
          await this.page.$('a[href*="myaccount"]')) {
        return true;
      }
      
      // Check for login errors
      const errorSelectors = [
        '[data-error-id]',
        '.LXRPh',
        '[role="alert"]',
        'div:has-text("Wrong password")',
        'div:has-text("Couldn\'t find your Google Account")'
      ];
      
      for (const selector of errorSelectors) {
        try {
          const errorElement = this.page.locator(selector).first();
          if (await errorElement.isVisible({ timeout: 2000 })) {
            const errorText = await errorElement.textContent();
            console.log(`⚠️ Login error: ${errorText}`);
            return false;
          }
        } catch (e) {
          continue;
        }
      }
      
      // If no clear success or error, assume ok and continue
      console.log('⚠️ Login status unclear - continuing...');
      return true;
      
    } catch (error) {
      console.log('⚠️ Verify login error:', error.message);
      return true; // Continue anyway
    }
  }

  // ============================================================
  // 🔗 4. VÀO MEETING LINK - Enhanced meeting join flow
  // ============================================================

  async joinMeeting(meetingUrl, botName) {
    console.log('🔗 Vào meeting link...');
    
    try {
      await this.page.goto(meetingUrl, { 
        waitUntil: 'networkidle',
        timeout: TIMING.PAGE_LOAD_TIMEOUT 
      });

      await this.page.waitForTimeout(3000);

      // Check if meeting is blocked
      const isBlocked = await this.checkMeetingBlocked();
      if (isBlocked) {
        throw new Error('❌ Meeting bị chặn - cần quyền từ host');
      }

      // Join flow
      await this.disableMedia();
      await this.fillBotName(botName);
      await this.clickJoinButton();
      
      console.log('⏳ Đang đợi vào meeting...');
      await this.page.waitForTimeout(TIMING.AFTER_JOIN_WAIT);
      
      await this.enableTranscript();
      
      console.log('✅ Đã vào meeting thành công');
      return true;
      
    } catch (error) {
      console.error('❌ Lỗi vào meeting:', error.message);
      throw error;
    }
  }

  async checkMeetingBlocked() {
    try {
      for (const selector of SELECTORS.MEETING_BLOCKED) {
        const element = await this.page.$(selector);
        if (element) {
          console.log('🚫 Phát hiện meeting bị chặn');
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async fillBotName(botName) {
    console.log(`👤 Đặt tên bot: ${botName}`);
    
    for (const selector of SELECTORS.NAME_INPUT) {
      try {
        const input = this.page.locator(selector).first();
        
        if (await input.isVisible({ timeout: 3000 })) {
          await input.clear();
          await input.fill(botName);
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log('✅ Đã đặt tên bot');
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('⚠️ Không thể đặt tên bot - dùng mặc định');
    return false;
  }

  // ============================================================
  // 📷 5. TẮT CAMERA/MIC - Reliable media control
  // ============================================================

  async disableMedia() {
    console.log('📷 Tắt camera và microphone...');

    try {
      // Try disable media shortcut first
      await this.toggleMedia(SELECTORS.DISABLE_MEDIA, 'media shortcut');
      
      // Then individual controls
      await this.toggleMedia(SELECTORS.CAMERA_BUTTON, 'camera');
      await this.toggleMedia(SELECTORS.MIC_BUTTON, 'microphone');
      
      console.log('✅ Đã tắt camera/mic');
      return true;
    } catch (error) {
      console.log('⚠️ Lỗi tắt media:', error.message);
      return false;
    }
  }

  async toggleMedia(selectors, mediaType) {
    for (const selector of selectors) {
      try {
        const button = this.page.locator(selector).first();
        
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log(`🔇 ${mediaType} đã tắt`);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  // ============================================================
  // ✅ 6. JOIN MEETING - Enhanced join button detection
  // ============================================================

  async clickJoinButton() {
    console.log('🚪 Click nút tham gia...');
    
    for (const selector of SELECTORS.JOIN_BUTTON) {
      try {
        const button = this.page.locator(selector).first();
        
        if (await button.isVisible({ timeout: 5000 })) {
          await button.click();
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log('✅ Đã click join');
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Try Ask to join button
    for (const selector of SELECTORS.ASK_TO_JOIN) {
      try {
        const button = this.page.locator(selector).first();
        
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click();
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log('✅ Đã yêu cầu tham gia');
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('⚠️ Không tìm thấy nút join - có thể đã trong meeting');
    return false;
  }

  // ============================================================
  // 📝 7. ENABLE TRANSCRIPT - Better transcript activation
  // ============================================================

  async enableTranscript() {
    console.log('📝 Bật transcript/captions...');
    
    try {
      // Try clicking transcript button
      for (const selector of SELECTORS.TRANSCRIPT_BUTTON) {
        try {
          const button = this.page.locator(selector).first();
          
          if (await button.isVisible({ timeout: 3000 })) {
            await button.click();
            await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
            console.log('✅ Transcript đã bật qua button');
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      // Fallback: keyboard shortcut
      try {
        await this.page.keyboard.press(SHORTCUTS.TOGGLE_CAPTIONS);
        await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
        console.log('✅ Transcript đã bật qua phím tắt');
        return true;
      } catch (error) {
        console.log('⚠️ Không thể bật transcript - cần bật thủ công');
        return false;
      }
    } catch (error) {
      console.log('⚠️ Lỗi enable transcript:', error.message);
      return false;
    }
  }

  // ============================================================
  // 👂 8. MONITOR & EXTRACT TRANSCRIPT - Optimized monitoring
  // ============================================================

  async setupRecording() {
    console.log('👂 Bắt đầu monitor transcript...');
    this.isRunning = true;

    // Start monitoring intervals
    this.intervals.transcript = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.extractor.extractTranscript(this.page);
        await this.extractor.extractChat(this.page);
      } catch (error) {
        if (DEBUG_CONFIG.VERBOSE_LOGGING) {
          console.log('⚠️ Extract error:', error.message);
        }
      }
    }, TIMING.TRANSCRIPT_CHECK_INTERVAL);

    this.intervals.title = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.extractor.updateMeetingTitle(this.page);
      } catch (error) {
        // Silent error
      }
    }, TIMING.TITLE_CHECK_INTERVAL);

    this.intervals.endCheck = setInterval(async () => {
      if (!this.isRunning) return;
      
      await this.checkMeetingEnd();
    }, TIMING.END_CHECK_INTERVAL);

    // Status update interval
    this.intervals.status = setInterval(() => {
      if (!this.isRunning) return;
      
      const stats = this.extractor.getStats();
      process.stdout.write(`\r📊 Live: ${stats.transcriptCount} transcripts, ${stats.chatCount} chats, ${stats.duration}`);
    }, 5000);

    console.log('✅ Monitoring started');
  }

  // ============================================================
  // MAIN FLOW - Streamlined execution
  // ============================================================

  async start(meetingUrl, botName = 'Transcript Bot') {
    try {
      console.log('🤖 Starting Meeting Bot với Gmail Login...');
      console.log(`📅 ${this.startTime.toLocaleString('vi-VN')}`);
      
      // 1. 🚀 Khởi tạo browser
      await this.initBrowser();
      
      // 2. 🔐 Login Gmail (optional)
      if (this.credentials) {
        await this.loginToGmail();
      }
      
      // 3-6. Join meeting flow
      await this.joinMeeting(meetingUrl, botName);
      
      // 7-8. Setup recording
      await this.setupRecording();
      
      console.log('✅ Bot đang hoạt động! Đang ghi transcript...');
      console.log('📝 Monitoring transcript và chat messages');
      console.log('⏹️  Nhấn Ctrl+C để dừng và tải về\n');

    } catch (error) {
      console.error('❌ Bot thất bại:', error.message);
      
      if (DEBUG_CONFIG.SCREENSHOT_ON_ERROR && this.page) {
        await this.takeDebugScreenshot('error');
      }
      
      await this.cleanup();
      throw error;
    }
  }

  // ============================================================
  // SUPPORTING METHODS - Keep existing functionality
  // ============================================================

  async checkMeetingEnd() {
    try {
      if (!this.page || this.page.isClosed()) {
        await this.handleMeetingEnd('Page closed');
        return;
      }

      // Check for meeting end indicators
      for (const selector of SELECTORS.MEETING_END) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await this.handleMeetingEnd('Meeting ended detected');
            return;
          }
        } catch (error) {
          continue;
        }
      }

      // Check if we're still in the meeting URL
      const currentUrl = this.page.url();
      if (!currentUrl.includes('meet.google.com')) {
        await this.handleMeetingEnd('Left meeting URL');
        return;
      }

    } catch (error) {
      await this.handleMeetingEnd('Error checking meeting status');
    }
  }

  async handleMeetingEnd(reason = 'Unknown') {
    if (!this.isRunning) return;
    
    console.log(`\n🔚 Meeting ended: ${reason}`);
    console.log('⏹️  Stopping recording and downloading...');
    
    this.isRunning = false;

    // Clear all intervals
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });

    // Download transcript
    try {
      const filePath = await this.extractor.downloadTranscript();
      console.log('🎉 Meeting transcript saved successfully!');
      
      // Show final stats
      const stats = this.extractor.getStats();
      console.log('\n📊 Final Statistics:');
      console.log(`   📝 Transcripts: ${stats.transcriptCount}`);
      console.log(`   💬 Chat messages: ${stats.chatCount}`);
      console.log(`   ⏱️  Duration: ${stats.duration}`);
      console.log(`   📄 File: ${filePath}`);
      
    } catch (error) {
      console.error('❌ Download failed:', error.message);
      
      // Try to save data to console as backup
      console.log('\n🆘 Backup - Raw data:');
      console.log(JSON.stringify(this.extractor.getTranscriptData(), null, 2));
    }

    await this.cleanup();
  }

  async takeDebugScreenshot(prefix = 'debug') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${prefix}_${timestamp}.png`;
      const screenshotPath = `./${DEBUG_CONFIG.SCREENSHOT_FOLDER}/${filename}`;
      
      await this.page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      console.log(`📸 Debug screenshot: ${screenshotPath}`);
    } catch (error) {
      console.log('⚠️ Could not take screenshot:', error.message);
    }
  }

  async cleanup() {
    try {
      // Clear all intervals
      Object.values(this.intervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      
      // Close context (this also closes browser)
      if (this.context) {
        await this.context.close();
      } else if (this.browser) {
        await this.browser.close();
      }
      
      // Keep temp directory for session persistence
      console.log('🧹 Cleanup completed (login session preserved)');
    } catch (error) {
      console.error('⚠️ Cleanup error:', error.message);
    }
  }

  // ============================================================
  // PUBLIC METHODS
  // ============================================================

  getStats() {
    return this.extractor.getStats();
  }

  async forceStop() {
    await this.handleMeetingEnd('User stopped');
  }

  isActive() {
    return this.isRunning;
  }

  getUptime() {
    return Date.now() - this.startTime.getTime();
  }
}

// ============================================================
// CLI USAGE với Gmail credentials
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const meetingUrl = args[0];
  const botName = args[1] || 'Meeting Transcript Bot';

  // Validate arguments
  if (!meetingUrl) {
    console.log('❌ Error: Meeting URL is required\n');
    console.log('📖 Usage:');
    console.log('   node src/bot.js "https://meet.google.com/your-link"');
    console.log('   node src/bot.js "https://meet.google.com/your-link" "Custom Bot Name"');
    console.log('\n💡 Examples:');
    console.log('   node src/bot.js "https://meet.google.com/abc-defg-hij"');
    console.log('   node src/bot.js "https://meet.google.com/abc-defg-hij" "Daily Standup Bot"');
    console.log('\n🔐 Gmail Login:');
    console.log('   Set credentials in environment variables:');
    console.log('   GMAIL_EMAIL=your@gmail.com GMAIL_PASSWORD=app-password node src/bot.js "meeting-url"');
    process.exit(1);
  }

  if (!meetingUrl.includes('meet.google.com')) {
    console.log('❌ Error: Invalid Google Meet URL');
    console.log('💡 URL must contain "meet.google.com"');
    process.exit(1);
  }

  // Get Gmail credentials from environment
  const credentials = {
    email: config.gmail.email,
    password: config.gmail.password
  };

  // Check if credentials are provided
  const hasCredentials = credentials.email && credentials.password;
  console.log('TODO: ',hasCredentials);

  // Display startup info
  console.log('\n🤖 Meeting Transcript Bot v2.0.0 với Gmail Login');
  console.log('=======================================================');
  console.log(`🎯 Meeting: ${meetingUrl}`);
  console.log(`👤 Bot Name: ${botName}`);
  console.log(`🔐 Gmail Login: ${hasCredentials ? '✅ Enabled' : '❌ Disabled (no credentials)'}`);
  if (hasCredentials) {
    console.log(`📧 Email: ${credentials.email}`);
  }
  console.log(`📅 Started: ${new Date().toLocaleString('vi-VN')}\n`);

  const bot = new MeetingBot(hasCredentials ? credentials : null);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️  User requested stop (Ctrl+C)');
    await bot.forceStop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error('\n💥 Unexpected error:', error.message);
    
    if (DEBUG_CONFIG.VERBOSE_LOGGING) {
      console.error(error.stack);
    }
    
    try {
      await bot.cleanup();
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
    
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('\n💥 Unhandled promise rejection:', reason);
    
    try {
      await bot.cleanup();
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
    
    process.exit(1);
  });

  // Start the bot
  try {
    await bot.start(meetingUrl, botName);
  } catch (error) {
    console.error('\n❌ Failed to start bot:', error.message);
    process.exit(1);
  }
}

// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = MeetingBot;

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}