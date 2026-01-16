/**
 * Rūmie Reader - Main Application
 * Telegram chatbot conversation viewer with Airtable/n8n integration
 */

// ============================================
// Configuration
// ============================================

// Use our own Netlify serverless function instead of third-party CORS proxy
const API_ENDPOINT = '/api/proxy';

// ============================================
// State
// ============================================

let allData = [];
let currentFilter = 'recent'; // 'recent' or 'all'

// DOM Elements
const content = document.getElementById('content');
const convsCont = document.getElementById('convs');
const countElem = document.getElementById('count');

// URL Parameters (for shared links)
const urlParams = new URLSearchParams(window.location.search);
const sharedChatId = urlParams.get('chat');

// ============================================
// Data Loading
// ============================================

async function loadData() {
    try {
        console.log('Fetching data from Netlify function...');
        countElem.textContent = 'Fetching data...';

        const response = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        console.log('Received data:', Array.isArray(json) ? `${json.length} records` : typeof json);

        // Handle different response formats
        allData = parseResponseData(json);

        console.log('Processed records:', allData.length);

        if (allData.length === 0) {
            countElem.textContent = 'No conversations found';
            showToast('No data received from server', true);
            return;
        }

        renderConversations();

        // Open shared conversation if URL parameter present
        if (sharedChatId) {
            openSharedChat(sharedChatId);
        }

    } catch (error) {
        console.error('Load error:', error);
        showToast('Error loading data: ' + error.message, true);
        countElem.textContent = 'Error: ' + error.message;
    }
}

function parseResponseData(json) {
    // Direct array
    if (Array.isArray(json)) return json;

    // Various wrapped formats
    if (json.data) {
        return Array.isArray(json.data) ? json.data : [json.data];
    }
    if (json.records && Array.isArray(json.records)) return json.records;
    if (json.body && Array.isArray(json.body)) return json.body;
    if (json.items && Array.isArray(json.items)) return json.items;

    // Find first array property
    if (typeof json === 'object' && json !== null) {
        const arrayProp = Object.values(json).find(v => Array.isArray(v));
        if (arrayProp) return arrayProp;
    }

    // Wrap single object
    return [json];
}

async function refreshData() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner">⏳</span> Loading...';

    try {
        await loadData();
        showToast('Data refreshed successfully! ✓');
    } catch (error) {
        showToast('Failed to refresh data', true);
    } finally {
        btn.disabled = false;
        btn.textContent = '🔄 Refresh';
    }
}

// ============================================
// Rendering
// ============================================

function renderConversations() {
    // Group by CHAT ID
    const chats = {};
    allData.forEach(rec => {
        const chatId = rec['CHAT ID'];
        if (!chatId) return;
        if (!chats[chatId]) chats[chatId] = [];
        chats[chatId].push(rec);
    });

    // Sort each chat's messages by date (newest first)
    Object.keys(chats).forEach(chatId => {
        chats[chatId].sort((a, b) =>
            new Date(b['CREATED DATE']) - new Date(a['CREATED DATE'])
        );
    });

    // Sort chats by most recent message
    const sortedChats = Object.entries(chats).sort((a, b) =>
        new Date(b[1][0]['CREATED DATE']) - new Date(a[1][0]['CREATED DATE'])
    );

    countElem.textContent = `${sortedChats.length} conversations • ${allData.length} total messages`;
    convsCont.innerHTML = '';

    sortedChats.forEach(([chatId, messages], index) => {
        const latest = messages[0];

        const div = document.createElement('div');
        div.className = 'conv';
        div.style.animationDelay = `${index * 0.05}s`;

        div.innerHTML = `
            <div class="conv-name">${escapeHtml(latest['F Name'] || 'Unknown User')}</div>
            <div class="conv-preview">${escapeHtml((latest['USER MESSAGE'] || '').substring(0, 60))}${latest['USER MESSAGE']?.length > 60 ? '...' : ''}</div>
            <div class="conv-meta">
                <span>${formatDate(latest['CREATED DATE'])}</span>
                <span>${messages.length} msgs</span>
            </div>
        `;

        div.onclick = () => {
            document.querySelectorAll('.conv').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            showChat(chatId, messages);
        };

        convsCont.appendChild(div);
    });
}

