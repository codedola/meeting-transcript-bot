#!/usr/bin/env node

/**
 * Meeting Transcript Bot - Main Service (Simplified)
 * Automated Google Meet transcript extraction without Gmail login
 */
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
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
    this.isRunning = false;
    this.intervals = {};
    this.extractor = new ContentExtractor();
    this.startTime = new Date();
  }

  // ============================================================
  // 🚀 1. KHỞI TẠO BROWSER - Enhanced anti-detection
  // ============================================================

  async initBrowser() {
    console.log('🚀 Khởi tạo browser session...');
    
    try {
      // Launch browser with enhanced stealth
      this.browser = await chromium.launch({
        // Browser config
        headless: BROWSER_CONFIG.headless,
        slowMo: BROWSER_CONFIG.slowMo,
        args: [
          ...BROWSER_CONFIG.args,
          // Enhanced anti-detection
          '--disable-blink-features=AutomationControlled',
          '--exclude-switches=enable-automation',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-report-upload',
          '--disable-crash-reporter',
          '--mute-audio'
        ]
      });

      // Create new context with enhanced stealth
      this.context = await this.browser.newContext({
        ...CONTEXT_CONFIG,
        
        // Enhanced stealth
        acceptDownloads: true,
        ignoreHTTPSErrors: false,
        storageState: undefined
      });

      // Create new page
      this.page = await this.context.newPage();

      // Set longer timeouts
      this.page.setDefaultTimeout(TIMING.ELEMENT_TIMEOUT);
      
      // Enhanced stealth - Remove webdriver property
      await this.page.addInitScript(() => {
        // Remove automation indicators
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Mock chrome extension
        window.chrome = {
          runtime: {},
        };
        
        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );

        // Remove automation signals
        delete window.__webdriver_script_fn;
        delete window.__webdriver_evaluate;
        delete window.__selenium_unwrapped;
        delete window.__fxdriver_unwrapped;
        delete window.__driver_evaluate;
        delete window.__webdriver_evaluate__;
        delete window.__selenium_evaluate;
        delete window.__fxdriver_evaluate;
        delete window.__driver_unwrapped;
        delete window.__webdriver_unwrapped;
        delete window.__webdriver_script_func;
        
        // Override plugins length
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Override languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });

      // Debug logging
      if (DEBUG_CONFIG.VERBOSE_LOGGING) {
        this.page.on('console', msg => {
          if (msg.type() === 'error') {
            console.log('🔴 Browser error:', msg.text());
          }
        });
      }

      console.log('✅ Browser khởi tạo thành công');
      
      return true;
    } catch (error) {
      console.error('❌ Lỗi khởi tạo browser:', error.message);
      throw error;
    }
  }

  // ============================================================
  // 🔗 2. VÀO MEETING LINK - Enhanced meeting join flow
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

      // await this.enableTranscript();
      
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
  // 📷 3. TẮT CAMERA/MIC - Reliable media control
  // ============================================================

  async disableMedia() {
    console.log('📷 Tắt camera và microphone...');

    try {
      // Try disable media shortcut first
      await this.toggleMedia(SELECTORS.DISABLE_MEDIA, 'media shortcut');
      
      // Then individual controls
      // await this.toggleMedia(SELECTORS.CAMERA_BUTTON, 'camera');
      // await this.toggleMedia(SELECTORS.MIC_BUTTON, 'microphone');
      
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
  // ✅ 4. JOIN MEETING - Enhanced join button detection
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
  // 📝 5. ENABLE TRANSCRIPT - Better transcript activation
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
  // 👂 6. MONITOR & EXTRACT TRANSCRIPT - Optimized monitoring
  // ============================================================

  async setupRecording() {
    console.log('👂 Bắt đầu monitor transcript...');
    this.isRunning = true;

    // Start monitoring intervals
    this.intervals.transcript = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.extractor.extractTranscript(this.page);
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
      process.stdout.write(`\r📊 Live: ${stats.transcriptCount} transcripts, ${stats.duration}`);
    }, 5000);

    console.log('✅ Monitoring started');
  }

  // ============================================================
  // MAIN FLOW - Streamlined execution
  // ============================================================

  async start(meetingUrl, botName = 'Transcript Bot') {
    try {
      console.log('🤖 Starting Meeting Bot...');
      console.log(`📅 ${this.startTime.toLocaleString('vi-VN')}`);
      
      // 1. 🚀 Khởi tạo browser
      await this.initBrowser();
      
      // 2. Join meeting flow
      await this.joinMeeting(meetingUrl, botName);
      
      // 3. Setup recording
      await this.setupRecording();
      
      console.log('✅ Bot đang hoạt động! Đang ghi transcript...');
      console.log('📝 Monitoring transcript messages');
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
  // SUPPORTING METHODS
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
      
      // Close page first
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
      
      // Close context
      if (this.context) {
        await this.context.close();
      }
      
      // Close browser
      if (this.browser) {
        await this.browser.close();
      }
      
      console.log('🧹 Cleanup completed');
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
// CLI USAGE - Simplified
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
    process.exit(1);
  }

  if (!meetingUrl.includes('meet.google.com')) {
    console.log('❌ Error: Invalid Google Meet URL');
    console.log('💡 URL must contain "meet.google.com"');
    process.exit(1);
  }

  // Display startup info
  console.log('\n🤖 Meeting Transcript Bot v2.1.0 - Simplified');
  console.log('=======================================================');
  console.log(`🎯 Meeting: ${meetingUrl}`);
  console.log(`👤 Bot Name: ${botName}`);
  console.log(`📅 Started: ${new Date().toLocaleString('vi-VN')}\n`);

  const bot = new MeetingBot();

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