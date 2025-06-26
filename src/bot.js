const { chromium } = require('playwright');
const readline = require('readline');

// Enhanced selector configuration
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

  DISABLE_MEDIA: [
    'span:has-text("Tiếp tục mà không sử dụng micrô và máy ảnh")',
    'span:has-text("Continue without microphone and camera")',
    'button:has-text("Continue without microphone and camera")'
  ],

  // Meeting access control
  MEETING_BLOCKED: [
    'div:has-text("You can\'t join this video call")',
    'div:has-text("Bạn không thể tham gia cuộc gọi video này")',
    'h1:has-text("You can\'t join this video call")',
    'span:has-text("No one can join a meeting unless invited")',
    'button:has-text("Return to home screen")',
    'div:has-text("Meeting hasn\'t started")',
    'div:has-text("Cuộc họp chưa bắt đầu")',
    'div:has-text("Your meeting is safe")',
    'div:has-text("No one can join a meeting unless invited or admitted by the host")'
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

// Enhanced timing configuration
const TIMING = {
  AFTER_JOIN_WAIT: 8000,
  AFTER_CLICK_WAIT: 1500,
  ELEMENT_LOAD_WAIT: 5000,
  ELEMENT_TIMEOUT: 15000,
  PAGE_LOAD_TIMEOUT: 45000
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to wait for a specific time
function waitUntil(targetTime) {
  const now = new Date();
  const waitTime = targetTime.getTime() - now.getTime();
  
  if (waitTime > 0) {
    console.log(`Waiting ${Math.round(waitTime / 1000)} seconds until ${targetTime.toLocaleTimeString()}...`);
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }
  return Promise.resolve();
}

// Helper function to try multiple selectors
async function tryMultipleSelectors(page, selectors, timeout = TIMING.ELEMENT_TIMEOUT) {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ timeout: 2000 });
      if (await element.isVisible()) {
        return element;
      }
    } catch (error) {
      // Continue to next selector
      continue;
    }
  }
  return null;
}

// Function to handle name input if required
async function handleNameInput(page) {
  try {
    const nameInput = await tryMultipleSelectors(page, SELECTORS.NAME_INPUT, 5000);
    if (nameInput) {
      await nameInput.fill('Meeting Bot');
      console.log('Name entered.');
      await page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
    }
  } catch (error) {
    console.log('No name input required or found.');
  }
}

// Enhanced function to check if meeting is blocked
async function checkMeetingBlocked(page) {
  try {
    const blockedIndicator = await tryMultipleSelectors(page, SELECTORS.MEETING_BLOCKED, 3000);
    return blockedIndicator !== null;
  } catch (error) {
    return false;
  }
}

// Function to wait for meeting to become available with enhanced retry
async function waitForMeetingAccess(page, maxRetries = 20) {
  console.log(`Waiting for meeting access (max ${maxRetries} retries)...`);
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    retryCount++;
    console.log(`Attempt ${retryCount}/${maxRetries}: Checking meeting access...`);
    
    // Refresh the page
    try {
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log(`Reload failed on attempt ${retryCount}, continuing...`);
    }
    
    // Check if still blocked
    const isBlocked = await checkMeetingBlocked(page);
    
    if (!isBlocked) {
      console.log(`✅ Meeting is now accessible after ${retryCount} attempts!`);
      return true;
    }
    
    // Fixed wait time of 10 seconds between retries
    const waitTime = 10000; // 10 seconds
    const waitSeconds = 10;
    
    console.log(`❌ Attempt ${retryCount} failed. Meeting still not accessible.`);
    
    if (retryCount < maxRetries) {
      console.log(`⏳ Waiting ${waitSeconds} seconds before retry ${retryCount + 1}...`);
      await page.waitForTimeout(waitTime);
    }
  }
  
  console.log(`🚫 Failed to access meeting after ${maxRetries} attempts.`);
  return false;
}

// Function to turn off microphone and camera, then join the meeting
async function turnOffMicCam(page) {
  await page.waitForTimeout(TIMING.AFTER_JOIN_WAIT);
  
  // Handle name input if present
  await handleNameInput(page);
  
  // Try to handle "Continue without microphone and camera" button first
  try {
    const disableMediaButton = await tryMultipleSelectors(page, SELECTORS.DISABLE_MEDIA, 3000);
    if (disableMediaButton) {
      await disableMediaButton.click();
      console.log('Selected to continue without microphone and camera.');
      await page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
    }
  } catch (error) {
    console.log('No disable media button found, proceeding with individual controls.');
  }

  // Try to turn off microphone
  try {
    const micButton = await tryMultipleSelectors(page, SELECTORS.MIC_BUTTON, 3000);
    if (micButton) {
      await micButton.click();
      console.log('Microphone turned off.');
      await page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
    }
  } catch (error) {
    console.log('Microphone button not found or already muted.');
  }

  // Try to turn off camera
  try {
    const cameraButton = await tryMultipleSelectors(page, SELECTORS.CAMERA_BUTTON, 3000);
    if (cameraButton) {
      await cameraButton.click();
      console.log('Camera turned off.');
      await page.waitForTimeout(TIMING.AFTER_CLICK_WAIT);
    }
  } catch (error) {
    console.log('Camera button not found or already off.');
  }

  // Try to join the meeting
  try {
    const joinButton = await tryMultipleSelectors(page, SELECTORS.JOIN_BUTTON, 10000);
    if (joinButton) {
      await joinButton.click();
      console.log('Joined the meeting successfully.');
      await page.waitForTimeout(TIMING.AFTER_JOIN_WAIT);
    } else {
      console.log('No join button found. Meeting may have started automatically.');
    }
  } catch (error) {
    console.log('Error clicking join button:', error.message);
  }
}

