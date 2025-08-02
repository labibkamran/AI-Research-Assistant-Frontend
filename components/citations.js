// ===== CITATION GENERATOR COMPONENT =====

// Citation Generation Functions
async function generateCitations() {
    if (!currentTopicId) return;
    
    const storageKey = `sources_${currentTopicId}`;
    
    chrome.storage.local.get([storageKey], (result) => {
        const sources = result[storageKey] || [];
        
        if (sources.length === 0) {
            showNotification('No sources to cite');
            return;
        }
        
        const apaCitations = sources.map(source => generateAPACitation(source)).join('\n\n');
        const mlaCitations = sources.map(source => generateMLACitation(source)).join('\n\n');
        const chicagoCitations = sources.map(source => generateChicagoCitation(source)).join('\n\n');
        
        document.getElementById('apaCitations').textContent = apaCitations;
        document.getElementById('mlaCitations').textContent = mlaCitations;
        document.getElementById('chicagoCitations').textContent = chicagoCitations;
        
        document.getElementById('citationModal').classList.remove('hidden');
    });
}

function generateAPACitation(source) {
    const author = source.author || 'Unknown Author';
    const year = source.date ? new Date(source.date).getFullYear() : 'n.d.';
    const title = source.title || 'Untitled';
    const url = source.url;
    
    if (source.type === 'book') {
        return `${author} (${year}). ${title}. Publisher.`;
    } else if (source.type === 'journal') {
        return `${author} (${year}). ${title}. Journal Name, Volume(Issue), pages.`;
    } else {
        return `${author} (${year}). ${title}. Retrieved from ${url}`;
    }
}

function generateMLACitation(source) {
    const author = source.author || 'Unknown Author';
    const title = source.title || 'Untitled';
    const url = source.url;
    const date = source.date ? new Date(source.date).toLocaleDateString() : '';
    const accessDate = new Date().toLocaleDateString();
    
    if (source.type === 'book') {
        return `${author}. ${title}. Publisher, ${date}.`;
    } else {
        return `${author}. "${title}." Web. ${accessDate}. <${url}>.`;
    }
}

function generateChicagoCitation(source) {
    const author = source.author || 'Unknown Author';
    const title = source.title || 'Untitled';
    const url = source.url;
    const date = source.date ? new Date(source.date).toLocaleDateString() : '';
    const accessDate = new Date().toLocaleDateString();
    
    if (source.type === 'book') {
        return `${author}. ${title}. City: Publisher, ${date}.`;
    } else {
        return `${author}. "${title}." Accessed ${accessDate}. ${url}.`;
    }
}

function hideCitationModal() {
    document.getElementById('citationModal').classList.add('hidden');
}

async function copyToClipboard(button) {
    const format = button.getAttribute('data-format');
    const citationText = document.getElementById(`${format}Citations`).textContent;
    
    try {
        await navigator.clipboard.writeText(citationText);
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = `Copy ${format.toUpperCase()}`;
        }, 2000);
    } catch (error) {
        showNotification('Could not copy to clipboard');
    }
}
