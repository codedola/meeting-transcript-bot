# Meeting Transcript Bot 🤖

Tự động join Google Meet và extract transcript. Code JavaScript đơn giản, cấu trúc rõ ràng, production-ready.

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/codedola/meeting-transcript-bot.git
cd meeting-transcript-bot

# 2. Install dependencies
npm run setup

# 3. Run immediately
node src/bot.js "https://meet.google.com/your-link"
```

## 📁 Project Structure

```
meeting-transcript-bot/
├── src/
│   ├── bot.js          # 🎯 Main bot service
│   ├── content.js      # 📝 Content extraction logic
│   └── constants.js    # ⚙️ Configuration & selectors
├── tests/              # 🧪 Test files (optional)
├── docs/              # 📖 Documentation
├── package.json       # 📦 Dependencies & scripts
├── README.md          # 📚 This file
├── LICENSE           # ⚖️ MIT License
└── .gitignore        # 🚫 Git ignore rules
```

## 📋 Features

✅ **Auto Join** - Tự động vào meeting không cần thao tác  
✅ **Disable Media** - Tắt camera/mic, không làm phiền  
✅ **Smart Transcript** - Bật captions và capture real-time  
✅ **Chat Capture** - Lưu tin nhắn chat trong meeting  
✅ **Auto Download** - File .txt tự động tải về Downloads  
✅ **Error Handling** - Xử lý lỗi robust, recovery tự động  
✅ **Debug Mode** - Screenshot và logging chi tiết  
✅ **Cross Platform** - Windows, macOS, Linux support

## 💻 Usage

### Basic Usage

```bash
node src/bot.js "https://meet.google.com/abc-defg-hij"
```

### With Custom Bot Name

```bash
node src/bot.js "https://meet.google.com/abc-defg-hij" "Daily Standup Bot"
```

### Using NPM Scripts

```bash
# Development mode (visible browser)
npm start "https://meet.google.com/your-link"

# Production mode
npm run start "https://meet.google.com/your-link" "Production Bot"
```

## 🔧 Configuration

### Environment Setup

**Development Mode** (trong `src/constants.js`):

```javascript
const BROWSER_CONFIG = {
  headless: false, // Hiện browser để debug
  slowMo: 50 // Chậm lại để dễ theo dõi
};
```

**Production Mode**:

```javascript
const BROWSER_CONFIG = {
  headless: true, // Ẩn browser
  slowMo: 0 // Tốc độ tối đa
};
```

### Custom Selectors

Khi Google Meet thay đổi UI, update trong `src/constants.js`:

```javascript
const SELECTORS = {
  TRANSCRIPT_CONTENT: [
    '[jsname="dsyhDe"] [jsname="YSxPC"]', // Selector hiện tại
    '.iTTPOb .zs7s8d.jxFHg', // Backup selector
    'your-new-selector' // Thêm selector mới
  ]
};
```

### Timing Adjustments

```javascript
const TIMING = {
  TRANSCRIPT_CHECK_INTERVAL: 1000, // Check transcript mỗi 1s
  AFTER_JOIN_WAIT: 5000, // Đợi 5s sau khi join
  ELEMENT_TIMEOUT: 10000 // Timeout tìm element
};
```

## 📄 Output Format

File tự động lưu vào **Downloads** folder:

```
Downloads/Transcript-Daily_Meeting_25-06-2025_09-00-00.txt
```

**Nội dung file:**

```
TRANSCRIPT CUỘC HỌP
================================

Tiêu đề: Daily Standup Meeting
Bắt đầu: 25/06/2025 09:00:00
Kết thúc: 25/06/2025 09:30:00
Thời lượng: 30m 15s

NỘI DUNG TRANSCRIPT:
================================

[09:01:23] John Doe:
Chào mọi người, bắt đầu daily standup.

[09:01:45] Jane Smith:
Hôm qua em hoàn thành feature login.

TIN NHẮN CHAT:
================================

[09:03:00] Jane Smith: Link PR: https://github.com/...
[09:03:30] John Doe: Thanks, anh review ngay