// Enhanced function to check if meeting has ended
async function checkMeetingEnd(page) {
  try {
    const endIndicator = await tryMultipleSelectors(page, SELECTORS.MEETING_END, 2000);
    return endIndicator !== null;
  } catch (error) {
    return false;
  }
}

// Function to handle meeting join with enhanced retry logic
async function handleMeetingJoin(page) {
  const maxRetries = 20; // Maximum retry attempts
  
  // Check if meeting is blocked
  const isBlocked = await checkMeetingBlocked(page);
  
  if (isBlocked) {
    console.log('🔒 Meeting is currently not accessible (host approval required or meeting not started).');
    console.log(`📋 Starting retry process with ${maxRetries} maximum attempts...`);
    
    // Wait for meeting to become available with enhanced retry
    const accessGranted = await waitForMeetingAccess(page, maxRetries);
    
    if (!accessGranted) {
      const errorMsg = `❌ Could not access meeting after ${maxRetries} attempts. Possible reasons:
      - Meeting requires host approval and host is not responding
      - Meeting has not started yet and may be scheduled for later
      - Meeting link is invalid or expired
      - Network connectivity issues`;
      
      throw new Error(errorMsg);
    }
  }
  
  // Proceed with normal join flow
  console.log('🎯 Proceeding with meeting join process...');
  await turnOffMicCam(page);
}

// Main function to handle meeting automation
async function joinMeeting(meetingLink, joinTime, exitTime) {
  // Enhanced browser configuration with anti-detection
  const browser = await chromium.launch({
    headless: false, // Set for debugging; change to true for production
    slowMo: 250, // Human-like delay
    args: [
      '--incognito',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-infobars',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-sync',
      '--disable-translate',
      '--disable-features=TranslateUI',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-gpu',
      '--mute-audio'
    ]
  });

  // Enhanced context configuration
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptDownloads: true,
    bypassCSP: false,
    ignoreHTTPSErrors: false,
    permissions: [], // Minimal permissions
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
      'DNT': '1'
    },
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });

  const page = await context.newPage();

  // Set longer timeout for page loads
  page.setDefaultTimeout(TIMING.PAGE_LOAD_TIMEOUT);

  try {
    // Wait until join time
    await waitUntil(joinTime);

    console.log('Navigating to meeting...');
    await page.goto(meetingLink, { 
      waitUntil: 'networkidle',
      timeout: TIMING.PAGE_LOAD_TIMEOUT 
    });

    // Handle meeting access and join
    await handleMeetingJoin(page);
    console.log('Meeting started successfully.');

    // Monitor meeting until exit time or meeting ends
    const exitTimeMs = exitTime.getTime();
    let meetingEnded = false;

    while (Date.now() < exitTimeMs && !meetingEnded) {
      // Check if meeting has ended every 30 seconds
      meetingEnded = await checkMeetingEnd(page);
      
      if (meetingEnded) {
        console.log('Meeting has ended naturally.');
        break;
      }

      // Wait 30 seconds before next check
      await page.waitForTimeout(30000);
    }

    if (!meetingEnded) {
      console.log('Scheduled exit time reached. Leaving meeting...');
    }

  } catch (error) {
    console.error('Error during meeting automation:', error);
    
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: `error-${Date.now()}.png` });
      console.log('Error screenshot saved.');
    } catch (screenshotError) {
      console.log('Could not save error screenshot.');
    }
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

// Main execution function
async function main() {
  try {
    console.log('Google Meet Automation (JavaScript/Playwright)');
    console.log('============================================');
    console.log('🤖 Enhanced with 20-retry auto-join system');
    console.log('⚡ Fast 10-second intervals for quick response');
    console.log('🔄 Continuous retry until meeting becomes accessible\n');

    // Get user input
    const meetingLink = await askQuestion('Enter the meeting link: ');

    // Join immediately
    const joinTime = new Date(); // Join now
    const exitTime = new Date(Date.now() + 3600000); // Exit after 1 hour

    console.log(`\nJoining meeting immediately...`);
    console.log(`Scheduled to leave at: ${exitTime.toLocaleTimeString()}`);
    console.log(`Meeting link: ${meetingLink}\n`);

    // Start the meeting automation
    await joinMeeting(meetingLink, joinTime, exitTime);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main().catch(console.error);