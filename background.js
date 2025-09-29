// TabSummarizer Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("TabSummarizer installed successfully!");
});

// Note: chrome.action.onClicked is not available when popup is defined in manifest
// The popup will handle the icon click interaction

// Listen for tab updates to potentially cache summaries
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could implement caching logic here for better performance
    console.log(`Tab ${tabId} finished loading: ${tab.url}`);
  }
});

// Background script utilities for message handling

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
