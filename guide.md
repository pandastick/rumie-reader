# Rūmie Conversations Viewer - Complete Guide

## Project Overview

The Rūmie Conversations Viewer is a web-based interface for viewing and managing Telegram chatbot conversations stored in Airtable. It displays conversations between users and Rūmie (the chatbot), with features for filtering, sharing, and navigating through message history.

**Live URL:** https://pandastick.github.io/rumurumurumu/ (CURRENT)

---

## Architecture

### System Components

```
Telegram Bot → Airtable (Memory Table) → n8n Webhook → CORS Proxy → GitHub Pages (HTML Viewer)
```

1. **Airtable Database**
   - Base: Rūmie
   - Table: Memory
   - Stores all chatbot conversations with fields:
     - `R-ID`: Record ID
     - `USER MESSAGE`: User's message text
     - `RUMIE MESSAGE`: Bot's response (HTML formatted)
     - `USERNAME`: Telegram username
     - `CHAT ID`: Telegram chat identifier
     - `F Name`: User's first name
     - `CREATED DATE`: Timestamp
     - `Category`: Message category
     - `Session-ID`: Session identifier

2. **n8n Workflow**
   - Webhook URL: `https://rumurumurumu.app.n8n.cloud/webhook/8ef6128e-fc03-49ac-8b22-eb8a722157b0`
   - Fetches all records from Airtable
   - Returns data as JSON array

3. **CORS Proxy**
   - Service: corsproxy.io
   - Purpose: Bypass CORS restrictions since n8n webhooks don't handle OPTIONS requests
   - URL format: `https://corsproxy.io/?[encoded-webhook-url]`

4. **Frontend Viewer**
   - Single HTML file with embedded CSS and JavaScript
   - Hosted on GitHub Pages
   - No backend required

---

## Features

### 1. Conversation List (Sidebar)
- Shows all conversations grouped by Chat ID
- Sorted by most recent message
- Displays:
  - User's first name
  - Preview of last user message
  - Date of last message
  - Total message count
- Click to view full conversation

### 2. Conversation View (Main Area)
- **Header**
  - User's name and Telegram username (@username)
  - Chat ID and message count
  - "Share Conversation" button

- **Filter Bar**
  - "Recent (Last 7 days)" - Shows messages from past week
  - "All Time" - Shows all messages
  - Defaults to "Recent"

- **Messages**
  - User messages: Purple/pink gradient bubbles on right (20px left margin)
  - Bot messages: Dark gray bubbles on left (20px right margin)
  - Each message shows:
    - Message content (HTML formatted for bot messages)
    - Timestamp
    - Category tag (for bot messages)
    - R-ID (Record ID)
    - "Share this message" button

### 3. Sharing Features
- **Share Conversation**: Copies link to entire conversation
  - Format: `https://pandastick.github.io/rumurumurumu/?chat=CHATID`
  
- **Share Message**: Copies link to specific message within conversation
  - Format: `https://pandastick.github.io/rumurumurumu/?chat=CHATID&msg=MSGID`
  - Opens conversation and scrolls to the specific message
  - Highlights the message briefly with purple glow

### 4. Mobile Optimization
- Reduced message margins (20px) for better mobile viewing
- Messages take full width minus margins
- Responsive design adapts to screen size

---

## Setup Instructions

### Prerequisites
- GitHub account
- n8n account with active workflow
- Airtable access to Rūmie base

### Step 1: n8n Workflow Configuration

Your n8n workflow should have these nodes in order:

1. **Webhook Node**
   - Path: `8ef6128e-fc03-49ac-8b22-eb8a722157b0`
   - Response Mode: "responseNode"
   - HTTP Method: GET

2. **Airtable Search Node**
   - Operation: Search
   - Base: Rūmie (appMZMnPBKZnLh5hz)
   - Table: Memory (tblPWnPNlLYutH4cT)
   - Sort: CREATED DATE (desc)
   - Return All: Yes

3. **Code Node** (JavaScript)
   ```javascript
   // Get all items from Airtable
   const allRecords = $input.all().map(item => item.json);
   
   // Return as a single item with array
   return [{ json: allRecords }];
   ```

4. **Respond to Webhook Node**
   - Response Code: 200
   - Respond With: "First Entry" or "Using 'Respond to Webhook' Node"

**Important:** Do NOT add CORS headers in a Set node - this breaks the response. Let the CORS proxy handle CORS.

### Step 2: GitHub Pages Setup

1. **Create GitHub Repository**
   - Repository name: `rumurumurumu` (or any name)
   - Make it public

2. **Upload HTML File**
   - Upload `rumie-n8n-fixed.html`
   - Rename to `index.html`

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main
   - Folder: / (root)
   - Save

4. **Wait for Deployment**
   - Usually takes 1-2 minutes
   - Check at: `https://yourusername.github.io/reponame/`

### Step 3: Verify Everything Works

1. **Test n8n Webhook**
   - Open: `https://rumurumurumu.app.n8n.cloud/webhook/8ef6128e-fc03-49ac-8b22-eb8a722157b0`
   - Should return JSON array of records
   - Check that multiple records are returned (not just 1)

