# Chrome Built-in AI APIs in TabSummarizer

This document outlines the Chrome Built-in AI APIs currently implemented in the TabSummarizer Chrome Extension project.

## Overview

TabSummarizer leverages Chrome's built-in AI capabilities to provide intelligent tab summarization and organization. The extension uses multiple AI APIs to enhance user experience while maintaining privacy through on-device processing.

## APIs Currently Implemented

### 1. Summarizer API

**Status**: ✅ Implemented  
**Chrome Version**: Available from Chrome 138 stable  
**Documentation**: [Chrome Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)

#### Implementation Details

```javascript
// Location: popup.js - processTab() method
if (typeof ai !== 'undefined' && ai.summarizer) {
  console.log('Using Chrome Summarizer API');
  summary = await ai.summarizer.summarize(pageText, {
    type: "key-points",
    length: "short"
  });
}
```

#### Configuration Options
- **type**: `"key-points"` - Extracts main points from content
- **length**: `"short"` - Generates concise summaries

#### Use Cases in TabSummarizer
- Condense long web page content into 2-3 sentence summaries
- Extract key information from articles, documentation, and posts
- Provide quick overviews for tab organization
- Enable users to quickly identify relevant content

#### Fallback Strategy
When the Summarizer API is unavailable or fails:
- Uses enhanced metadata-based summarization
- Generates contextual summaries from page title, URL, and domain
- Provides meaningful descriptions based on detected page type

---

### 2. Rewriter API

