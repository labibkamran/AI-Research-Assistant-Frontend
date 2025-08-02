// ===== SOURCE MANAGEMENT COMPONENT =====

let currentEditingSourceId = null;

// Source Management Functions
async function loadTopicSources(topicId) {
    return new Promise((resolve) => {
        chrome.storage.local.get([`sources_${topicId}`], (result) => {
            const sources = result[`sources_${topicId}`] || [];
            resolve(sources);
        });
    });
}

function renderSourcesList(sources) {
    const sourcesList = document.getElementById('sourcesList');
    
    if (sources.length === 0) {
        sourcesList.innerHTML = `
            <div class="empty-sources">
                <h3>No Sources Yet</h3>
                <p>Add your first research source to get started</p>
            </div>
        `;
        return;
    }
    
    sourcesList.innerHTML = sources.map(source => `
        <div class="source-item" data-source-id="${source.id}">
            <div class="source-header">
                <a href="${source.url}" target="_blank" class="source-title">${escapeHtml(source.title || source.url)}</a>
                <div class="source-actions">
                    <button class="edit-source-btn small-btn" data-action="edit" data-source-id="${source.id}">Edit</button>
                    <button class="delete-source-btn small-btn" data-action="delete" data-source-id="${source.id}">Delete</button>
                </div>
            </div>
            <div class="source-meta">
                ${source.author ? `<span class="source-author">By ${escapeHtml(source.author)}</span>` : ''}
                ${source.date ? `<span class="source-date">${formatDate(source.date)}</span>` : ''}
                <span class="source-type">${source.type || 'article'}</span>
            </div>
            ${source.credibility ? `
                <div class="credibility-display">
                    <span class="credibility-stars">${'★'.repeat(source.credibility)}${'☆'.repeat(5 - source.credibility)}</span>
                    <span class="credibility-text">${getCredibilityText(source.credibility)}</span>
                </div>
            ` : ''}
            ${source.notes ? `<div class="source-notes">${escapeHtml(source.notes)}</div>` : ''}
        </div>
    `).join('');
    
    // Add event listeners to source action buttons
    const actionButtons = sourcesList.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            const sourceId = e.target.getAttribute('data-source-id');
            
            if (action === 'edit') {
                editSource(sourceId);
            } else if (action === 'delete') {
                deleteSource(sourceId);
            }
        });
    });
}

// Source Modal Management
function showAddSourceModal() {
    currentEditingSourceId = null;
    clearSourceForm();
    document.getElementById('addSourceModal').classList.remove('hidden');
    document.getElementById('sourceUrl').focus();
}

function hideAddSourceModal() {
    document.getElementById('addSourceModal').classList.add('hidden');
    currentEditingSourceId = null;
}

function clearSourceForm() {
    document.getElementById('sourceUrl').value = '';
    document.getElementById('sourceTitle').value = '';
    document.getElementById('sourceAuthor').value = '';
    document.getElementById('sourceDate').value = '';
    document.getElementById('sourceType').value = 'article';
    document.getElementById('sourceNotes').value = '';
    
    // Reset credibility rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => star.classList.remove('active'));
    document.getElementById('credibilityLabel').textContent = 'Select rating';
}

async function autoFillSourceData() {
    const url = document.getElementById('sourceUrl').value.trim();
    if (!url) {
        showNotification('Please enter a URL first');
        return;
    }
    
    try {
        showNotification('Fetching page data...');
        
        // Get current tab and extract metadata
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url === url) {
            // If the URL matches current tab, extract data from it
            const [{ result }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractPageMetadata
            });
            
            if (result) {
                fillSourceForm(result);
                showNotification('Auto-filled successfully!');
            }
        } else {
            // Try to extract basic info from URL
            const urlObj = new URL(url);
            document.getElementById('sourceTitle').value = urlObj.hostname;
            showNotification('Please fill in additional details manually');
        }
    } catch (error) {
        showNotification('Could not auto-fill. Please enter details manually.');
    }
}

// Function to inject into page for metadata extraction
function extractPageMetadata() {
    const title = document.title || 
                 document.querySelector('meta[property="og:title"]')?.content ||
                 document.querySelector('h1')?.textContent || '';
    
    const author = document.querySelector('meta[name="author"]')?.content ||
                  document.querySelector('[rel="author"]')?.textContent ||
                  document.querySelector('.author')?.textContent || '';
    
    const publishDate = document.querySelector('meta[property="article:published_time"]')?.content ||
                       document.querySelector('meta[name="date"]')?.content ||
                       document.querySelector('time')?.getAttribute('datetime') || '';
    
    return {
        title: title.trim(),
        author: author.trim(),
        date: publishDate ? new Date(publishDate).toISOString().split('T')[0] : ''
    };
}

function fillSourceForm(data) {
    if (data.title) document.getElementById('sourceTitle').value = data.title;
    if (data.author) document.getElementById('sourceAuthor').value = data.author;
    if (data.date) document.getElementById('sourceDate').value = data.date;
}