2. **Test CORS Proxy**
   - The HTML file uses: `https://corsproxy.io/?[encoded-webhook-url]`
   - This bypasses CORS restrictions

3. **Test Frontend**
   - Open GitHub Pages URL
   - Should load conversations automatically
   - Try clicking a conversation
   - Try the filter toggle
   - Try sharing a message

---

## Troubleshooting

### Issue: "Error loading data"

**Cause:** n8n webhook not responding or CORS issue

**Solutions:**
1. Check n8n workflow is active
2. Verify webhook URL is correct
3. Test webhook directly in browser
4. Check browser console for specific error

### Issue: "Only 1 record showing"

**Cause:** n8n workflow returning single record instead of array

**Solutions:**
1. Verify Code node is aggregating all records
2. Check "Respond to Webhook" settings
3. Remove any Set/Edit Fields nodes that might be wrapping data
4. Test workflow execution in n8n to see actual output

### Issue: "CORS policy blocked"

**Cause:** Browser blocking request due to missing CORS headers

**Solutions:**
1. Verify CORS proxy URL is being used
2. Don't try to add CORS headers in n8n Set node
3. Use the corsproxy.io proxy in the HTML file

### Issue: "500 Internal Server Error"

**Cause:** n8n workflow error or response too large

**Solutions:**
1. Check n8n workflow execution logs
2. Verify Code node syntax is correct
3. Test with limited records first (add limit to Airtable node)
4. Remove any malformed JSON in Set nodes

### Issue: "Messages not displaying properly on mobile"

**Cause:** CSS margins too large

**Solution:** Already fixed - messages now have 20px side margins and use full width

### Issue: "Filter not working"

**Cause:** JavaScript date filtering issue

**Solution:**
1. Check browser console for errors
2. Verify CREATED DATE field format in Airtable
3. Dates should be in ISO format

---

## Customization Guide

### Changing Colors

