/**
 * Content Extractor Class
 * Handles transcript and chat extraction from Google Meet
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { SELECTORS, EXPORT_CONFIG } = require('./constants');

class ContentExtractor {
  constructor() {
    this.transcript = [];
    this.meetingTitle = 'Google Meet';
    this.startTime = new Date();
    this.lastTranscriptCount = 0;
  }

  // ============================================================
  // TRANSCRIPT EXTRACTION
  // ============================================================

  async extractTranscript(page) {
    try {
      // Try multiple selectors for transcript content
      for (const selector of SELECTORS.TRANSCRIPT_CONTENT) {
        try {
          const transcriptElements = await page.$$(selector);
          
          if (transcriptElements.length > 0) {
            await this.processTranscriptElements(page, transcriptElements);
            
            // Log progress if new content found
            if (this.transcript.length > this.lastTranscriptCount) {
              console.log(`📝 New transcript: ${this.transcript.length - this.lastTranscriptCount} items`);
              this.lastTranscriptCount = this.transcript.length;
            }
            
            return; // Success, exit loop
          }
        } catch (error) {
          continue; // Try next selector
        }
      }
    } catch (error) {
      // Silent error - transcript might not be available yet
    }
  }

  async processTranscriptElements(page, elements) {
    for (const element of elements) {
      try {
        const text = await element.textContent();
        const speaker = await this.findSpeaker(page, element);
        
        if (text && text.trim() && this.isNewTranscript(speaker, text)) {
          this.transcript.push({
            time: new Date(),
            name: speaker || 'Unknown',
            text: text.trim()
          });
        }
      } catch (error) {
        continue;
      }
    }
  }

  async findSpeaker(page, transcriptElement) {
    try {
      // Try to find speaker name near transcript element
      for (const selector of SELECTORS.TRANSCRIPT_SPEAKER) {
        try {
          // Look for speaker element as sibling or parent
          const speakerElement = await transcriptElement.evaluateHandle((el, selector) => {
            const parent = el.closest('[jsname="dsyhDe"]') || el.parentElement;
            return parent ? parent.querySelector(selector) : null;
          }, selector);
          
          if (speakerElement) {
            const name = await speakerElement.textContent();
            if (name && name.trim()) {
              return name.trim();
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      return 'Unknown Speaker';
    } catch (error) {
      return 'Unknown Speaker';
    }
  }

  isNewTranscript(name, text) {
    // Check if this exact transcript already exists
    return !this.transcript.some(item => 
      item.name === name && 
      item.text === text
    );
  }

  // ============================================================
  // FILE EXPORT
  // ============================================================

  async downloadTranscript() {
    try {
      const content = this.createFileContent();
      const filename = this.createFilename();
      const filePath = path.join(os.homedir(), EXPORT_CONFIG.FOLDER, filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write file
      await fs.writeFile(filePath, content, EXPORT_CONFIG.ENCODING);
      
      console.log(`✅ Transcript saved: ${filePath}`);
      console.log(`📊 Stats: ${this.transcript.length} transcripts`);

      return filePath;
    } catch (error) {
      console.error('❌ Error saving transcript:', error);
      throw error;
    }
  }

  createFileContent() {
    const startDate = new Date(this.startTime).toLocaleString(EXPORT_CONFIG.TIMESTAMP_FORMAT);
    const endDate = new Date().toLocaleString(EXPORT_CONFIG.TIMESTAMP_FORMAT);
    
    let content = `TRANSCRIPT CUỘC HỌP\n`;
    content += `${EXPORT_CONFIG.HEADER_SEPARATOR}\n\n`;
    content += `Tiêu đề: ${this.meetingTitle}\n`;
    content += `Bắt đầu: ${startDate}\n`;
    content += `Kết thúc: ${endDate}\n`;
    content += `Thời lượng: ${this.calculateDuration()}\n\n`;

    // Transcript section
    content += `NỘI DUNG TRANSCRIPT:\n`;
    content += `${EXPORT_CONFIG.HEADER_SEPARATOR}\n\n`;

    if (this.transcript.length > 0) {
      this.transcript.forEach(item => {
        const time = new Date(item.time).toLocaleTimeString('vi-VN');
        content += `[${time}] ${item.name}:\n${item.text}\n\n`;
      });
    } else {
      content += `Không có transcript nào được ghi nhận.\n\n`;
    }

    // Footer
    content += `\n${EXPORT_CONFIG.HEADER_SEPARATOR}\n`;
    content += `Tạo bởi Meeting Transcript Bot\n`;
    content += `Ngày tạo: ${endDate}\n`;
    content += `Tổng cộng: ${this.transcript.length} transcript\n`;

    return content;
  }

  createFilename() {
    const timestamp = new Date(this.startTime)
      .toLocaleString('vi-VN')
      .replace(/[/:]/g, '-')
      .replace(/,/g, '')
      .replace(/\s+/g, '_');

    const safeTitle = this.meetingTitle
      .replace(/[^\w\s-]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50); // Limit length

    return `${EXPORT_CONFIG.FILENAME_PREFIX}-${safeTitle}_${timestamp}.txt`;
  }

  calculateDuration() {
    const duration = Date.now() - new Date(this.startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  reset() {
    this.transcript = [];
    this.meetingTitle = 'Google Meet';
    this.startTime = new Date();
    this.lastTranscriptCount = 0;
  }
}

module.exports = ContentExtractor;