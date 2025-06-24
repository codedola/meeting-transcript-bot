require('dotenv').config();

const config = {
  // Gmail credentials
  gmail: {
    email: process.env.GMAIL_EMAIL,
    password: process.env.GMAIL_PASSWORD
  },

  // Browser settings
  browser: {
    headless: process.env.HEADLESS === 'true' || process.env.NODE_ENV === 'production',
    slowMo: process.env.NODE_ENV === 'development' ? 200 : 0,
    debug: process.env.DEBUG_MODE === 'true'
  },

  // Bot settings
  bot: {
    defaultName: process.env.DEFAULT_BOT_NAME || 'Meeting Transcript Bot',
    autoLogin: true,
    persistSession: true
  }
};

module.exports = config;