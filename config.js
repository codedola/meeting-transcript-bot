require('dotenv').config();

const config = {
  // Browser settings - Enhanced for compliance
  browser: {
    headless: process.env.HEADLESS === 'true' || process.env.NODE_ENV === 'production',
    slowMo: process.env.NODE_ENV === 'development' ? 250 : 0,
    debug: process.env.DEBUG_MODE === 'true'
  },

  // Bot settings - Simplified
  bot: {
    defaultName: process.env.DEFAULT_BOT_NAME || 'Meeting Transcript Bot',
    autoJoin: true,
    respectLimits: true
  },

  // Compliance settings
  compliance: {
    respectRateLimit: true,
    minRequestDelay: 2000,
    maxRetries: 3,
    gracefulShutdown: true
  }
};

module.exports = config;