function showChat(chatId, msgs) {
    const userName = msgs[0]['F Name'] || 'Unknown User';
    const username = msgs[0]['USERNAME'] || '';

    // Filter messages based on current filter
    let filteredMsgs = msgs;
    if (currentFilter === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filteredMsgs = msgs.filter(msg => new Date(msg['CREATED DATE']) >= oneWeekAgo);
    }

    const sorted = [...filteredMsgs].reverse(); // Oldest to newest for display

    content.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-left">
                <div class="chat-name">${escapeHtml(userName)}${username ? ` <span style="color: var(--text-muted); font-size: 0.7em;">@${escapeHtml(username)}</span>` : ''}</div>
                <div class="chat-id">Chat ID: ${chatId} • ${filteredMsgs.length} messages</div>
            </div>
            <button class="share-btn" onclick="shareConversation('${chatId}')">
                🔗 Share Conversation
            </button>
        </div>
        <div class="filter-bar">
            <span class="filter-label">Show:</span>
            <button class="filter-btn ${currentFilter === 'recent' ? 'active' : ''}" 
                    onclick="setFilter('recent', '${chatId}')">
                Recent (Last 7 days)
            </button>
            <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
                    onclick="setFilter('all', '${chatId}')">
                All Time
            </button>
        </div>
        <div class="messages">
            ${sorted.map((msg, idx) => `
                <div class="msg-group" id="msg-${msg['R-ID']}" style="animation-delay: ${idx * 0.03}s">
                    <div class="user-msg">
                        <div class="user-bubble">
                            ${escapeHtml(msg['USER MESSAGE'] || '')}
                            <div class="msg-time">${formatDateTime(msg['CREATED DATE'])}</div>
                        </div>
                    </div>
                    <div class="bot-msg">
                        <div class="bot-bubble">
                            ${formatHtmlMessage(msg['RUMIE MESSAGE'] || '')}
                            ${msg.Category ? `<div class="category">${escapeHtml(msg.Category)}</div>` : ''}
                            <div class="msg-time">R-ID: ${msg['R-ID']}</div>
                            <button class="share-msg-btn" onclick="shareMessage('${chatId}', '${msg['R-ID']}')">
                                🔗 Share this message
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Handle shared message URL parameter
    const msgId = urlParams.get('msg');
    if (msgId) {
        setTimeout(() => {
            const msgElement = document.getElementById(`msg-${msgId}`);
            if (msgElement) {
                msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                msgElement.style.animation = 'highlight 2s ease-out';
            }
        }, 300);
    }

    // Store current messages for filter changes
    window.currentChatMessages = msgs;
}

function openSharedChat(chatId) {
    const chats = {};
    allData.forEach(rec => {
        const id = rec['CHAT ID'];
        if (!id) return;
        if (!chats[id]) chats[id] = [];
        chats[id].push(rec);
    });

    if (chats[chatId]) {
        chats[chatId].sort((a, b) =>
            new Date(b['CREATED DATE']) - new Date(a['CREATED DATE'])
        );
        showChat(chatId, chats[chatId]);

        // Highlight the conversation in sidebar
        setTimeout(() => {
            const convDivs = document.querySelectorAll('.conv');
            convDivs.forEach(div => {
                if (div.textContent.includes(chats[chatId][0]['F Name'])) {
                    div.classList.add('active');
                    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }, 100);
    }
}

// ============================================
// Formatting Helpers
// ============================================

function formatHtmlMessage(html) {
    if (!html) return '';

    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p>/gi, '')
        .replace(/<a\s+href="([^"]+)">([^<]+)<\/a>/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>')
        .replace(/<(?!\/?(?:b|strong|a|ul|ol|li|p|em|i)\b)[^>]+>/gi, '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('<br>');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(dateStr) {
    return new Date(dateStr).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// Sharing
// ============================================

function shareConversation(chatId) {
    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = `${baseUrl}?chat=${encodeURIComponent(chatId)}`;
    copyToClipboard(shareUrl, 'Link copied to clipboard! ✓');
}

function shareMessage(chatId, msgId) {
    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = `${baseUrl}?chat=${encodeURIComponent(chatId)}&msg=${encodeURIComponent(msgId)}`;
    copyToClipboard(shareUrl, 'Message link copied! ✓');
}

async function copyToClipboard(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(successMessage);
        } catch (e) {
            showToast('Could not copy link', true);
        }
        document.body.removeChild(textArea);
    }
}

// ============================================
// Filtering
// ============================================

function setFilter(filter, chatId) {
    currentFilter = filter;
    if (window.currentChatMessages) {
        showChat(chatId, window.currentChatMessages);
    }
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, isError = false) {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', loadData);

// Make functions available globally for inline handlers
window.refreshData = refreshData;
window.shareConversation = shareConversation;
window.shareMessage = shareMessage;
window.setFilter = setFilter;
