# 🔬 AI Research Assistant Chrome Extension

A powerful Chrome extension that transforms how you conduct research online. Organize your findings by topics, get AI-powered summaries, discover related research areas, and manage your sources with automatic citation generation.

## ✨ Features

### 📚 **Topic-Based Organization**
- Create and manage research topics
- Organize all your research under specific themes
- Track your progress with automatic summary counting
- Clean, intuitive interface for easy navigation

### 🤖 **AI-Powered Text Analysis**
- **Smart Summarization**: Select any text on a webpage and get instant AI summaries
- **Topic Suggestions**: Discover related research topics based on your selected content
- Powered by advanced AI models for accurate and relevant insights

### 📖 **Source Management**
- Add web sources to your research topics with one click
- Auto-fill source information (title, URL, publication date)
- Rate source credibility with a 5-star system
- Add personal notes and annotations to each source

### 📝 **Citation Generator**
- Generate citations in multiple academic formats:
  - **APA** (American Psychological Association)
  - **MLA** (Modern Language Association) 
  - **Chicago** (Chicago Manual of Style)
- One-click copy to clipboard
- Automatically formatted based on source type

### 💾 **Smart Storage**
- All data stored locally in Chrome for privacy
- Automatic backup of research notes and summaries
- No account required - works offline after initial setup

## 🚀 Getting Started

### Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The AI Research Assistant icon will appear in your Chrome toolbar

### Backend Setup
This extension requires the AI Research Assistant Backend to function. The backend handles AI processing and text analysis.

**Backend Repository**: [AI Research Assistant Backend](https://github.com/labibkamran/AI-Research-Assistant-Backend.git)

Follow the backend setup instructions to get the AI features working.

## 📖 How to Use

### 1. **Create Research Topics**
- Click the extension icon to open the side panel
- Create topics for different research areas
- Example: "Climate Change", "Machine Learning", "Digital Marketing"

### 2. **Summarize Content**
- Navigate to any webpage
- Select the text you want to summarize
- Click "Summarize" in the extension panel
- Get instant AI-powered summaries

### 3. **Discover Related Topics**
- Select interesting text on any webpage
- Click "Suggest Topics" to discover related research areas
- Expand your research scope with AI suggestions

### 4. **Manage Sources**
- After summarizing, click "Add to Sources"
- Fill in source details (auto-filled when possible)
- Rate credibility and add personal notes
- Organize all sources under your research topics

### 5. **Generate Citations**
- Go to the Sources page for any topic
- Click "Generate Citations"
- Copy properly formatted citations in APA, MLA, or Chicago style

## 🎯 Perfect For

- **Students** conducting academic research
- **Researchers** gathering and organizing information
- **Content creators** researching topics for articles
- **Professionals** tracking industry insights
- **Anyone** who wants to research more efficiently

## 🔒 Privacy & Security

- **Local Storage**: All your research data stays on your computer
- **No Account Required**: Start researching immediately
- **Privacy-First**: Your research topics and sources remain private
- **Secure**: No data transmitted except for AI processing requests

## 🛠️ Technical Requirements

- **Chrome Browser** (version 88 or higher)
- **Backend Service** running locally or deployed
- **Internet Connection** for AI features

## 🤝 Contributing

We welcome contributions! Feel free to:
- Report bugs or suggest features
- Submit pull requests
- Improve documentation
- Share your research workflow ideas

## 📦 Repository Structure

```
├── manifest.json          # Chrome extension configuration
├── sidepanel.html         # Main interface
├── sidepanel.css          # Styling and themes
├── sidepanel.js           # Core application logic
├── background.js          # Extension background script
├── components/            # Modular components
│   ├── sources.js         # Source management
│   ├── citations.js       # Citation generation
│   └── credibility.js     # Rating system
└── README.md             # This file
```

## 🔗 Related Projects

- **Backend**: [AI Research Assistant Backend](https://github.com/labibkamran/AI-Research-Assistant-Backend.git)

## 📄 License

This project is open source. Feel free to use, modify, and distribute according to your needs.

---

**Happy Researching! 🔍✨**

*Transform your research workflow with AI-powered assistance*