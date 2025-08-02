// ===== MAIN APPLICATION CONTROLLER =====

// Global state
let currentTopicId = null;
let topics = [];

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
    initializeExtension();
    setupEventListeners();
});

async function initializeExtension() {
    await loadTopics();
    await showTopicsPage();
}

function setupEventListeners() {
    // Topics page events
    document.getElementById('addTopicBtn').addEventListener('click', showAddTopicModal);
    document.getElementById('saveTopicBtn').addEventListener('click', saveNewTopic);
    document.getElementById('cancelTopicBtn').addEventListener('click', hideAddTopicModal);
    
    // Topic detail page events
    document.getElementById('backBtn').addEventListener('click', () => showTopicsPage());
    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('suggestBtn').addEventListener('click', suggestTopics);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
    document.getElementById('deleteTopicBtn').addEventListener('click', deleteTopic);
    document.getElementById('viewSourcesBtn').addEventListener('click', () => showSourcesPage(currentTopicId));
    
    // Sources page events
    document.getElementById('backToTopicBtn').addEventListener('click', () => showTopicDetailPage(currentTopicId));
    document.getElementById('addSourceBtn').addEventListener('click', showAddSourceModal);
    document.getElementById('generateCitationFromSourcesBtn').addEventListener('click', generateCitations);
    
    // Source management events
    document.getElementById('saveSourceBtn').addEventListener('click', saveSource);
    document.getElementById('cancelSourceBtn').addEventListener('click', hideAddSourceModal);
    document.getElementById('autoFillBtn').addEventListener('click', autoFillSourceData);
    document.getElementById('closeCitationBtn').addEventListener('click', hideCitationModal);
    
    // Credibility rating events
    setupCredibilityRating();
    
    // Citation copy events
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            copyToClipboard(e.target);
        }
    });
    
    // Modal events
    document.getElementById('topicNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveNewTopic();
        }
    });
    
    // Click outside modal to close
    setupModalCloseHandlers();
}

// ===== RESULT DISPLAY =====
 function showResult(text) {
    document.getElementById('results').innerHTML = text;
    document.getElementById('results').style.display = 'block';
}

function showResultWithSourceButton(text) {
    const resultDiv = document.getElementById('results');
    resultDiv.innerHTML = `
        ${text}
        <div style="margin-top: 15px; text-align: center;">
            <button id="addToSourcesBtn" class="secondary-btn" style="padding: 8px 16px;">
                Add to Sources
            </button>
        </div>
    `;
    resultDiv.style.display = 'block';
    
    // Add event listener for the button after a small delay to ensure DOM is updated
    setTimeout(() => {
        const addBtn = document.getElementById('addToSourcesBtn');
        if (addBtn) {
            addBtn.addEventListener('click', addCurrentPageToSources);
        }
    }, 100);
}

async function addCurrentPageToSources() {
    if (!currentSummarizationTab || !currentTopicId) {
        console.error('No current tab or topic available for source adding');
        return;
    }
    
    try {
        // Show the add source modal directly without changing pages
        showAddSourceModal();
        
        // Pre-fill the form with current page data
        document.getElementById('sourceUrl').value = currentSummarizationTab.url || '';
        document.getElementById('sourceTitle').value = currentSummarizationTab.title || '';
        document.getElementById('sourceNotes').value = currentSummarizationText || '';
        
        // Set default type to website
        document.getElementById('sourceType').value = 'website';
        
        // Focus on the first editable field (title)
        document.getElementById('sourceTitle').focus();
        
    } catch (error) {
        console.error('Error adding current page to sources:', error);
    }
}

function setupModalCloseHandlers() {
    const modals = ['addTopicModal', 'addSourceModal', 'citationModal'];
    
    modals.forEach(modalId => {
        document.getElementById(modalId).addEventListener('click', (e) => {
            if (e.target.id === modalId) {
                document.getElementById(modalId).classList.add('hidden');
            }
        });
    });
}

// ===== TOPIC MANAGEMENT =====

async function loadTopics() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['researchTopics'], (result) => {
            topics = result.researchTopics || [];
            resolve();
        });
    });
}