async function saveSource() {
    const url = document.getElementById('sourceUrl').value.trim();
    const title = document.getElementById('sourceTitle').value.trim();
    
    if (!url && !title) {
        showNotification('Please enter at least a URL or title');
        return;
    }
    
    const sourceData = {
        id: currentEditingSourceId || generateSourceId(),
        url: url,
        title: title,
        author: document.getElementById('sourceAuthor').value.trim(),
        date: document.getElementById('sourceDate').value,
        type: document.getElementById('sourceType').value,
        credibility: getSelectedCredibility(),
        notes: document.getElementById('sourceNotes').value.trim(),
        addedAt: currentEditingSourceId ? undefined : new Date().toISOString()
    };
    
    // Remove undefined fields
    Object.keys(sourceData).forEach(key => {
        if (sourceData[key] === undefined) delete sourceData[key];
    });
    
    await saveSourceToStorage(sourceData);
    hideAddSourceModal();
    
    // Refresh the sources list if we're on the sources page
    if (!document.getElementById('sourcesPage').classList.contains('hidden')) {
        showSourcesPage(currentTopicId);
    }
    
    showNotification(currentEditingSourceId ? 'Source updated!' : 'Source added!');
}

function generateSourceId() {
    return 'source_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function saveSourceToStorage(sourceData) {
    if (!currentTopicId) return;
    
    const storageKey = `sources_${currentTopicId}`;
    
    return new Promise((resolve) => {
        chrome.storage.local.get([storageKey], (result) => {
            let sources = result[storageKey] || [];
            
            if (currentEditingSourceId) {
                // Update existing source
                const index = sources.findIndex(s => s.id === currentEditingSourceId);
                if (index !== -1) {
                    sources[index] = { ...sources[index], ...sourceData };
                }
            } else {
                // Add new source
                sources.unshift(sourceData);
            }
            
            chrome.storage.local.set({ [storageKey]: sources }, resolve);
        });
    });
}

// Source Actions
async function editSource(sourceId) {
    const storageKey = `sources_${currentTopicId}`;
    
    chrome.storage.local.get([storageKey], (result) => {
        const sources = result[storageKey] || [];
        const source = sources.find(s => s.id === sourceId);
        
        if (source) {
            currentEditingSourceId = sourceId;
            
            // Fill form with existing data
            document.getElementById('sourceUrl').value = source.url || '';
            document.getElementById('sourceTitle').value = source.title || '';
            document.getElementById('sourceAuthor').value = source.author || '';
            document.getElementById('sourceDate').value = source.date || '';
            document.getElementById('sourceType').value = source.type || 'article';
            document.getElementById('sourceNotes').value = source.notes || '';
            
            if (source.credibility) {
                setCredibilityRating(source.credibility);
            }
            
            document.getElementById('addSourceModal').classList.remove('hidden');
        }
    });
}

async function deleteSource(sourceId) {
    if (!confirm('Are you sure you want to delete this source?')) return;
    
    const storageKey = `sources_${currentTopicId}`;
    
    chrome.storage.local.get([storageKey], (result) => {
        let sources = result[storageKey] || [];
        sources = sources.filter(s => s.id !== sourceId);
        
        chrome.storage.local.set({ [storageKey]: sources }, () => {
            // Refresh the sources list
            if (!document.getElementById('sourcesPage').classList.contains('hidden')) {
                showSourcesPage(currentTopicId);
            }
            showNotification('Source deleted');
        });
    });
}

// Auto-add current page as source
async function autoAddCurrentPageAsSource(tab) {
    if (!currentTopicId || !tab) return;
    
    const storageKey = `sources_${currentTopicId}`;
    
    // Check if this URL is already added as a source
    return new Promise((resolve) => {
        chrome.storage.local.get([storageKey], async (result) => {
            const sources = result[storageKey] || [];
            const existingSource = sources.find(s => s.url === tab.url);
            
            if (existingSource) {
                resolve(); // Already exists, don't add again
                return;
            }
            
            try {
                // Extract page metadata
                const [{ result: metadata }] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: extractPageMetadata
                });
                
                const sourceData = {
                    id: generateSourceId(),
                    url: tab.url,
                    title: metadata?.title || tab.title || 'Untitled',
                    author: metadata?.author || '',
                    date: metadata?.date || '',
                    type: 'website',
                    credibility: 3, // Default medium credibility
                    notes: 'Auto-added from summarization',
                    addedAt: new Date().toISOString()
                };
                
                sources.unshift(sourceData);
                chrome.storage.local.set({ [storageKey]: sources }, resolve);
                
            } catch (error) {
                // If we can't extract metadata, add basic info
                const sourceData = {
                    id: generateSourceId(),
                    url: tab.url,
                    title: tab.title || 'Untitled',
                    type: 'website',
                    credibility: 3,
                    notes: 'Auto-added from summarization',
                    addedAt: new Date().toISOString()
                };
                
                sources.unshift(sourceData);
                chrome.storage.local.set({ [storageKey]: sources }, resolve);
            }
        });
    });
}
