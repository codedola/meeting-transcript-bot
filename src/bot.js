#!/usr/bin/env node

/**
 * Meeting Transcript Bot - Main Service (Incognito Mode)
 * Automated Google Meet transcript extraction
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
    this.tempDir = null;
    this.isRunning = false;
    this.intervals = {};
    this.extractor = new ContentExtractor();
    this.startTime = new Date();
  }

  // ============================================================
  // MAIN FLOW
  // ============================================================

  async start(meetingUrl, botName = 'Transcript Bot') {
    try {
      console.log('🤖 Starting Meeting Bot (Incognito Mode)...');
      console.log(`📅 ${this.startTime.toLocaleString('vi-VN')}`);
      
      await this.initBrowser();
      await this.joinMeeting(meetingUrl, botName);
      await this.setupRecording();
      
      console.log('✅ Bot is active! Recording transcript...');
      console.log('📝 Monitoring transcript and chat messages');
      console.log('⏹️  Press Ctrl+C to stop and download\n');

    } catch (error) {
      console.error('❌ Bot failed:', error.message);
      
      if (DEBUG_CONFIG.SCREENSHOT_ON_ERROR && this.page) {
        await this.takeDebugScreenshot('error');
      }
      
      await this.cleanup();
      throw error;
    }
  }

  async initBrowser() {
    console.log('🌐 Initializing incognito browser session...');
    
    // Create temporary directory for user data
    this.tempDir = path.join(os.tmpdir(), `meet-bot-${Date.now()}`);
    
    // Use launchPersistentContext for incognito mode
    this.context = await chromium.launchPersistentContext(this.tempDir, {
      // Browser config
      headless: BROWSER_CONFIG.headless,
      slowMo: BROWSER_CONFIG.slowMo,
      args: BROWSER_CONFIG.args,
      
      // Context config
      ...CONTEXT_CONFIG
    });

    // Get the browser instance
    this.browser = this.context.browser();
    
    // Get existing page or create new one
    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

    // Set longer timeouts
    this.page.setDefaultTimeout(TIMING.ELEMENT_TIMEOUT);
    
    // Clear any existing data (simulate fresh incognito)
    try {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.context.clearCookies();
    } catch (error) {
      // Silent error - might not be loaded yet
    }

    // Block tracking requests (incognito-like behavior)
    await this.page.route('**/*', (route) => {
      const url = route.request().url();
      
      // Block analytics & tracking
      if (url.includes('analytics') || 
          url.includes('tracking') || 
          url.includes('ads')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Debug logging
    if (DEBUG_CONFIG.VERBOSE_LOGGING) {
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔴 Browser error:', msg.text());
        }
      });
    }

    console.log('✅ Incognito session initialized');
    console.log(`📂 Temp profile: ${this.tempDir}`);
  }

  async joinMeeting(meetingUrl, botName) {
    console.log('🔗 Joining meeting...');
    
    await this.page.goto(meetingUrl, { 
      waitUntil: 'networkidle',
      timeout: TIMING.PAGE_LOAD_TIMEOUT 
    });

    // Check if meeting is blocked
    const isBlocked = await this.checkMeetingBlocked();
    if (isBlocked) {
      throw new Error('❌ Meeting is private and requires host permission. Please:\n' +
                     '1. Contact the meeting host to add you as participant\n' +
                     '2. Use a meeting link with proper permissions\n' +
                     '3. Try joining manually first to get admitted');
    }

    // Check disable media
    await this.disableMedia();
    await this.fillBotName(botName);
    await this.clickJoinButton();
    
    console.log('⏳ Waiting for meeting to load...');
    await this.page.waitForTimeout(TIMING.AFTER_JOIN_WAIT);
    
    await this.enableTranscript();
    
    console.log('✅ Successfully joined meeting');
  }

  // ============================================================
  // MEETING ACCESS CONTROL
  // ============================================================

  async checkMeetingBlocked() {
    try {
      for (const selector of SELECTORS.MEETING_BLOCKED) {
        const element = await this.page.$(selector);
        if (element) {
          console.log('🚫 Detected blocked meeting');
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async requestAdmission() {
    try {
      for (const selector of SELECTORS.ASK_TO_JOIN) {
        const button = this.page.locator(selector).first();
        
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click();
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log('✅ Requested admission');
          return;
        }
      }
    } catch (error) {
      console.log('⚠️ Could not request admission automatically');
    }
  }

  async setupRecording() {
    this.isRunning = true;

    // Start monitoring intervals
    this.intervals.transcript = setInterval(async () => {
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
      try {
        await this.extractor.updateMeetingTitle(this.page);
      } catch (error) {
        // Silent error
      }
    }, TIMING.TITLE_CHECK_INTERVAL);

    this.intervals.endCheck = setInterval(async () => {
      await this.checkMeetingEnd();
    }, TIMING.END_CHECK_INTERVAL);

    // Status update interval
    this.intervals.status = setInterval(() => {
      const stats = this.extractor.getStats();
      process.stdout.write(`\r📊 Live: ${stats.transcriptCount} transcripts, ${stats.chatCount} chats, ${stats.duration}`);
    }, 5000);
  }

  // ============================================================
  // JOIN MEETING HELPERS (keep existing methods)
  // ============================================================

  async fillBotName(botName) {
    console.log(`👤 Setting bot name: ${botName}`);
    
    for (const selector of SELECTORS.NAME_INPUT) {
      try {
        const input = this.page.locator(selector).first();
        
        if (await input.isVisible({ timeout: 3000 })) {
          await input.fill(botName);
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log('✅ Bot name set');
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('⚠️ Could not set bot name - using default');
  }

  async disableMedia() {
    console.log('📹 Disabling camera and microphone...');

    await this.toggleMedia(SELECTORS.DISABLE_MEDIA, 'camera');
    
    // Disable camera
    await this.toggleMedia(SELECTORS.CAMERA_BUTTON, 'camera');
    
    // Disable microphone  
    await this.toggleMedia(SELECTORS.MIC_BUTTON, 'microphone');
    
    console.log('✅ Media disabled');
  }

  async toggleMedia(selectors, mediaType) {
    for (const selector of selectors) {
      try {
        const button = this.page.locator(selector).first();
        
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log(`🔇 ${mediaType} disabled`);
          return;
        }
      } catch (error) {
        continue;
      }
    }
  }

  async clickJoinButton() {
    console.log('🚪 Clicking join button...');
    
    for (const selector of SELECTORS.JOIN_BUTTON) {
      try {
        const button = this.page.locator(selector).first();
        
        if (await button.isVisible({ timeout: 5000 })) {
          await button.click();
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log('✅ Join button clicked');
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('⚠️ Could not find join button - might already be in meeting');
  }

  async enableTranscript() {
    console.log('📝 Enabling transcript/captions...');
    
    // Try clicking transcript button
    for (const selector of SELECTORS.TRANSCRIPT_BUTTON) {
      try {
        const button = this.page.locator(selector).first();
        
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click();
          await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
          console.log('✅ Transcript enabled via button');
          return;
        }
      } catch (error) {
        continue;
      }
    }

    // Fallback: keyboard shortcut
    try {
      await this.page.keyboard.press(SHORTCUTS.TOGGLE_CAPTIONS);
      await this.page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
      console.log('✅ Transcript enabled via keyboard shortcut');
    } catch (error) {
      console.log('⚠️ Could not enable transcript - might need manual activation');
    }
  }

  // ============================================================
  // MEETING END DETECTION (keep existing)
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

  // ============================================================
  // UTILITY METHODS
  // ============================================================

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
      
      // Clean up temporary directory
      if (this.tempDir) {
        try {
          const fs = require('fs').promises;
          await fs.rmdir(this.tempDir, { recursive: true });
          console.log('🗑️  Temp directory cleaned');
        } catch (error) {
          console.log('⚠️ Could not clean temp directory:', error.message);
        }
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
// CLI USAGE (keep existing)
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
  console.log('\n🤖 Meeting Transcript Bot v1.0.0 (Incognito Mode)');
  console.log('=================================================');
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