**Status**: ✅ Implemented  
**Chrome Version**: Available from Chrome 138 stable (Extensions)  
**Documentation**: [Chrome Rewriter API](https://developer.chrome.com/docs/ai/built-in-apis#writer_and_rewriter_apis)

#### Implementation Details

```javascript
// Location: popup.js - processTab() method
if (typeof ai !== 'undefined' && ai.rewriter) {
  console.log('Using Chrome Rewriter API');
  betterTitle = await ai.rewriter.rewrite(tab.title, {
    tone: "clear",
    style: "concise"
  });
}
```

#### Configuration Options
- **tone**: `"clear"` - Makes titles more understandable
- **style**: `"concise"` - Removes unnecessary words

#### Use Cases in TabSummarizer
- Improve confusing or unclear tab titles
- Remove redundant site names and prefixes
- Create more descriptive titles for better organization
- Enhance readability for users with many open tabs

#### Fallback Strategy
When the Rewriter API is unavailable or fails:
- Uses intelligent title cleaning algorithms
- Removes common patterns like "Site Name - " prefixes
- Truncates overly long titles intelligently
- Adds contextual prefixes based on page type

---

### 3. Prompt API

**Status**: ✅ Implemented  
**Chrome Version**: Available from Chrome 138 stable (Extensions only)  
**Documentation**: [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api)

#### Implementation Details

```javascript
// Location: popup.js - searchWithPromptAPI() method
async searchWithPromptAPI(query) {
  // Check LanguageModel availability
  const availability = await LanguageModel.availability();
  if (availability === 'unavailable') return null;

  // Create session with language configuration
  const session = await LanguageModel.create({
    expectedInputs: [
      { type: "text", languages: ["en"] }
    ],
    expectedOutputs: [
      { type: "text", languages: ["en"] }
    ]
  });
  
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
          }
        }
      }
    }
  };

  // Query with structured output
  const result = await session.prompt(prompt, {
    responseConstraint: schema
  });
  
  return JSON.parse(result);
}
```

#### Configuration Options
- **expectedInputs**: `[{ type: "text", languages: ["en"] }]` - Specifies English input language
- **expectedOutputs**: `[{ type: "text", languages: ["en"] }]` - Specifies English output for optimal quality and safety
- **responseConstraint**: JSON schema for structured, reliable responses
- **Session Management**: Proper creation and cleanup of LanguageModel sessions

#### Features Implemented
- **Natural Language Search**: "show me programming tutorials", "find shopping sites"
- **Semantic Understanding**: Finds relevant tabs based on meaning, not just keywords
- **Relevance Scoring**: Returns tabs with confidence scores (0-100%)
- **Reasoning**: Provides explanations for why tabs match the query
- **Structured Output**: Uses JSON schema for reliable, parseable results

#### Use Cases in TabSummarizer
- Intelligent tab search using natural language
- Context-aware filtering based on content meaning
- Relevance-ranked results with explanations
- Fallback to basic keyword search when AI unavailable

---

## API Availability and Compatibility

### Current Status Matrix

| API | Web Apps | Extensions | Chrome Version | Status in TabSummarizer |
|-----|----------|------------|----------------|------------------------|
| Summarizer API | ✅ Stable | ✅ Stable | 138+ | ✅ Implemented |
| Rewriter API | 🔄 Origin Trial | ✅ Stable | 138+ | ✅ Implemented |
| Prompt API | 🔄 Origin Trial | ✅ Stable | 138+ | ✅ Implemented |
| Writer API | 🔄 Origin Trial | 🔄 Origin Trial | 138+ | ❌ Not Used |
| Translator API | ✅ Stable | ✅ Stable | 138+ | ❌ Not Used |
| Language Detector API | ✅ Stable | ✅ Stable | 138+ | ❌ Not Used |
| Proofreader API | 🔄 Origin Trial | 🔄 Origin Trial | 138+ | ❌ Not Used |

### Browser Compatibility
- **Chrome 138+**: Full support for implemented APIs
- **Chrome 137 and below**: Fallback to metadata-based processing
- **Other browsers**: Not supported (Chrome Extension only)

---

## Implementation Architecture

### Error Handling Strategy

```javascript
// Robust error handling pattern used throughout
try {
  if (typeof ai !== 'undefined' && ai.summarizer) {
    // Use Chrome AI API
    result = await ai.summarizer.summarize(content, options);
    
    // Validate response
    if (!result || result.trim().length === 0) {
      throw new Error('Empty response from AI API');
    }
  } else {
    // Fallback to metadata-based processing
    result = this.generateSummaryFromMetadata(tab, content);
  }
} catch (error) {
  console.warn('AI API failed:', error.message);
  result = this.generateSummaryFromMetadata(tab, content);
}
```

### Fallback Mechanisms

1. **Primary**: Chrome Built-in AI APIs
2. **Secondary**: Enhanced metadata-based generation
3. **Tertiary**: Basic text extraction and cleaning

### Performance Considerations

- **Batch Processing**: Tabs processed in groups of 3 to avoid overwhelming APIs
- **Content Limits**: Text truncated to 2000 characters for optimal processing
- **Caching**: Results stored temporarily during session
- **Async Processing**: Non-blocking operations to maintain UI responsiveness

---

## Privacy and Security

### On-Device Processing
- All AI processing happens locally on the user's device
- No data sent to external servers
- Content never leaves the user's browser

### Data Handling
- Tab content extracted only when user requests summarization
- No persistent storage of page content
- Temporary processing with automatic cleanup

### Permissions Required
```json
{
  "permissions": [
    "tabs",           // Access tab titles and URLs
    "scripting",      // Inject content extraction scripts
    "activeTab",      // Access current tab information
    "notifications"   // Show summarization results
  ]
}
```

---

## Development and Testing

### Debugging AI APIs

```javascript
// Console logging for debugging
console.log('Chrome AI APIs available:', {
  summarizer: typeof ai?.summarizer !== 'undefined',
  rewriter: typeof ai?.rewriter !== 'undefined',
  prompt: typeof ai?.prompt !== 'undefined'
});
```

### Testing Strategy

1. **API Availability Testing**: Verify APIs are accessible
2. **Fallback Testing**: Ensure graceful degradation when APIs unavailable
3. **Performance Testing**: Measure processing times for different content types
4. **Error Handling Testing**: Verify robust error recovery

### Development Tools

- **Chrome DevTools**: Monitor API calls and responses
- **Console Logging**: Track which processing method is used
- **Network Tab**: Verify no external requests are made

---

## Future Enhancements

### Planned API Integrations

1. **Prompt API Integration**
   - Natural language tab search
   - Advanced clustering algorithms
   - Context-aware recommendations

2. **Language Detector API**
   - Multi-language content detection
   - Automatic language-specific processing
   - International user support

3. **Writer API**
   - Generate tab descriptions
   - Create custom summaries
   - Enhanced content creation

### Performance Optimizations

- **Model Caching**: Cache AI models for faster subsequent processing
- **Streaming Responses**: Implement streaming for large content
- **Background Processing**: Process tabs in background for better UX

---

## Resources and Documentation

### Official Chrome Documentation
- [Chrome Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in-apis)
- [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api)
- [Writing Assistance APIs](https://github.com/explainers-by-googlers/writing-assistance-apis/)

### Related Documentation
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Scripting API](https://developer.chrome.com/docs/extensions/reference/scripting/)
- [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/tabs/)

### Community Resources
- [Chrome Extensions Developer Community](https://groups.google.com/a/chromium.org/g/chromium-extensions)
- [WebML Community Group](https://www.w3.org/community/webmachinelearning/)

---

## Conclusion

TabSummarizer successfully leverages Chrome's built-in AI APIs to provide intelligent tab management while maintaining user privacy through on-device processing. The implementation includes robust error handling, comprehensive fallback mechanisms, and a clear path for future enhancements.

The combination of the Summarizer and Rewriter APIs creates a powerful foundation for tab organization, with planned integration of the Prompt API to provide even more advanced natural language capabilities.

---

**Last Updated**: December 2024  
**Chrome Version**: 138+  
**Extension Version**: 1.0
