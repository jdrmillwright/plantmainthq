const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure static files are built if missing
if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('[PlantMaintHQ] dist not found, generating static files...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('[PlantMaintHQ] Error building static site:', error);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'plantmainthq' });
});

// Endpoint to handle consultation requests and mirror inquiries to local ledger
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, company, industry, teamSize, currentSystem, inquiryType, message } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(email).trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const newInquiry = {
      id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      name: String(name).trim(),
      email: String(email).trim(),
      company: company ? String(company).trim() : '',
      industry: industry ? String(industry).trim() : '',
      teamSize: teamSize ? String(teamSize).trim() : '',
      currentSystem: currentSystem ? String(currentSystem).trim() : '',
      inquiryType: inquiryType ? String(inquiryType).trim() : 'General Inquiry',
      message: message ? String(message).trim() : '',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    };

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const inquiriesFilePath = path.join(dataDir, 'inquiries.json');
    let inquiries = [];
    if (fs.existsSync(inquiriesFilePath)) {
      try {
        const raw = fs.readFileSync(inquiriesFilePath, 'utf-8');
        inquiries = JSON.parse(raw);
      } catch (err) {
        console.error('[PlantMaintHQ] Error reading inquiries.json:', err);
        inquiries = [];
      }
    }

    inquiries.unshift(newInquiry);
    fs.writeFileSync(inquiriesFilePath, JSON.stringify(inquiries, null, 2), 'utf-8');

    console.log(`[PlantMaintHQ] 📥 New inquiry recorded for ${newInquiry.name} (${newInquiry.email}) - Type: ${newInquiry.inquiryType}`);

    return res.status(200).json({
      success: true,
      message: 'Inquiry received successfully.',
      inquiryId: newInquiry.id
    });
  } catch (error) {
    console.error('[PlantMaintHQ] Error saving contact inquiry:', error);
    return res.status(500).json({ success: false, error: 'Internal server error processing inquiry.' });
  }
});

// Admin/Internal read endpoint to view inquiries (JSON)
app.get('/api/inquiries', (req, res) => {
  const inquiriesFilePath = path.join(__dirname, 'data', 'inquiries.json');
  if (fs.existsSync(inquiriesFilePath)) {
    try {
      const raw = fs.readFileSync(inquiriesFilePath, 'utf-8');
      return res.json(JSON.parse(raw));
    } catch {
      return res.json([]);
    }
  }
  return res.json([]);
});

