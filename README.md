# TabSummarizer 🗂️

**Turn tab chaos into clear insights, instantly and offline.**

A Chrome Extension that clusters and summarizes browser tabs using Chrome's built-in AI APIs (Gemini Nano + Summarizer/Prompt/Rewriter APIs). Perfect for researchers, students, and productivity enthusiasts who struggle with information overload from too many open tabs.

## 🚀 Features

- **Smart Tab Summarization**: Automatically summarize each tab into 2-3 sentences using Chrome's Summarizer API
- **Improved Tab Titles**: Rewrite confusing tab titles with clearer, more descriptive ones using the Rewriter API
- **Natural Language Queries**: Use multimodal queries like "show me all articles with charts/images about AI" with the Prompt API
- **Advanced Tab Clustering**: Group similar tabs using cosine similarity and TF-IDF vectorization for intelligent organization
- **Export to Markdown**: Save organized tab summaries to Markdown files for note-taking and research
- **Offline-First**: Runs entirely locally using Chrome's built-in AI - no server round-trips needed
- **Real-Time Processing**: Automatically processes tabs as you browse with intelligent caching
- **Beautiful Interface**: Modern, responsive design with smooth animations and accessibility features

## 🎯 Problem Solved

Too many open tabs = information overload. TabSummarizer solves this by:
- Reducing cognitive load through intelligent summarization
- Making tab titles meaningful and searchable
- Enabling natural language search across your browser tabs
- Working completely offline for privacy and speed

## 🛠️ Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the TabSummarizer directory
5. The extension icon will appear in your Chrome toolbar

## 🏗️ Architecture

### Core Components

- **`manifest.json`**: Extension configuration and permissions
- **`background.js`**: Service worker for tab management
- **`content.js`**: Content script for page text extraction
- **`popup.html`**: Extension popup interface
- **`popup.js`**: Popup logic and AI API integration

### Permissions Used

- `tabs`: Access tab titles and URLs
- `scripting`: Inject scripts for content extraction
- `activeTab`: Access current tab information

## Built with

- **JavaScript** - Core programming language
- **Chrome Extension APIs** - Extension framework and tab management
- **Chrome Built-in AI APIs** - Local AI processing
  - **Gemini Nano** - AI model for text processing
  - **Summarizer API** - Text summarization
  - **Rewriter API** - Text rewriting and improvement
  - **Prompt API** - Natural language query processing
- **HTML5** - Popup interface
- **CSS3** - Styling and responsive design
- **Manifest V3** - Extension configuration and permissions

## 🔧 Development

### Prerequisites

- Chrome browser with built-in AI APIs support
- Basic knowledge of Chrome Extension development

### Project Structure

```
TabSummarizer/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script
├── popup.html            # Popup interface
├── popup.js              # Popup logic
└── README.md             # This file
```

### API Usage

#### Summarizer API
```javascript
const summary = await ai.summarizer.summarize(text, {
  type: "key-points",
  length: "short"
});
```

#### Rewriter API
```javascript
const betterTitle = await ai.rewriter.rewrite(title, {
  tone: "clear",
  style: "concise"
});
```

#### Prompt API
```javascript
const structured = await ai.prompt.generate({
  prompt: `From this list of tabs: ${JSON.stringify(tabs)}, 
           return only the ones matching: "${userQuery}"`,
  output: "json"
});
```

## 🚧 Development Roadmap

### Phase 1: Core Functionality
- [x] Basic extension setup
- [x] Tab collection and display
- [x] Summarizer API integration
- [x] Basic UI implementation

### Phase 2: Enhanced Features
- [x] Rewriter API for better titles
- [x] Improved popup interface
- [x] Tab clustering functionality

### Phase 3: Advanced Features
- [x] Natural language queries with Prompt API
- [x] Export summaries to Markdown
- [x] Advanced filtering and search

### Phase 4: Polish & Optimization
- [x] UI/UX improvements
- [x] Performance optimization
- [x] Comprehensive testing

## 🎬 Demo Features

- **Offline Mode Demo**: Unplug WiFi and show extension still working
- **Real-time Summarization**: Watch tabs get summarized as you browse
- **Smart Clustering**: See similar tabs grouped automatically using advanced algorithms
- **Natural Language Search**: Query your tabs with plain English using AI
- **Export Functionality**: Download organized summaries as Markdown files
- **Advanced Analytics**: View similarity scores and clustering metrics
- **Context-Aware Processing**: Different summarization approaches for different content types

## 🤝 Contributing

This project was created for the Google Chrome Built-in AI Challenge 2025. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Chrome Built-in AI Challenge 2025
- Chrome Extension API documentation
- Gemini Nano AI model integration

---

**Built with ❤️ for the Google Chrome Built-in AI Challenge 2025**
