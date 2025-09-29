# TabSummarizer Development Steps 🛠️

This guide walks you through the step-by-step implementation of TabSummarizer Chrome Extension using Chrome's built-in AI APIs.

## 🛠 Step 1: Create the Project Structure

Create these files in your project directory:

```
tab-summarizer/
│
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
└── style.css   (optional for popup styling)
```

## 📝 Step 2: Write manifest.json

This tells Chrome what your extension does:

```json
{
  "manifest_version": 3,
  "name": "TabSummarizer",
  "version": "1.0",
  "description": "Summarize and organize your browser tabs using Chrome's built-in AI.",
  "permissions": ["tabs", "scripting", "activeTab"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "48": "icon.png"
  }
}
```

### Required Permissions:
- `tabs`: Access tab titles and URLs
- `scripting`: Inject scripts for content extraction
- `activeTab`: Access current tab information

⚡ **Note**: For now, you can use a placeholder icon.png (48x48px).

## 📄 Step 3: Build the Popup UI

### popup.html
```html
<!DOCTYPE html>
<html>
  <head>
    <title>TabSummarizer</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h2>TabSummarizer</h2>
    <button id="summarize">Summarize Tabs</button>
    <div id="output"></div>
    <script src="popup.js"></script>
  </body>
</html>
```

### style.css (optional)
```css
body {
  font-family: sans-serif;
  padding: 10px;
  width: 300px;
}
#output {
  margin-top: 10px;
  font-size: 14px;
}
```

## ⚙️ Step 4: Background Logic

### background.js
Handles tab queries when the extension button is clicked.

```javascript
chrome.runtime.onInstalled.addListener(() => {
  console.log("TabSummarizer installed.");
});
```

## 📑 Step 5: Popup Logic

### popup.js
This is where you'll fetch open tabs and use the AI APIs.

```javascript
document.getElementById("summarize").addEventListener("click", async () => {
  let tabs = await chrome.tabs.query({});
  const output = document.getElementById("output");
  output.innerHTML = "Summarizing tabs...";

  for (const tab of tabs) {
    try {
      // Inject content.js into each tab to extract page text
      let [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText.slice(0, 2000) // first 2000 chars
      });

      // Summarize with Chrome's built-in Summarizer API
      const summary = await ai.summarizer.summarize(result, {
        type: "key-points",
        length: "short"
      });

      // Rewrite title for clarity
      const betterTitle = await ai.rewriter.rewrite(tab.title, {
        tone: "clear",
        style: "concise"
      });

      output.innerHTML += `
        <div style="margin-bottom:10px;">
          <strong>${betterTitle}</strong><br/>
          ${summary}
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  }
});
```

## 🧠 Step 6: Content Script (Optional)

If you want more advanced text extraction:

### content.js
```javascript
(() => {
  return document.body.innerText.slice(0, 2000);
})();
```

## 🚀 Step 7: Load the Extension

1. Open Chrome → go to `chrome://extensions/`
2. Enable Developer mode (toggle in top right)
3. Click "Load unpacked" → select your tab-summarizer folder
4. You'll see the extension icon appear in your toolbar

## ✅ Step 8: Test the Workflow

1. Open a few tabs (news articles, blogs, docs)
2. Click the extension icon → "Summarize Tabs"
3. Summaries + rewritten titles should appear in the popup

## 🎯 Next Steps (Stretch Goals)

### Phase 1: Core Functionality
- [x] Basic extension setup
- [x] Tab collection and display
- [ ] Summarizer API integration
- [ ] Basic UI implementation

### Phase 2: Enhanced Features
- [ ] Add search bar (use Prompt API for natural queries)
- [ ] Group similar tabs (cluster by topic)
- [ ] Improved popup interface

### Phase 3: Advanced Features
- [ ] Export summaries into Markdown / Notion
- [ ] Advanced filtering and search
- [ ] Tab clustering functionality

### Phase 4: Demo & Polish
- [ ] Show an offline demo during judging
- [ ] UI/UX improvements
- [ ] Performance optimization

## 🔧 Development Tips

### API Usage Examples

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

### Common Issues & Solutions

1. **Permission Errors**: Ensure all required permissions are in manifest.json
2. **Content Script Injection**: Make sure target tab is accessible
3. **AI API Availability**: Verify Chrome has built-in AI support enabled
4. **Text Length Limits**: Keep extracted text under 2000 characters for optimal performance

## 🎬 Demo Features

- **Offline Mode Demo**: Unplug WiFi and show extension still working
- **Real-time Summarization**: Watch tabs get summarized as you browse
- **Smart Clustering**: See similar tabs grouped automatically
- **Natural Language Search**: Query your tabs with plain English

---

**Ready to build your TabSummarizer Chrome Extension! 🚀**
