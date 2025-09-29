// TabSummarizer Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("TabSummarizer installed successfully!");
  
  // Set up context menu for quick access
  chrome.contextMenus.create({
    id: "summarize-current-tab",
    title: "Summarize this tab",
    contexts: ["page"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "summarize-current-tab") {
    try {
      // Extract text from the current tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageText
      });
      
      const pageText = results[0]?.result || '';
      
      if (!pageText.trim()) {
        console.log('No text content found in this tab');
        return;
      }

      // Try to use AI API for summarization
      let summary = 'Unable to generate summary';
      let betterTitle = tab.title;

      try {
        if (typeof ai !== 'undefined' && ai.summarizer) {
          summary = await ai.summarizer.summarize(pageText, {
            type: "key-points",
            length: "short"
          });
        }
      } catch (error) {
        console.warn('AI API not available, using fallback');
        summary = generateFallbackSummary(pageText);
      }

      // Show summary in a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Tab Summary',
        message: summary.slice(0, 100) + (summary.length > 100 ? '...' : '')
      });

    } catch (error) {
      console.error('Error summarizing tab:', error);
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // This will open the popup, but we can also log for debugging
  console.log('TabSummarizer icon clicked');
});

// Listen for tab updates to potentially cache summaries
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could implement caching logic here for better performance
    console.log(`Tab ${tabId} finished loading: ${tab.url}`);
  }
});

// Utility function to extract page text
function extractPageText() {
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
  scripts.forEach(el => el.remove());

  // Get main content
  const body = document.body;
  if (!body) return '';

  // Try to find main content area
  const mainContent = document.querySelector('main, article, .content, #content, .post, .entry');
  const contentElement = mainContent || body;

  return contentElement.innerText
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

// Fallback summary generator
function generateFallbackSummary(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) return 'No readable content found';
  
  const firstSentence = sentences[0].trim();
  const secondSentence = sentences[1]?.trim();
  
  let summary = firstSentence;
  if (secondSentence && summary.length < 100) {
    summary += '. ' + secondSentence;
  }
  
  return summary.length > 150 ? summary.slice(0, 147) + '...' : summary;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_TAB_COUNT") {
    chrome.tabs.query({}, (tabs) => {
      sendResponse({ count: tabs.length });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "SUMMARIZE_TAB") {
    const tabId = request.tabId;
    chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageText
    }).then((results) => {
      const pageText = results[0]?.result || '';
      sendResponse({ text: pageText });
    }).catch((error) => {
      sendResponse({ error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});
