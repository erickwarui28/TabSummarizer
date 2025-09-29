// TabSummarizer Popup Logic
class TabSummarizer {
  constructor() {
    this.tabs = [];
    this.summaries = [];
    this.initializeEventListeners();
    this.loadTabCount();
  }

  initializeEventListeners() {
    document.getElementById('summarize').addEventListener('click', () => {
      this.summarizeAllTabs();
    });

    document.getElementById('search-btn').addEventListener('click', () => {
      this.searchTabs();
    });

    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchTabs();
      }
    });
  }

  async loadTabCount() {
    try {
      const tabs = await chrome.tabs.query({});
      const tabCountEl = document.getElementById('tab-count');
      tabCountEl.textContent = `${tabs.length} open tabs`;
      
      if (tabs.length > 0) {
        document.querySelector('.search-section').style.display = 'flex';
      }
    } catch (error) {
      console.error('Error loading tab count:', error);
    }
  }

  async summarizeAllTabs() {
    const button = document.getElementById('summarize');
    const buttonText = button.querySelector('.btn-text');
    const loading = button.querySelector('.loading');
    const output = document.getElementById('output');

    // Show loading state
    button.disabled = true;
    buttonText.style.display = 'none';
    loading.style.display = 'flex';
    output.innerHTML = '<div class="empty-state"><div class="icon">...</div>Processing tabs...</div>';

    try {
      const tabs = await chrome.tabs.query({});
      this.tabs = tabs;
      this.summaries = [];

      if (tabs.length === 0) {
        this.showEmptyState();
        return;
      }

      // Process tabs in batches to avoid overwhelming the AI APIs
      const batchSize = 3;
      for (let i = 0; i < tabs.length; i += batchSize) {
        const batch = tabs.slice(i, i + batchSize);
        await this.processBatch(batch);
        
        // Update progress
        const progress = Math.min(i + batchSize, tabs.length);
        output.innerHTML = `
          <div class="empty-state">
            <div class="icon">...</div>
            Processing ${progress} of ${tabs.length} tabs...
          </div>
        `;
      }

      this.displayResults();
      
    } catch (error) {
      console.error('Error summarizing tabs:', error);
      this.showError('Failed to summarize tabs. Please try again.');
    } finally {
      // Reset button state
      button.disabled = false;
      buttonText.style.display = 'flex';
      loading.style.display = 'none';
    }
  }

  async processBatch(batch) {
    const promises = batch.map(tab => this.processTab(tab));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.summaries.push(result.value);
      } else {
        console.error(`Failed to process tab ${batch[index].id}:`, result.reason);
        this.summaries.push({
          tab: batch[index],
          summary: 'Unable to summarize this tab',
          betterTitle: batch[index].title
        });
      }
    });
  }

  async processTab(tab) {
    try {
      // Skip chrome:// and extension pages
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return {
          tab,
          summary: 'System page - no content to summarize',
          betterTitle: tab.title
        };
      }

      // Extract page text
      let pageText = '';
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: this.extractPageText
        });
        pageText = results[0]?.result || '';
      } catch (error) {
        // If we can't inject script, use title as fallback
        pageText = tab.title;
      }

      if (!pageText.trim()) {
        return {
          tab,
          summary: 'No readable content found',
          betterTitle: tab.title
        };
      }

      // Summarize content using Chrome's AI API
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
        console.warn('Summarizer API not available, using fallback');
        summary = this.generateFallbackSummary(pageText);
      }

      try {
        if (typeof ai !== 'undefined' && ai.rewriter) {
          betterTitle = await ai.rewriter.rewrite(tab.title, {
            tone: "clear",
            style: "concise"
          });
        }
      } catch (error) {
        console.warn('Rewriter API not available, using original title');
      }

      return {
        tab,
        summary: summary.trim(),
        betterTitle: betterTitle.trim()
      };

    } catch (error) {
      console.error(`Error processing tab ${tab.id}:`, error);
      return {
        tab,
        summary: 'Error processing this tab',
        betterTitle: tab.title
      };
    }
  }

  extractPageText() {
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

  generateFallbackSummary(text) {
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

  displayResults() {
    const output = document.getElementById('output');
    
    if (this.summaries.length === 0) {
      this.showEmptyState();
      return;
    }

    // Group similar tabs (basic clustering)
    const clusters = this.clusterTabs();
    
    let html = '';
    
    if (clusters.length > 1) {
      // Show clustered results
      clusters.forEach(cluster => {
        html += `
          <div class="tab-cluster">
            <div class="cluster-header">${cluster.category}</div>
            ${cluster.tabs.map(item => this.renderTabItem(item)).join('')}
          </div>
        `;
      });
    } else {
      // Show flat list
      html = this.summaries.map(item => this.renderTabItem(item)).join('');
    }

    output.innerHTML = html;
  }

  clusterTabs() {
    const clusters = {
      'Research & Articles': [],
      'Social Media': [],
      'Documentation': [],
      'Shopping': [],
      'Entertainment': [],
      'Other': []
    };

    this.summaries.forEach(item => {
      const url = item.tab.url.toLowerCase();
      const title = item.tab.title.toLowerCase();
      
      if (url.includes('github.com') || url.includes('stackoverflow.com') || 
          title.includes('documentation') || title.includes('api')) {
        clusters['Documentation'].push(item);
      } else if (url.includes('twitter.com') || url.includes('facebook.com') || 
                 url.includes('instagram.com') || url.includes('linkedin.com')) {
        clusters['Social Media'].push(item);
      } else if (url.includes('amazon.com') || url.includes('shop') || 
                 title.includes('buy') || title.includes('price')) {
        clusters['Shopping'].push(item);
      } else if (url.includes('youtube.com') || url.includes('netflix.com') || 
                 url.includes('spotify.com')) {
        clusters['Entertainment'].push(item);
      } else if (url.includes('news') || url.includes('article') || 
                 title.includes('research') || title.includes('study')) {
        clusters['Research & Articles'].push(item);
      } else {
        clusters['Other'].push(item);
      }
    });

    // Filter out empty clusters
    return Object.entries(clusters)
      .filter(([_, tabs]) => tabs.length > 0)
      .map(([category, tabs]) => ({ category, tabs }));
  }

  renderTabItem(item) {
    const { tab, summary, betterTitle } = item;
    const domain = new URL(tab.url).hostname;
    
    return `
      <div class="tab-item">
        <div class="tab-title">${betterTitle}</div>
        <div class="tab-summary">${summary}</div>
        <div class="tab-url">${domain}</div>
      </div>
    `;
  }

  async searchTabs() {
    const query = document.getElementById('search-input').value.trim();
    if (!query || !this.summaries.length) return;

    try {
      const searchResults = this.summaries.filter(item => {
        const searchText = `${item.tab.title} ${item.tab.url} ${item.summary} ${item.betterTitle}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

      const output = document.getElementById('output');
      
      if (searchResults.length === 0) {
        output.innerHTML = `
          <div class="empty-state">
            <div class="icon">[?]</div>
            No tabs found matching "${query}"
          </div>
        `;
      } else {
        output.innerHTML = `
          <div class="cluster-header">Search Results for "${query}"</div>
          ${searchResults.map(item => this.renderTabItem(item)).join('')}
        `;
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed. Please try again.');
    }
  }

  showEmptyState() {
    const output = document.getElementById('output');
    output.innerHTML = `
      <div class="empty-state">
        <div class="icon">[📁]</div>
        No tabs to summarize.<br>
        Open some tabs and try again!
      </div>
    `;
  }

  showError(message) {
    const output = document.getElementById('output');
    output.innerHTML = `
      <div class="empty-state">
        <div class="icon">[!]</div>
        ${message}
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TabSummarizer();
});
