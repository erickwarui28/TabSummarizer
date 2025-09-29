TabSummarizer Draft

Google Chrome Built-in AI Challenge 2025 to create new web applications or Chrome Extensions using a suite of built-in AI APIs and powerful models, including Gemini Nano


TabSummarizer – Smart Browser Tab Manager 🗂️

Problem: Too many open tabs = information overload.
Solution: A Chrome Extension that clusters and summarizes tabs.

Summarizer API → Summarize each tab into 2–3 sentences.

Prompt API → Multimodal query like “show me all articles with charts/images about AI.”

Rewriter API → Suggest better tab titles so you know what each tab is about.

Use case: Researchers, students, productivity nerds.


Perfect choice 🚀 — TabSummarizer is hackathon-friendly but also has huge wow-factor. Let me walk you step-by-step through how you can implement it as a Chrome Extension using the Chrome Built-in AI APIs (Gemini Nano + Summarizer/Prompt/Rewriter APIs).

🔧 1. Extension Setup

Your extension needs the usual Chrome Extension boilerplate:

manifest.json

{
  "manifest_version": 3,
  "name": "TabSummarizer",
  "version": "1.0",
  "description": "Cluster and summarize all your tabs using Chrome's built-in AI.",
  "permissions": ["tabs", "scripting", "activeTab"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}


tabs → lets you access the titles + URLs of open tabs.

scripting → injects scripts into pages if you need their text content.

📄 2. Collect Tab Data

Use chrome.tabs.query to get all open tabs.

// background.js
chrome.action.onClicked.addListener(async (tab) => {
  let tabs = await chrome.tabs.query({});
  // Send to popup for display
  chrome.runtime.sendMessage({ action: "TAB_LIST", tabs });
});

🧠 3. Summarize Tab Content (Summarizer API)

Inside your content script, scrape the main text of the page, then call Chrome’s built-in Summarizer API.

// content.js
async function summarizePage() {
  const text = document.body.innerText.slice(0, 5000); // limit length
  const summary = await ai.summarizer.summarize(text, {
    type: "key-points",
    length: "short"
  });
  return summary;
}


Summarizer API runs locally, so no server round-trip.

Limit text length because Gemini Nano is lightweight.

✏️ 4. Rewrite Titles (Rewriter API)

To make tab titles more meaningful:

async function rewriteTitle(title) {
  const betterTitle = await ai.rewriter.rewrite(title, {
    tone: "clear",
    style: "concise"
  });
  return betterTitle;
}


You could display this improved title next to the tab in your popup UI.

💭 5. Smart Queries (Prompt API)

Enable queries like:
"Show me tabs with images about AI"

async function queryTabs(tabs, userQuery) {
  const structured = await ai.prompt.generate({
    prompt: `From this list of tabs: ${JSON.stringify(tabs)}, 
             return only the ones matching: "${userQuery}"`,
    output: "json"
  });
  return JSON.parse(structured);
}


This uses the Prompt API to structure responses, making tab filtering natural.

🎨 6. UI (popup.html + popup.js)

A simple popup UI to display summaries + rewritten titles:

<body>
  <h2>TabSummarizer</h2>
  <div id="tab-list"></div>
</body>
<script src="popup.js"></script>

// popup.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "TAB_LIST") {
    const container = document.getElementById("tab-list");
    msg.tabs.forEach(async (tab) => {
      const summary = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: summarizePage
      });
      const betterTitle = await rewriteTitle(tab.title);

      container.innerHTML += `
        <div>
          <strong>${betterTitle}</strong><br/>
          ${summary}
        </div>
      `;
    });
  }
});

✅ 7. Hackathon MVP Milestones

Phase 1: Collect all tab titles + URLs and display them in popup.

Phase 2: Add Summarizer API → show short summaries under each tab.

Phase 3: Add Rewriter API → display clearer titles.

Phase 4 (stretch goal): Add Prompt API → let users filter/search tabs with natural language.

Polish: Style UI with TailwindCSS or simple CSS, record demo video.

⚡ Extra Wow-Factor

Add clustering → group similar tabs (e.g., all “AI research” tabs).

Export all summaries into a single Markdown note (great for students).

Offline mode demo: unplug WiFi, show extension still working.

👉 Do you want me to also draft the GitHub README.md (open-source repo style) with installation, features, and demo instructions so you’ll have a submission-ready repo for the hackathon?


