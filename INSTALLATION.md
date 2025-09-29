# TabSummarizer Installation Guide 🚀

## Quick Setup

### Step 1: Download the Extension Files
Make sure you have all the required files in your project directory:
- `manifest.json`
- `popup.html`
- `popup.js`
- `background.js`
- `content.js`
- `style.css`
- `icon.svg`

### Step 2: Load the Extension in Chrome

1. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner
   - This enables the "Load unpacked" button

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing your TabSummarizer files
   - The extension should now appear in your extensions list

4. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in Chrome toolbar
   - Find TabSummarizer and click the pin icon
   - The extension icon will now be visible in your toolbar

### Step 3: Test the Extension

1. **Open Multiple Tabs**
   - Open several tabs with different types of content:
     - News articles
     - Documentation pages
     - Social media posts
     - Shopping sites

2. **Use TabSummarizer**
   - Click the TabSummarizer icon in your toolbar
   - Click "Summarize Tabs" button
   - Watch as your tabs get summarized and organized

## Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure all files are in the same directory
- Check that manifest.json is valid JSON
- Verify Developer mode is enabled

**No summaries appearing:**
- Chrome's built-in AI APIs might not be available
- The extension will use fallback text extraction
- Try with different types of web pages

**Permission errors:**
- Check that manifest.json includes all required permissions
- Reload the extension after making changes

**Icons not displaying:**
- Convert icon.svg to PNG format if needed
- Ensure icon files are in the correct directory

### Converting SVG to PNG

If you need PNG icons instead of SVG:

1. Open `icon.svg` in a browser or image editor
2. Save as PNG with sizes:
   - 16x16 pixels for icon-16.png
   - 48x48 pixels for icon-48.png
   - 128x128 pixels for icon-128.png
3. Update manifest.json to reference the PNG files

## Features to Test

### Core Functionality
- [ ] Tab summarization works
- [ ] Better titles are generated
- [ ] Tab clustering groups similar content
- [ ] Search functionality works

### Advanced Features
- [ ] Context menu integration
- [ ] Offline functionality
- [ ] Different page types detected correctly
- [ ] Error handling works properly

## Demo Preparation

### For Hackathon Presentation

1. **Prepare Test Tabs**
   - Open 8-12 tabs with diverse content
   - Include: news, documentation, social media, shopping
   - Have tabs ready before demo starts

2. **Demo Script**
   - Show the extension icon in toolbar
   - Click "Summarize Tabs" and watch processing
   - Highlight clustering and better titles
   - Demonstrate search functionality
   - Show offline mode (disconnect WiFi)

3. **Key Talking Points**
   - Built with Chrome's built-in AI APIs
   - Works completely offline
   - Reduces cognitive load from tab overload
   - Smart clustering and natural language search
   - Privacy-focused (no data sent to servers)

## Development Mode

### Making Changes

1. **Edit Files**
   - Modify any of the extension files
   - Save your changes

2. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on TabSummarizer
   - Or remove and reload the extension

3. **Test Changes**
   - Open new tabs to test
   - Check browser console for errors
   - Verify functionality works as expected

### Debugging

- **Popup Issues**: Right-click extension icon → "Inspect popup"
- **Background Script**: Go to `chrome://extensions/` → Details → "Inspect views: background page"
- **Content Script**: Open DevTools on any webpage → Console tab

---

**Your TabSummarizer extension is ready to use! 🎉**

For questions or issues, check the main README.md or DEVELOPMENT_STEPS.md files.
