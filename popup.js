// TabSummarizer Popup Logic
class TabSummarizer {
  constructor() {
    this.tabs = [];
    this.summaries = [];
    this.initializeEventListeners();
    this.loadTabCount();
  }

  initializeEventListeners() {
    document.getElementById('search-btn').addEventListener('click', () => {
      this.searchTabs();
    });

    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchTabs();
      }
    });

    // Add event delegation for tab navigation
    document.addEventListener('click', (e) => {
      const tabItem = e.target.closest('.tab-item');
      if (tabItem && tabItem.dataset.tabId) {
        this.navigateToTab(parseInt(tabItem.dataset.tabId));
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
        // Automatically generate brief summary when extension opens
        await this.generateBriefSummary(tabs);
      }
    } catch (error) {
      console.error('Error loading tab count:', error);
    }
  }

  async generateBriefSummary(tabs) {
    const output = document.getElementById('output');
    
    // Show loading state
    output.innerHTML = '<div class="empty-state"><div class="icon">...</div>Generating summary...</div>';

    try {
      // Prepare tab information for summarization
      const tabInfo = tabs.map(tab => {
        const domain = new URL(tab.url).hostname;
        const pageType = this.detectPageType(tab.url, tab.title);
        return `${pageType}: ${tab.title} (${domain})`;
      }).join(', ');

      // Try to use Chrome's Summarizer API for a brief overview
      let briefSummary = 'Unable to generate summary';
      
      try {
        // Check if Chrome's built-in Summarizer API is available
        if (typeof Summarizer !== 'undefined') {
          console.log('Using Chrome Summarizer API for brief summary');
          
          // Check availability
          const availability = await Summarizer.availability();
          if (availability === 'available' || availability === 'downloadable') {
            const summarizer = await Summarizer.create({
              type: 'tldr',
              length: 'short',
              format: 'plain-text',
              outputLanguage: 'en'
            });
            
            briefSummary = await summarizer.summarize(tabInfo, {
              context: 'This is a list of open browser tabs with their titles and domains.'
            });
          } else {
            throw new Error('Summarizer API unavailable');
          }
        } else {
          throw new Error('Summarizer API not available');
        }
      } catch (error) {
        console.warn('Summarizer API failed, using fallback:', error.message);
        // Fallback: generate a simple summary from tab types
        briefSummary = this.generateFallbackBriefSummary(tabs);
      }

      // Store tabs for display
      this.tabs = tabs;
      this.summaries = [];
      
      // Process tabs to get summaries for display
      await this.processAllTabsForDisplay();
      
      // Display the brief summary and tabs
      this.displayBriefSummaryWithTabs(briefSummary);

    } catch (error) {
      console.error('Error generating brief summary:', error);
      this.showError('Failed to generate summary. Please try again.');
    }
  }

  generateFallbackBriefSummary(tabs) {
    const pageTypes = {};
    
    tabs.forEach(tab => {
      const pageType = this.detectPageType(tab.url, tab.title);
      pageTypes[pageType] = (pageTypes[pageType] || 0) + 1;
    });

    const sortedTypes = Object.entries(pageTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (sortedTypes.length === 0) {
      return `You have ${tabs.length} open tabs across various websites.`;
    }

    const typeDescriptions = {
      'github': 'development/coding',
      'stackoverflow': 'programming help',
      'youtube': 'video content',
      'shopping': 'shopping',
      'news': 'news articles',
      'documentation': 'documentation',
      'social': 'social media',
      'reddit': 'discussions',
      'wikipedia': 'reference',
      'search': 'search results',
      'general': 'general web content'
    };

    const mainTypes = sortedTypes.map(([type, count]) => {
      const description = typeDescriptions[type] || type;
      return count === 1 ? `1 ${description} tab` : `${count} ${description} tabs`;
    });

    if (mainTypes.length === 1) {
      return `You have ${tabs.length} open tabs, mostly ${mainTypes[0]}.`;
    } else if (mainTypes.length === 2) {
      return `You have ${tabs.length} open tabs: ${mainTypes[0]} and ${mainTypes[1]}.`;
    } else {
      return `You have ${tabs.length} open tabs: ${mainTypes.slice(0, -1).join(', ')}, and ${mainTypes[mainTypes.length - 1]}.`;
    }
  }

  async processAllTabsForDisplay() {
    // Process tabs in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < this.tabs.length; i += batchSize) {
      const batch = this.tabs.slice(i, i + batchSize);
      await this.processBatchForDisplay(batch);
    }
  }

  async processBatchForDisplay(batch) {
    const promises = batch.map(tab => this.processTabForDisplay(tab));
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

  async processTabForDisplay(tab) {
    try {
      // Skip chrome:// and extension pages
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        const pageType = tab.url.startsWith('chrome://') ? 'chrome' : 'extension';
        const summary = pageType === 'chrome' ? 
          `Chrome system page: ${tab.title}` : 
          `Extension page: ${tab.title}`;
        const betterTitle = this.generateBetterTitle(tab);
        
        return {
          tab,
          summary,
          betterTitle
        };
      }

      // For display purposes, use a simpler approach - just use metadata
      const summary = this.generateSummaryFromMetadata(tab, '');
      const betterTitle = this.generateBetterTitle(tab);
      
      return {
        tab,
        summary,
        betterTitle
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

  displayBriefSummaryWithTabs(briefSummary) {
    const output = document.getElementById('output');
    
    // Create the brief summary section
    const briefSummaryHTML = `
      <div class="brief-summary">
        <div class="summary-header">[Summary] Brief Overview</div>
        <div class="summary-text">${briefSummary}</div>
      </div>
    `;
    
    // Create the tabs section
    let tabsHTML = '';
    if (this.summaries.length > 0) {
      // Group similar tabs (basic clustering)
      const clusters = this.clusterTabs();
      
      if (clusters.length > 1) {
        // Show clustered results
        clusters.forEach(cluster => {
          tabsHTML += `
            <div class="tab-cluster">
              <div class="cluster-header">${cluster.category}</div>
              ${cluster.tabs.map(item => this.renderTabItem(item)).join('')}
            </div>
          `;
        });
      } else {
        // Show flat list
        tabsHTML = this.summaries.map(item => this.renderTabItem(item)).join('');
      }
    }
    
    output.innerHTML = briefSummaryHTML + tabsHTML;
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
        const pageType = tab.url.startsWith('chrome://') ? 'chrome' : 'extension';
        const summary = pageType === 'chrome' ? 
          `Chrome system page: ${tab.title}` : 
          `Extension page: ${tab.title}`;
        const betterTitle = this.generateBetterTitle(tab);
        
        return {
          tab,
          summary,
          betterTitle
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
        // Even if we can't extract content, generate a meaningful summary from metadata
        const summary = this.generateSummaryFromMetadata(tab, '');
        const betterTitle = this.generateBetterTitle(tab);
        
        return {
          tab,
          summary,
          betterTitle
        };
      }

      // Summarize content using Chrome's AI API
      let summary = 'Unable to generate summary';
      let betterTitle = tab.title;

      try {
        // Check if Chrome's built-in AI APIs are available
        if (typeof ai !== 'undefined' && ai.summarizer) {
          console.log('Using Chrome Summarizer API');
          summary = await ai.summarizer.summarize(pageText, {
            type: "key-points",
            length: "short",
            outputLanguage: "en"
          });
          
          // Validate the AI response
          if (!summary || summary.trim().length === 0) {
            throw new Error('Empty response from AI API');
          }
        } else {
          console.log('Chrome AI APIs not available, using enhanced fallback');
          summary = this.generateSummaryFromMetadata(tab, pageText);
        }
      } catch (error) {
        console.warn('Summarizer API failed:', error.message);
        summary = this.generateSummaryFromMetadata(tab, pageText);
      }

      try {
        // Check if Chrome's built-in Rewriter API is available
        if (typeof ai !== 'undefined' && ai.rewriter) {
          console.log('Using Chrome Rewriter API');
          betterTitle = await ai.rewriter.rewrite(tab.title, {
            tone: "clear",
            style: "concise"
          });
          
          // Validate the AI response
          if (!betterTitle || betterTitle.trim().length === 0) {
            throw new Error('Empty response from Rewriter API');
          }
        } else {
          console.log('Chrome Rewriter API not available, using enhanced title generation');
          betterTitle = this.generateBetterTitle(tab);
        }
      } catch (error) {
        console.warn('Rewriter API failed:', error.message);
        betterTitle = this.generateBetterTitle(tab);
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

  generateSummaryFromMetadata(tab, pageText) {
    const domain = new URL(tab.url).hostname;
    const path = new URL(tab.url).pathname;
    const title = tab.title;
    
    // Detect page type from URL and title
    const pageType = this.detectPageType(tab.url, title);
    
    // Generate contextual summary based on page type and available data
    if (pageText && pageText.trim().length > 50) {
      // We have some content, use it with metadata
      return this.generateEnhancedSummary(pageText, title, domain, pageType);
    } else {
      // No content, generate from metadata only
      return this.generateMetadataSummary(title, domain, path, pageType);
    }
  }

  detectPageType(url, title) {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    
    if (urlLower.includes('github.com') || titleLower.includes('github')) {
      return 'github';
    } else if (urlLower.includes('stackoverflow.com') || titleLower.includes('stack overflow')) {
      return 'stackoverflow';
    } else if (urlLower.includes('youtube.com') || titleLower.includes('youtube')) {
      return 'youtube';
    } else if (urlLower.includes('amazon.com') || urlLower.includes('shop') || titleLower.includes('buy')) {
      return 'shopping';
    } else if (urlLower.includes('news') || titleLower.includes('news') || titleLower.includes('article')) {
      return 'news';
    } else if (urlLower.includes('docs.') || titleLower.includes('documentation') || titleLower.includes('api')) {
      return 'documentation';
    } else if (urlLower.includes('twitter.com') || urlLower.includes('facebook.com') || urlLower.includes('linkedin.com')) {
      return 'social';
    } else if (urlLower.includes('reddit.com')) {
      return 'reddit';
    } else if (urlLower.includes('wikipedia.org')) {
      return 'wikipedia';
    } else if (urlLower.includes('google.com/search')) {
      return 'search';
    }
    
    return 'general';
  }

  generateEnhancedSummary(pageText, title, domain, pageType) {
    const sentences = pageText.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const firstSentence = sentences[0]?.trim() || '';
    
    if (firstSentence.length > 10) {
      // We have good content, enhance it with context
      const context = this.getPageTypeContext(pageType);
      return `${context} ${firstSentence.slice(0, 120)}${firstSentence.length > 120 ? '...' : ''}`;
    } else {
      return this.generateMetadataSummary(title, domain, '', pageType);
    }
  }

  generateMetadataSummary(title, domain, path, pageType) {
    const context = this.getPageTypeContext(pageType);
    
    // Clean up the title
    const cleanTitle = title.replace(/\s*[-|]\s*.+$/, '').trim(); // Remove site names after dash/pipe
    
    // Generate summary based on page type and metadata
    switch (pageType) {
      case 'github':
        return `${context} Repository or code project on GitHub: ${cleanTitle}`;
      case 'stackoverflow':
        return `${context} Programming question or answer: ${cleanTitle}`;
      case 'youtube':
        return `${context} Video content: ${cleanTitle}`;
      case 'shopping':
        return `${context} Product page: ${cleanTitle}`;
      case 'news':
        return `${context} News article: ${cleanTitle}`;
      case 'documentation':
        return `${context} Technical documentation: ${cleanTitle}`;
      case 'social':
        return `${context} Social media post or profile: ${cleanTitle}`;
      case 'reddit':
        return `${context} Reddit discussion: ${cleanTitle}`;
      case 'wikipedia':
        return `${context} Wikipedia article: ${cleanTitle}`;
      case 'search':
        return `${context} Search results for: ${cleanTitle}`;
      default:
        return `${context} Web page: ${cleanTitle}`;
    }
  }

  getPageTypeContext(pageType) {
    const contexts = {
      'github': '[Code]',
      'stackoverflow': '[Programming]',
      'youtube': '[Video]',
      'shopping': '[Shopping]',
      'news': '[News]',
      'documentation': '[Docs]',
      'social': '[Social]',
      'reddit': '[Discussion]',
      'wikipedia': '[Encyclopedia]',
      'search': '[Search]',
      'general': '[Web]'
    };
    return contexts[pageType] || '[Web]';
  }

  generateBetterTitle(tab) {
    const domain = new URL(tab.url).hostname;
    const title = tab.title;
    const pageType = this.detectPageType(tab.url, title);
    
    // Clean up common title patterns
    let cleanTitle = title
      .replace(/\s*[-|]\s*.+$/, '') // Remove site names after dash/pipe
      .replace(/^(Home|Welcome)\s*[-|]?\s*/i, '') // Remove "Home -" prefixes
      .trim();
    
    // If title is too long, truncate intelligently
    if (cleanTitle.length > 60) {
      const words = cleanTitle.split(' ');
      let truncated = '';
      for (const word of words) {
        if ((truncated + ' ' + word).length > 57) break;
        truncated += (truncated ? ' ' : '') + word;
      }
      cleanTitle = truncated + '...';
    }
    
    // Add context if helpful
    if (pageType === 'github' && !cleanTitle.toLowerCase().includes('github')) {
      cleanTitle = `GitHub: ${cleanTitle}`;
    } else if (pageType === 'youtube' && !cleanTitle.toLowerCase().includes('youtube')) {
      cleanTitle = `Video: ${cleanTitle}`;
    } else if (pageType === 'stackoverflow' && !cleanTitle.toLowerCase().includes('stack')) {
      cleanTitle = `Q&A: ${cleanTitle}`;
    }
    
    return cleanTitle || title; // Fallback to original title if cleaning failed
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
    const { tab, summary, betterTitle, relevanceScore, reason } = item;
    const domain = new URL(tab.url).hostname;
    
    // Show relevance score and reason if available (from AI search)
    const relevanceInfo = relevanceScore && reason ? 
      `<div class="relevance-info">
        <span class="relevance-score">Relevance: ${Math.round(relevanceScore * 100)}%</span>
        <span class="relevance-reason">${reason}</span>
       </div>` : '';
    
    return `
      <div class="tab-item" data-tab-id="${tab.id}">
        <div class="tab-title">${betterTitle}</div>
        <div class="tab-summary">${summary}</div>
        <div class="tab-url">${domain}</div>
        ${relevanceInfo}
      </div>
    `;
  }

  async searchTabs() {
    const query = document.getElementById('search-input').value.trim();
    if (!query || !this.summaries.length) return;

    const output = document.getElementById('output');
    output.innerHTML = '<div class="empty-state"><div class="icon">...</div>Searching with AI...</div>';

    try {
      // Try to use Chrome's Prompt API for intelligent search
      let searchResults = await this.searchWithPromptAPI(query);
      
      // Fallback to basic search if Prompt API fails
      if (!searchResults || searchResults.length === 0) {
        searchResults = this.basicSearch(query);
      }

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
      // Fallback to basic search
      const searchResults = this.basicSearch(query);
      
      if (searchResults.length === 0) {
        output.innerHTML = `
          <div class="empty-state">
            <div class="icon">[?]</div>
            No tabs found matching "${query}"
          </div>
        `;
      } else {
        output.innerHTML = `
          <div class="cluster-header">Search Results for "${query}" (Basic Search)</div>
          ${searchResults.map(item => this.renderTabItem(item)).join('')}
        `;
      }
    }
  }

  async searchWithPromptAPI(query) {
    try {
      // Check if LanguageModel is available
      if (typeof LanguageModel === 'undefined') {
        console.log('LanguageModel not available');
        return null;
      }

      // Check availability
      const availability = await LanguageModel.availability();
      if (availability === 'unavailable') {
        console.log('LanguageModel unavailable');
        return null;
      }

      console.log('Using Chrome Prompt API for intelligent search');

      // Create a session with language configuration
      const session = await LanguageModel.create({
        expectedInputs: [
          { type: "text", languages: ["en"] }
        ],
        expectedOutputs: [
          { type: "text", languages: ["en"] }
        ]
      });

      // Prepare tab data for the AI
      const tabData = this.summaries.map((item, index) => ({
        id: index,
        title: item.tab.title,
        url: item.tab.url,
        summary: item.summary,
        betterTitle: item.betterTitle,
        domain: new URL(item.tab.url).hostname
      }));

      // Create a JSON schema for structured output
      const schema = {
        "type": "object",
        "properties": {
          "matchingTabs": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {"type": "number"},
                "relevanceScore": {"type": "number", "minimum": 0, "maximum": 1},
                "reason": {"type": "string"}
              },
              "required": ["id", "relevanceScore", "reason"]
            }
          }
        },
        "required": ["matchingTabs"]
      };

      // Create the prompt
      const prompt = `
You are a helpful assistant that finds relevant browser tabs based on user queries.

User Query: "${query}"

Available Tabs:
${tabData.map((tab, i) => `${i}: ${tab.betterTitle} - ${tab.summary} (${tab.domain})`).join('\n')}

Find tabs that match the user's query. Consider:
- Direct keyword matches
- Semantic similarity
- Context and meaning
- Content type (news, code, videos, etc.)

Return only the most relevant tabs (maximum 10) with a relevance score and brief reason.
`;

      // Query the AI with structured output
      const result = await session.prompt(prompt, {
        responseConstraint: schema
      });

      // Parse the JSON response
      const parsedResult = JSON.parse(result);
      
      // Map back to original tab summaries
      const matchingTabs = parsedResult.matchingTabs
        .filter(item => item.relevanceScore > 0.3) // Only include reasonably relevant results
        .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
        .map(item => {
          const originalTab = this.summaries[item.id];
          return {
            ...originalTab,
            relevanceScore: item.relevanceScore,
            reason: item.reason
          };
        });

      // Clean up the session
      session.destroy();

      return matchingTabs;

    } catch (error) {
      console.error('Prompt API search failed:', error);
      return null;
    }
  }

  basicSearch(query) {
    const queryLower = query.toLowerCase();
    return this.summaries.filter(item => {
      const searchText = `${item.tab.title} ${item.tab.url} ${item.summary} ${item.betterTitle}`.toLowerCase();
      return searchText.includes(queryLower);
    });
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

  async navigateToTab(tabId) {
    try {
      // Activate and bring the tab to the foreground
      await chrome.tabs.update(tabId, { active: true });
      
      // Focus the window containing the tab
      const tab = await chrome.tabs.get(tabId);
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      
      // Close the popup
      window.close();
    } catch (error) {
      console.error('Error navigating to tab:', error);
      // If the tab no longer exists, show an error message
      this.showError('This tab is no longer available.');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TabSummarizer();
});