async function saveTopics() {
    return new Promise((resolve) => {
        chrome.storage.local.set({ 'researchTopics': topics }, resolve);
    });
}

function generateTopicId() {
    return 'topic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function createTopic(name) {
    const topic = {
        id: generateTopicId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        notes: ''
    };
    
    topics.push(topic);
    await saveTopics();
    return topic;
}

async function deleteTopic() {
    if (!currentTopicId) return;
    
    const confirmed = confirm('Are you sure you want to delete this topic? This will remove all associated notes and data.');
    if (!confirmed) return;
    
    // Remove topic from array
    topics = topics.filter(topic => topic.id !== currentTopicId);
    
    // Remove topic-specific data from storage
    chrome.storage.local.remove([
        `notes_${currentTopicId}`,
        `summaries_${currentTopicId}`,
        `sources_${currentTopicId}`
    ]);
    
    await saveTopics();
    await showTopicsPage();
}

// ===== UI NAVIGATION =====

async function showTopicsPage() {
    hideAllPages();
    document.getElementById('topicsPage').classList.remove('hidden');
    currentTopicId = null;
    await renderTopicsList();
}

function showTopicDetailPage(topicId) {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    
    currentTopicId = topicId;
    hideAllPages();
    document.getElementById('topicDetailPage').classList.remove('hidden');
    document.getElementById('currentTopicName').textContent = topic.name;
    
    loadTopicNotes(topicId);
    clearResults();
}

async function showSourcesPage(topicId) {
    if (!topicId) return;
    
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    
    currentTopicId = topicId;
    hideAllPages();
    document.getElementById('sourcesPage').classList.remove('hidden');
    document.getElementById('sourcesTopicName').textContent = `${topic.name} - Sources`;
    
    const sources = await loadTopicSources(topicId);
    renderSourcesList(sources);
}

function hideAllPages() {
    const pages = ['topicsPage', 'topicDetailPage', 'sourcesPage'];
    pages.forEach(pageId => {
        document.getElementById(pageId).classList.add('hidden');
    });
}

async function renderTopicsList() {
    const topicsList = document.getElementById('topicsList');
    
    if (topics.length === 0) {
        topicsList.innerHTML = `
            <div class="empty-state">
                <h3>No Topics Yet</h3>
                <p>Create your first research topic to get started</p>
            </div>
        `;
        return;
    }
    
    // Get actual summary counts for all topics
    const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
        const actualCount = await getTopicSummaryCount(topic.id);
        return {
            ...topic,
            actualSummariesCount: actualCount
        };
    }));
    
    topicsList.innerHTML = topicsWithCounts.map(topic => `
        <div class="topic-item" data-topic-id="${topic.id}">
            <div>
                <div class="topic-name">${escapeHtml(topic.name)}</div>
                <div class="topic-stats">Created ${formatDate(topic.createdAt)}</div>
            </div>
            <div class="topic-stats">
                ${topic.actualSummariesCount} summaries
            </div>
        </div>
    `).join('');
    
    // Add event listeners to topic items
    const topicItems = topicsList.querySelectorAll('.topic-item');
    topicItems.forEach(item => {
        item.addEventListener('click', () => {
            const topicId = item.getAttribute('data-topic-id');
            showTopicDetailPage(topicId);
        });
    });
}

// ===== TOPIC MODAL MANAGEMENT =====

function showAddTopicModal() {
    document.getElementById('addTopicModal').classList.remove('hidden');
    document.getElementById('topicNameInput').value = '';
    document.getElementById('topicNameInput').focus();
}

function hideAddTopicModal() {
    document.getElementById('addTopicModal').classList.add('hidden');
}

async function saveNewTopic() {
    const nameInput = document.getElementById('topicNameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        showNotification('Please enter a topic name');
        return;
    }
    
    if (topics.some(topic => topic.name.toLowerCase() === name.toLowerCase())) {
        showNotification('A topic with this name already exists');
        return;
    }
    
    await createTopic(name);
    hideAddTopicModal();
    renderTopicsList();
    showNotification('Topic created successfully!');
}

// ===== NOTES MANAGEMENT =====