================================
Tạo bởi Meeting Transcript Bot
Ngày tạo: 25/06/2025 09:30:00
Tổng cộng: 15 transcript, 3 chat
```

## 🛠️ Development

### Project Setup

```bash
# Clone repository
git clone https://github.com/yourusername/meeting-transcript-bot.git
cd meeting-transcript-bot

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run in development mode
npm run dev "https://meet.google.com/test-link"
```

### Code Structure

**src/bot.js** - Main service

- Browser initialization và lifecycle
- Meeting join flow automation
- Error handling và recovery
- CLI interface

**src/content.js** - Content extraction

- Transcript parsing từ DOM
- Chat message capture
- File creation và export
- Data validation

**src/constants.js** - Configuration

- Selectors cho tất cả UI elements
- Timing constants
- Browser configuration
- Export settings

### Adding New Features

1. **New Selectors**: Thêm vào `SELECTORS` object trong `constants.js`
2. **New Timing**: Update `TIMING` object
3. **New Export Format**: Modify `createFileContent()` trong `content.js`
4. **New Detection Logic**: Extend methods trong `ContentExtractor` class

## 🐛 Troubleshooting

### Common Issues

**❌ Bot không join được meeting**

```bash
# Check 1: URL format đúng chưa?
node src/bot.js "https://meet.google.com/abc-defg-hij"

# Check 2: Meeting có public access không?
# Check 3: Thử manual join trước để test
```

**❌ Không extract được transcript**

```bash
# Check 1: Có ai enable captions chưa?
# Check 2: Google Meet có update UI không?
# Check 3: Run debug mode để check selectors
```

**❌ File không download**

```bash
# Check 1: Quyền ghi Downloads folder
# Check 2: Disk space đủ không
# Check 3: Antivirus có block không
```

### Debug Mode

Enable debug logging trong `src/constants.js`:

```javascript
const DEBUG_CONFIG = {
  VERBOSE_LOGGING: true
};
```

Khi có lỗi, bot sẽ log chi tiết.

## 📊 Advanced Usage

### Multiple Meetings

```bash
# Terminal 1
node src/bot.js "meeting-link-1" "Bot Meeting 1"

# Terminal 2
node src/bot.js "meeting-link-2" "Bot Meeting 2"
```

### Programmatic Usage

```javascript
const MeetingBot = require('./src/bot');

const bot = new MeetingBot();

// Start bot
await bot.start('https://meet.google.com/abc-defg-hij', 'API Bot');

// Get live stats
const stats = bot.getStats();
console.log(`Transcripts: ${stats.transcriptCount}`);

// Stop manually
await bot.forceStop();
```

### Custom Export

Extend `ContentExtractor` class:

```javascript
// src/custom-extractor.js
const ContentExtractor = require('./content');

class CustomExtractor extends ContentExtractor {
  createFileContent() {
    // Custom format logic
    return customContent;
  }
}
```

## 🔐 Security & Privacy

- ✅ **No Audio/Video Recording** - Chỉ capture text
- ✅ **Local Storage** - Data lưu máy local, không upload
- ✅ **Auto Disable Media** - Bot tự tắt camera/mic
- ✅ **Meeting Privacy** - Tuân thủ quy định meeting

## 📈 Performance

**System Requirements:**

- Node.js >= 16.0.0
- RAM: 512MB khả dụng
- Disk: 100MB free space
- Network: Stable internet connection

**Resource Usage:**

- CPU: ~5-10% (headless mode)
- RAM: ~200-300MB
- Network: Minimal (chỉ join meeting)

## 🤝 Contributing

### Development Workflow

1. **Fork** repository
2. **Create branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** với coding standards
4. **Test thoroughly**: `npm test`
5. **Commit**: `git commit -m 'Add amazing feature'`
6. **Push**: `git push origin feature/amazing-feature`
7. **Create Pull Request**

### Coding Standards

- **ES6+** syntax
- **Async/await** cho promises
- **Clear naming** cho variables/functions
- **Comments** cho complex logic
- **Error handling** cho tất cả async operations

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Playwright** - Robust browser automation
- **Google Meet** - Meeting platform
- **Node.js** - Runtime environment

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/codedola/meeting-transcript-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/codedola/meeting-transcript-bot/discussions)
- **Email**: contact@codedola.com
- **Website**: [CodeDola](https://github.com/codedola)

---

**✨ Simple. Clean. Effective. Production Ready. 🎯**s