// Dedicated Inquiries & Leads Dashboard UI (/admin/inquiries and /leads)
function renderAdminInquiriesHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiries & Leads | PlantMaintHQ Admin</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --success: #16a34a;
      --warning: #d97706;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 1.5rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }
    .logo { font-size: 1.35rem; font-weight: 800; color: #0f172a; text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
    .logo span { color: var(--primary); }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid var(--border);
      background: #fff;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot-green { background: var(--success); }
    .dot-amber { background: var(--warning); }
    
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .stat-val { font-size: 1.85rem; font-weight: 800; color: #0f172a; }
    .stat-label { font-size: 0.82rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;
    }
    .search-box input {
      width: 100%;
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 0.95rem;
      background: #fff;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: #fff; border-color: var(--border); color: #1e293b; }
    .btn-outline:hover { background: #f1f5f9; }

    .inquiry-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: border-color 0.15s ease;
    }
    .inquiry-card:hover { border-color: #94a3b8; }
    .inquiry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .inquiry-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
    .inquiry-type {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }
    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .meta-tag {
      background: #f1f5f9;
      color: #334155;
      font-size: 0.8rem;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .inquiry-msg {
      background: #f8fafc;
      border-left: 3px solid var(--primary);
      padding: 0.75rem 1rem;
      border-radius: 0 6px 6px 0;
      font-size: 0.92rem;
      color: #334155;
      margin-bottom: 0.85rem;
      white-space: pre-wrap;
    }
    .inquiry-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
    .timestamp { font-size: 0.8rem; color: var(--text-muted); }
    .info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      color: #1e3a8a;
      line-height: 1.6;
    }
    .info-box code {
      background: #dbeafe;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
    }
    #emptyState {
      text-align: center;
      padding: 3rem 1rem;
      background: #fff;
      border-radius: 10px;
      border: 1px dashed var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <a href="/" class="logo">⚙️ PlantMaint<span>HQ</span> Admin</a>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Advisory Intake & Consultation Leads Manager</p>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <span class="status-badge" id="emailStatusBadge">
          <span class="status-dot dot-amber"></span> Checking notification status...
        </span>
        <a href="/" class="btn btn-outline">Back to Website ↗</a>
      </div>
    </header>

    <div class="info-box" id="notificationInfoBanner">
      <strong>📬 Email Forwarding Target:</strong> <code id="destEmailText">jason@plantmainthq.com</code>
      <div id="notificationDetails" style="margin-top: 0.35rem;">
        Every inquiry submitted via <code>/contact</code> is recorded here in real-time. To also forward instant alerts directly to your email inbox, configure your email provider (Resend API key or Gmail SMTP) in project environment variables.
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-val" id="totalCount">0</div>
        <div class="stat-label">Total Inquiries</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="todayCount">0</div>
        <div class="stat-label">Received Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" id="shortlistCount">0</div>
        <div class="stat-label">Shortlist Requests</div>
      </div>
    </div>

    <div class="action-bar">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Search by name, email, company, or requirement..." oninput="filterInquiries()" />
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-outline" onclick="loadInquiries()">🔄 Refresh</button>
        <button class="btn btn-primary" onclick="exportCsv()">📥 Export to CSV</button>
      </div>
    </div>

    <div id="inquiriesList">
      <div id="emptyState">Loading inquiries...</div>
    </div>
  </div>

  <script>
    var allInquiries = [];

    function checkNotificationStatus() {
      fetch('/api/notification-status')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          var badge = document.getElementById('emailStatusBadge');
          var destEmail = document.getElementById('destEmailText');
          var details = document.getElementById('notificationDetails');
          if (destEmail) destEmail.textContent = data.notificationEmail || 'jason@plantmainthq.com';

          if (data.isEmailConfigured) {
            badge.innerHTML = '<span class="status-dot dot-green"></span> Email Forwarding Active (' + data.provider + ')';
            details.innerHTML = '✅ Automatic email alerts are <strong>ACTIVE</strong>. Every new submission is automatically emailed to <strong>' + (data.notificationEmail || 'jason@plantmainthq.com') + '</strong>.';
          } else {
            badge.innerHTML = '<span class="status-dot dot-amber"></span> Saved Locally (Inbox Ready)';
            details.innerHTML = 'ℹ️ Leads are saved safely to <code>data/inquiries.json</code> and visible right here. To receive instant emails at <strong>' + (data.notificationEmail || 'jason@plantmainthq.com') + '</strong>, add <code>RESEND_API_KEY</code> or <code>SMTP_*</code> credentials.';
          }
        })
        .catch(function(err) {
          console.error('Error fetching notification status:', err);
        });
    }

    function loadInquiries() {
      fetch('/api/inquiries')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          allInquiries = Array.isArray(data) ? data : [];
          updateStats();
          renderList(allInquiries);
        })
        .catch(function(err) {
          document.getElementById('inquiriesList').innerHTML = '<div id="emptyState" style="color: #dc2626;">Failed to load inquiries: ' + err.message + '</div>';
        });
    }

    function updateStats() {
      document.getElementById('totalCount').textContent = allInquiries.length;
      
      var today = new Date().toISOString().split('T')[0];
      var todayInqs = allInquiries.filter(function(item) {
        return (item.timestamp || '').startsWith(today);
      });
      document.getElementById('todayCount').textContent = todayInqs.length;

      var shortlists = allInquiries.filter(function(item) {
        return (item.inquiryType || '').toLowerCase().indexOf('shortlist') !== -1;
      });
      document.getElementById('shortlistCount').textContent = shortlists.length;
    }

    function renderList(inquiries) {
      var container = document.getElementById('inquiriesList');
      if (!inquiries || inquiries.length === 0) {
        container.innerHTML = '<div id="emptyState"><h3>No inquiries found</h3><p style="color: var(--text-muted); margin-top: 0.5rem;">New contact and advisory submissions from the website will appear here in real-time.</p></div>';
        return;
      }

      var html = inquiries.map(function(item) {
        var replySubject = encodeURIComponent('PlantMaintHQ: Re: ' + (item.inquiryType || 'CMMS Advisory Inquiry'));
        var replyBody = encodeURIComponent('Hi ' + (item.name || 'there') + ',\n\nThank you for reaching out to PlantMaintHQ regarding ' + (item.inquiryType || 'your maintenance software inquiry') + '.\n\n');
        var mailtoUrl = 'mailto:' + encodeURIComponent(item.email) + '?subject=' + replySubject + '&body=' + replyBody;
        var dateFormatted = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown date';

        return '<div class="inquiry-card">' +
          '<div class="inquiry-header">' +
            '<div>' +
              '<div class="inquiry-title">' + escapeHtml(item.name) + ' ' + (item.company ? '<span style="color: var(--text-muted); font-weight: 500; font-size: 0.95rem;">@ ' + escapeHtml(item.company) + '</span>' : '') + '</div>' +
              '<div style="font-size: 0.88rem; color: #2563eb; font-weight: 600; margin-top: 0.15rem;"><a href="' + mailtoUrl + '" style="color: inherit; text-decoration: underline;">' + escapeHtml(item.email) + '</a></div>' +
            '</div>' +
            '<span class="inquiry-type">' + escapeHtml(item.inquiryType || 'General') + '</span>' +
          '</div>' +
          '<div class="meta-tags">' +
            (item.industry ? '<span class="meta-tag">🏭 ' + escapeHtml(item.industry) + '</span>' : '') +
            (item.teamSize ? '<span class="meta-tag">👥 ' + escapeHtml(item.teamSize) + '</span>' : '') +
            (item.currentSystem ? '<span class="meta-tag">⚙️ Current: ' + escapeHtml(item.currentSystem) + '</span>' : '') +
            (item.id ? '<span class="meta-tag" style="font-family: monospace; font-size: 0.75rem;">' + escapeHtml(item.id) + '</span>' : '') +
          '</div>' +
          (item.message ? '<div class="inquiry-msg">' + escapeHtml(item.message) + '</div>' : '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin-bottom: 0.75rem;">No message provided</div>') +
          '<div class="inquiry-actions">' +
            '<span class="timestamp">📅 ' + dateFormatted + '</span>' +
            '<a href="' + mailtoUrl + '" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">✉️ Reply to Lead</a>' +
          '</div>' +
        '</div>';
      }).join('');

      container.innerHTML = html;
    }

    function filterInquiries() {
      var query = (document.getElementById('searchInput').value || '').toLowerCase().trim();
      if (!query) {
        renderList(allInquiries);
        return;
      }
      var filtered = allInquiries.filter(function(item) {
        var str = [item.name, item.email, item.company, item.industry, item.teamSize, item.currentSystem, item.inquiryType, item.message].join(' ').toLowerCase();
        return str.indexOf(query) !== -1;
      });
      renderList(filtered);
    }

    function exportCsv() {
      if (!allInquiries || allInquiries.length === 0) {
        alert('No inquiries available to export.');
        return;
      }
      var headers = ['ID', 'Timestamp', 'Name', 'Email', 'Company', 'Industry', 'Team Size', 'Current System', 'Inquiry Type', 'Message'];
      var rows = allInquiries.map(function(item) {
        return [
          item.id || '',
          item.timestamp || '',
          '"' + (item.name || '').replace(/"/g, '""') + '"',
          '"' + (item.email || '').replace(/"/g, '""') + '"',
          '"' + (item.company || '').replace(/"/g, '""') + '"',
          '"' + (item.industry || '').replace(/"/g, '""') + '"',
          '"' + (item.teamSize || '').replace(/"/g, '""') + '"',
          '"' + (item.currentSystem || '').replace(/"/g, '""') + '"',
          '"' + (item.inquiryType || '').replace(/"/g, '""') + '"',
          '"' + (item.message || '').replace(/"/g, '""') + '"'
        ].join(',');
      });
      var csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\\n');
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'plantmainthq-leads-' + new Date().toISOString().split('T')[0] + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function escapeHtml(str) {
      return String(str || '').replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    }

    // Init on load
    checkNotificationStatus();
    loadInquiries();
  </script>
</body>
</html>`;
}

// Serve the admin inquiries dashboard at /admin/inquiries and /leads
app.get(['/admin/inquiries', '/admin/leads', '/leads'], (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderAdminInquiriesHtml());
});

// Serve static assets from public and dist (with index.html serving and extension matching)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(DIST_DIR, { extensions: ['html'] }));

// Fallback to index.html for any unmatched routes
app.use((req, res) => {
  const indexFile = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('PlantMaintHQ - Page not found');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`PlantMaintHQ running on http://${HOST}:${PORT}`);
});