async function loadTopicNotes(topicId) {
    return new Promise((resolve) => {
        chrome.storage.local.get([`notes_${topicId}`], (result) => {
            const notes = result[`notes_${topicId}`] || '';
            document.getElementById('notes').value = notes;
            resolve();
        });
    });
}

async function saveNotes() {
    if (!currentTopicId) return;
    
    const notes = document.getElementById('notes').value;
    const storageKey = `notes_${currentTopicId}`;
    
    chrome.storage.local.set({ [storageKey]: notes }, () => {
        // Update topic notes in the topics array
        const topic = topics.find(t => t.id === currentTopicId);
        if (topic) {
            topic.notes = notes;
            saveTopics();
        }
        
        showNotification('Notes saved successfully');
    });
}

// ===== SUMMARIZATION =====

// Store the current tab info for manual source adding
let currentSummarizationTab = null;
let currentSummarizationText = null;

async function summarizeText() {
    if (!currentTopicId) return;
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('Please select some text first');
            return;
        }

        showResult('Summarizing...');

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: 'summarize' })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        const formattedResult = text.replace(/\n/g, '<br>');
        
        // Store current tab and summary for manual source adding
        currentSummarizationTab = tab;
        currentSummarizationText = formattedResult;
        
        // Show result with "Add to Sources" button
        showResultWithSourceButton(formattedResult);
        
        // Save summary to topic-specific storage
        await saveSummaryToTopic(formattedResult, result);

    } catch (error) {
        showResult('Error: ' + error.message);
    }
}

async function suggestTopics() {
    if (!currentTopicId) return;
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('Please select some text first');
            return;
        }

        showResult('Generating topic suggestions...');

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: 'suggest' })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        const formattedResult = text.replace(/\n/g, '<br>');
        
        // Show suggested topics
        showSuggestedTopics(formattedResult);

    } catch (error) {
        showResult('Error: ' + error.message);
    }
}

function showSuggestedTopics(suggestions) {
    const resultDiv = document.getElementById('results');
    resultDiv.innerHTML = `
        <div class="result-item">
            <div class="result-header">
                <h3>Suggested Topics</h3>
            </div>
            <div class="result-content">${suggestions}</div>
            <div style="margin-top: 15px; text-align: center;">
                <button id="clearSuggestionsBtn" class="secondary-btn" style="padding: 8px 16px;">
                    Clear Suggestions
                </button>
            </div>
        </div>
    `;
    resultDiv.style.display = 'block';
    
    // Add event listener for the clear button
    setTimeout(() => {
        const clearBtn = document.getElementById('clearSuggestionsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearResults);
        }
    }, 100);
}

async function saveSummaryToTopic(summary, originalText) {
    if (!currentTopicId) return;
    
    const summaryData = {
        id: Date.now(),
        summary: summary,
        originalText: originalText,
        timestamp: new Date().toISOString(),
        url: await getCurrentTabUrl()
    };
    
    const storageKey = `summaries_${currentTopicId}`;
    
    return new Promise((resolve) => {
        chrome.storage.local.get([storageKey], (result) => {
            const summaries = result[storageKey] || [];
            summaries.unshift(summaryData); // Add to beginning
            
            // Keep only last 20 summaries per topic
            if (summaries.length > 20) {
                summaries.splice(20);
            }
            
            chrome.storage.local.set({ [storageKey]: summaries }, resolve);
        });
    });
}

// Get actual count of summaries for a topic
async function getTopicSummaryCount(topicId) {
    const storageKey = `summaries_${topicId}`;
    return new Promise((resolve) => {
        chrome.storage.local.get([storageKey], (result) => {
            const summaries = result[storageKey] || [];
            resolve(summaries.length);
        });
    });
}

async function getCurrentTabUrl() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab.url;
    } catch {
        return '';
    }
}

// ===== UI HELPERS =====

function showResult(content) {
    document.getElementById('results').innerHTML = `
        <div class="result-item">
            <div class="result-content">${content}</div>
        </div>
    `;
}

function clearResults() {
    document.getElementById('results').innerHTML = '';
}

function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 1001;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}