**Primary Purple Color** (#a855f7):
- Line 14: `.load-btn` background
- Line 21: `.conv:hover` and `.conv.active` border
- Line 36: `.user-bubble` gradient
- Line 47: `.category` colors
- Line 50: `.toast` background

**Dark Background** (#1a1a1a):
- Line 9: `body` background
- Line 25: `.main` background

### Changing Filter Default

In the JavaScript section, change line:
```javascript
let currentFilter = 'recent'; // Change to 'all' for all-time default
```

### Changing Recent Filter Duration

In the `showChat` function, modify:
```javascript
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Change 7 to any number of days
```

### Changing Message Margins

In the CSS section:
```css
.user-msg { ... padding-left: 20px; } /* Change 20px */
.bot-msg { ... padding-right: 20px; } /* Change 20px */
```

### Adding More Filter Options

1. Add button in filter bar HTML
2. Add filter logic in `showChat` function
3. Add active state handling in `setFilter` function

Example for "This Month" filter:
```javascript
if (currentFilter === 'month') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    filteredMsgs = msgs.filter(msg => new Date(msg['CREATED DATE']) >= startOfMonth);
}
```

---

## Data Flow

### Loading Conversations

1. User opens GitHub Pages URL
2. JavaScript calls `loadData()` function
3. Fetches data through CORS proxy from n8n webhook
4. n8n triggers workflow → Airtable node fetches all records
5. Code node aggregates records into array
6. Respond to Webhook returns JSON
7. CORS proxy forwards response with proper headers
8. JavaScript parses response
9. `renderConversations()` groups messages by CHAT ID
10. Displays conversation list in sidebar

### Viewing a Conversation

1. User clicks conversation in sidebar
2. `showChat()` function is called with chatId and messages
3. Applies current filter (recent/all)
4. Generates HTML for header, filter bar, and messages
5. Checks URL for `?msg=` parameter
6. If present, scrolls to and highlights specific message
7. Renders everything in main content area

### Sharing a Message

1. User clicks "Share this message" button
2. `shareMessage()` function generates URL with chat and msg parameters
3. Copies URL to clipboard
4. Shows success toast
5. When someone opens the link:
   - `loadData()` loads all conversations
   - `openSharedChat()` finds the conversation
   - `showChat()` displays it
   - Scrolls to message with matching R-ID
   - Highlights message with purple animation

---

## File Structure

```
rumie-n8n-fixed.html
├── HTML Structure
│   ├── Sidebar (conversation list)
│   └── Main (conversation view)
│
├── CSS Styles
│   ├── Layout & containers
│   ├── Sidebar components
│   ├── Message bubbles
│   ├── Filter bar
│   ├── Share buttons
│   └── Animations
│
└── JavaScript
    ├── Configuration
    │   ├── Webhook URL
    │   └── CORS proxy URL
    │
    ├── Data Loading
    │   ├── loadData() - Fetch from webhook
    │   ├── refreshData() - Reload conversations
    │   └── Response parsing logic
    │
    ├── Rendering
    │   ├── renderConversations() - Sidebar list
    │   ├── showChat() - Main conversation view
    │   ├── formatHtmlMessage() - Bot message formatting
    │   └── escapeHtml() - User message sanitization
    │
    ├── Filtering
    │   └── setFilter() - Toggle between recent/all
    │
    ├── Sharing
    │   ├── shareConversation() - Copy conversation link
    │   ├── shareMessage() - Copy message link
    │   └── openSharedChat() - Handle shared links
    │
    └── Utilities
        └── showToast() - Show notifications
```

---

## Key Technical Decisions

### Why CORS Proxy?

n8n webhooks only support GET and POST methods, not OPTIONS. When a browser makes a cross-origin request, it first sends an OPTIONS "preflight" request to check CORS permissions. Since n8n can't handle OPTIONS requests, the browser blocks the actual request.

Solution: Use corsproxy.io which:
1. Receives the request from our frontend
2. Makes the request to n8n on our behalf (server-side, no CORS)
3. Returns the response with proper CORS headers

### Why Not Use Airtable API Directly?

Could work, but requires:
- API key in frontend code (security risk)
- More complex authentication
- Additional API call management

The n8n webhook approach:
- No API keys exposed
- Centralized data fetching logic
- Can add transformations in n8n if needed
- Already set up for the Telegram bot workflow

### Why Single HTML File?

Benefits:
- Easy deployment (just upload one file)
- No build process needed
- Works on any static hosting
- Easy to share and backup
- No dependencies to manage

Trade-offs:
- Larger file size
- Less modular code
- Harder to version control parts

For this use case, simplicity wins.

### Why GitHub Pages?

- Free hosting
- Automatic HTTPS
- Easy deployment (git push or web upload)
- Good reliability and performance
- No server management needed

---

## Future Enhancement Ideas

### Potential Features

1. **Search Functionality**
   - Search messages by keyword
   - Filter by category
   - Filter by date range

2. **Analytics Dashboard**
   - Messages per day/week
   - Most common categories
   - Average response time
   - User engagement metrics

3. **Export Options**
   - Export conversation as PDF
   - Export as CSV
   - Print-friendly view

4. **Advanced Filters**
   - Filter by category
   - Filter by date range picker
   - Filter by user
   - Combine multiple filters

5. **Message Actions**
   - Flag important messages
   - Add notes to conversations
   - Archive conversations

6. **Real-time Updates**
   - Auto-refresh every X minutes
   - Show "new messages" indicator
   - WebSocket connection for live updates

### Implementation Considerations

Most features would require:
- Backend storage (can't store in HTML)
- Authentication system
- More complex architecture

Options:
- Add Firebase for storage/auth
- Build proper backend (Node.js/Python)
- Use Airtable API for read/write
- Add n8n workflows for additional operations

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check GitHub Pages is still live
- Verify n8n workflow is active
- Test loading conversations

**Monthly:**
- Review Airtable storage usage
- Check CORS proxy service status
- Test on mobile devices

**As Needed:**
- Update HTML file for new features
- Clear old conversations from Airtable
- Monitor performance with growing data

### Backup Strategy

1. **HTML File**
   - Keep in GitHub repository
   - Download local copy periodically
   - Version control with git

2. **Airtable Data**
   - Airtable has automatic backups
   - Export CSV monthly for redundancy
   - Document base structure

3. **n8n Workflow**
   - Export workflow JSON
   - Save to GitHub or local storage
   - Document any changes made

---

## Support & Resources

### Documentation Links

- **n8n Docs:** https://docs.n8n.io/
- **Airtable API:** https://airtable.com/developers/web/api/introduction
- **GitHub Pages:** https://docs.github.com/pages

### Key Contacts

- **Artistic Director:** Peter
- **Technical Questions:** Check n8n workflow execution logs
- **Hosting Issues:** GitHub support

### Getting Help

1. Check browser console for errors (F12)
2. Review this guide's troubleshooting section
3. Test each component individually
4. Check n8n workflow execution history
5. Verify Airtable data is correct

---

## Version History

### v1.0 - Initial Release
- Basic conversation viewer
- Sidebar with conversation list
- Message display with formatting
- Share conversation feature

### v1.1 - Mobile Optimization
- Reduced message margins to 20px
- Full-width messages on mobile
- Better responsive design

### v1.2 - Filtering & Sharing
- Added Recent/All Time filter
- Share individual messages
- Message highlighting on share
- Display Telegram username

### v1.3 - CORS Fix
- Implemented CORS proxy solution
- Resolved GitHub Pages compatibility
- Fixed webhook data fetching

---

## Technical Specifications

**Frontend:**
- HTML5
- CSS3 (no frameworks)
- Vanilla JavaScript (no libraries)
- Responsive design

**Data Format:**
- JSON array of objects
- Each object represents one message
- Fields match Airtable column names

**Browser Support:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- Requires fetch API support

**Performance:**
- Loads all conversations at once
- Client-side filtering and sorting
- Minimal external dependencies
- Fast page load (<2s on good connection)

---

## Conclusion

The Rūmie Conversations Viewer provides a clean, functional interface for reviewing chatbot interactions. It's designed to be simple, maintainable, and easy to deploy while providing all the essential features needed for conversation management.

For questions or issues, refer to the troubleshooting section or review the n8n workflow execution logs.
