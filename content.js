// TabSummarizer Content Script
// This script runs in the context of web pages to extract text content

(function() {
  'use strict';

  // Function to extract meaningful text from the page
  function extractPageText() {
    try {
      // Remove unwanted elements that don't contain meaningful content
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 'aside',
        '.advertisement', '.ads', '.sidebar', '.menu', '.navigation',
        '.cookie-banner', '.popup', '.modal', '.tooltip',
        '[role="banner"]', '[role="navigation"]', '[role="complementary"]'
      ];
      
      // Create a copy of the body to work with
      const bodyClone = document.body.cloneNode(true);
      
      // Remove unwanted elements from the clone
      unwantedSelectors.forEach(selector => {
        const elements = bodyClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      // Try to find the main content area
      let contentElement = bodyClone.querySelector('main, article, .content, #content, .post, .entry, .article');
      
      // Fallback to body if no main content found
      if (!contentElement) {
        contentElement = bodyClone;
      }

      // Extract text content
      let text = contentElement.innerText || contentElement.textContent || '';
      
      // Clean up the text
      text = text
        .replace(/\s+/g, ' ')           // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n')      // Remove empty lines
        .trim();

      // Limit text length for AI processing
      if (text.length > 2000) {
        text = text.slice(0, 2000);
        // Try to end at a sentence boundary
        const lastPeriod = text.lastIndexOf('.');
        const lastExclamation = text.lastIndexOf('!');
        const lastQuestion = text.lastIndexOf('?');
        const lastSentence = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastSentence > 1000) { // Only if we can keep substantial content
          text = text.slice(0, lastSentence + 1);
        }
      }

      return text;

    } catch (error) {
      console.error('Error extracting page text:', error);
      return document.title || 'Unable to extract content';
    }
  }

  // Function to get page metadata
  function getPageMetadata() {
    try {
      const metadata = {
        title: document.title || '',
        url: window.location.href || '',
        domain: window.location.hostname || '',
        description: '',
        keywords: '',
        author: '',
        publishedTime: ''
      };

      // Try to get meta description
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        metadata.description = descMeta.getAttribute('content') || '';
      }

      // Try to get meta keywords
      const keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (keywordsMeta) {
        metadata.keywords = keywordsMeta.getAttribute('content') || '';
      }

      // Try to get author
      const authorMeta = document.querySelector('meta[name="author"]');
      if (authorMeta) {
        metadata.author = authorMeta.getAttribute('content') || '';
      }

      // Try to get published time
      const timeMeta = document.querySelector('meta[property="article:published_time"]') ||
                      document.querySelector('time[datetime]');
      if (timeMeta) {
        metadata.publishedTime = timeMeta.getAttribute('datetime') || timeMeta.getAttribute('content') || '';
      }

      return metadata;

    } catch (error) {
      console.error('Error getting page metadata:', error);
      return {
        title: document.title || '',
        url: window.location.href || '',
        domain: window.location.hostname || ''
      };
    }
  }

  // Function to detect page type/category
  function detectPageType() {
    try {
      const url = window.location.href.toLowerCase();
      const title = document.title.toLowerCase();
      const domain = window.location.hostname.toLowerCase();

      // Social media
      if (url.includes('twitter.com') || url.includes('facebook.com') || 
          url.includes('instagram.com') || url.includes('linkedin.com') ||
          url.includes('reddit.com') || url.includes('tiktok.com')) {
        return 'social-media';
      }

      // Documentation/Technical
      if (url.includes('github.com') || url.includes('stackoverflow.com') ||
          url.includes('docs.') || title.includes('documentation') ||
          title.includes('api') || title.includes('guide')) {
        return 'documentation';
      }

      // News/Articles
      if (url.includes('news') || url.includes('article') ||
          title.includes('news') || title.includes('article') ||
          document.querySelector('article, .article, .post')) {
        return 'news-article';
      }

      // Shopping
      if (url.includes('amazon.com') || url.includes('shop') ||
          url.includes('buy') || title.includes('price') ||
          title.includes('buy') || title.includes('shop')) {
        return 'shopping';
      }

      // Entertainment
      if (url.includes('youtube.com') || url.includes('netflix.com') ||
          url.includes('spotify.com') || url.includes('twitch.tv')) {
        return 'entertainment';
      }

      // Educational
      if (url.includes('coursera.org') || url.includes('udemy.com') ||
          url.includes('khanacademy.org') || title.includes('course') ||
          title.includes('tutorial') || title.includes('learn')) {
        return 'educational';
      }

      return 'general';

    } catch (error) {
      console.error('Error detecting page type:', error);
      return 'general';
    }
  }

  // Main function that returns all extracted data
  function extractAllData() {
    return {
      text: extractPageText(),
      metadata: getPageMetadata(),
      pageType: detectPageType(),
      extractedAt: new Date().toISOString()
    };
  }

  // Export functions for use by the extension
  window.TabSummarizerContent = {
    extractPageText,
    getPageMetadata,
    detectPageType,
    extractAllData
  };

  // For direct script injection, return the text immediately
  if (typeof window === 'undefined' || window === globalThis) {
    return extractPageText();
  }

})();
