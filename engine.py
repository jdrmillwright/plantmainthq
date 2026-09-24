#!/usr/bin/env python3
"""
PlantMaintHQ Static Site Generation Engine (Clean B2B Edition)
Compiles 106 programmatic CMMS platform teardowns, 5,565 head-to-head comparison pages,
master directory catalog, XML sitemap, and data bundles.
"""
import json, os, shutil, itertools, html, re
from datetime import datetime
import time

t_start = time.time()
DOMAIN = "https://plantmainthq.com"
SITE_NAME = "PlantMaintHQ"
TODAY = datetime.now().strftime("%Y-%m-%d")

print(">>> [1/5] Loading 106 CMMS Dataset & Initializing Public Assets...")
os.makedirs("public", exist_ok=True)
os.makedirs("public/cmms", exist_ok=True)
os.makedirs("public/vs", exist_ok=True)
os.makedirs("public/contact", exist_ok=True)

# Copy static assets into public directory
for static_file in [
    "favicon.svg", "favicon.ico", "apple-touch-icon.png", "og-image.png", "og-banner.png",
    "style.css", "analytics.js", "robots.txt", "404.html", "contact.html"
]:
    if os.path.exists(static_file):
        shutil.copy2(static_file, os.path.join("public", static_file))

if os.path.exists("contact.html"):
    shutil.copy2("contact.html", "public/contact/index.html")

# Load CMMS platforms database
with open("cmms_data.json", "r", encoding="utf-8") as f:
    platforms = json.load(f)

# Sort primarily by rating descending, then name
platforms = sorted(platforms, key=lambda x: (-x.get("overall_rating", 0), x["name"]))
total_platforms = len(platforms)
sitemap_urls = [f"{DOMAIN}/", f"{DOMAIN}/contact"]

print(f"    Loaded {total_platforms} verified CMMS platforms.")

# Helper HTML Components
def get_common_head(title, description, canonical_url, schema_json=None, og_image=None):
    if not og_image:
        og_image = f"{DOMAIN}/og-image.png"
    schema_script = f'<script type="application/ld+json">{schema_json}</script>' if schema_json else ""
    return f"""
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(title)}</title>
    <meta name="description" content="{html.escape(description)}">
    <link rel="canonical" href="{canonical_url}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="stylesheet" href="/style.css">
    <script src="/analytics.js" defer></script>
    <meta property="og:title" content="{html.escape(title)}">
    <meta property="og:description" content="{html.escape(description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:site_name" content="{SITE_NAME}">
    <meta property="og:image" content="{og_image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{html.escape(title)}">
    <meta name="twitter:description" content="{html.escape(description)}">
    <meta name="twitter:image" content="{og_image}">
    {schema_script}
"""

def get_header_html(active_nav="directory"):
    dir_active = " class=\"active\"" if active_nav == "directory" else ""
    matrix_active = " class=\"active\"" if active_nav == "matrix" else ""
    guide_active = " class=\"active\"" if active_nav == "guide" else ""
    return f"""
    <header>
      <div class="nav-container">
        <a href="/" class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          PlantMaint<span class="logo-brand">HQ</span>
        </a>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <nav class="nav-links">
            <a href="/#directory"{dir_active}>CMMS Directory</a>
            <a href="/#matrix"{matrix_active}>Comparison Matrix</a>
            <a href="/#guide"{guide_active}>Evaluation Criteria</a>
            <a href="/contact/">Advisor Help</a>
          </nav>
          <button class="hamburger-btn" id="mobile-menu-toggle" aria-label="Toggle Navigation Menu">
            <svg class="hamburger-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Slide-Down Drawer Menu -->
      <div class="nav-drawer" id="nav-drawer">
        <div class="nav-drawer-inner">
          <div class="drawer-section">
            <div class="drawer-heading">Directory Navigation</div>
            <a href="/#directory" class="drawer-link" onclick="closeDrawer()">
              <span class="drawer-icon">&#128194;</span>
              <div>
                <strong>Full CMMS Directory</strong>
                <span class="drawer-subtext">All 106 vetted maintenance platforms</span>
              </div>
            </a>
            <a href="/#matrix" class="drawer-link" onclick="closeDrawer()">
              <span class="drawer-icon">&#9878;&#65039;</span>
              <div>
                <strong>Head-to-Head Compare (/vs/)</strong>
                <span class="drawer-subtext">Side-by-side specs, pricing &amp; ratings</span>
              </div>
            </a>
            <a href="/#directory" class="drawer-link" onclick="closeDrawer(); filterByTag('mobile');">
              <span class="drawer-icon">&#128241;</span>
              <div>
                <strong>Top Mobile-First CMMS</strong>
                <span class="drawer-subtext">Shop-floor iOS &amp; Android ready tools</span>
              </div>
            </a>
          </div>

          <div class="drawer-section">
            <div class="drawer-heading">By Industry</div>
            <div class="drawer-chips">
              <a href="/#directory" class="drawer-chip" onclick="closeDrawer(); filterByTag('manufacturing');">Manufacturing</a>
              <a href="/#directory" class="drawer-chip" onclick="closeDrawer(); filterByTag('energy');">Power &amp; Energy</a>
              <a href="/#directory" class="drawer-chip" onclick="closeDrawer(); filterByTag('facilities');">Facilities</a>
              <a href="/#directory" class="drawer-chip" onclick="closeDrawer(); filterByTag('fleet');">Fleet</a>
            </div>
          </div>

          <div class="drawer-section">
            <div class="drawer-heading">Expert Advisory</div>
            <a href="/roi-calculator/" class="drawer-link" onclick="closeDrawer()" style="background:#f8fafc; border:1px solid var(--border-color); margin-bottom: 0.5rem;">
              <span class="drawer-icon">&#128200;</span>
              <div>
                <strong>ROI Calculator</strong>
                <span class="drawer-subtext">Estimate your software payback period</span>
              </div>
            </a>
            <a href="/contact/" class="drawer-link drawer-cta" onclick="closeDrawer()">
              <span class="drawer-icon">&#128172;</span>
              <div>
                <strong>Request Advisor Advice (/contact/)</strong>
                <span class="drawer-subtext" style="color:#dbeafe;">Unbiased vendor matching &amp; procurement guidance</span>
              </div>
            </a>
          </div>
        </div>
      </div>
      <div class="drawer-backdrop" id="drawer-backdrop"></div>
    </header>
"""

def get_footer_html():
    return f"""
    <footer>
      <div class="container footer-inner">
        <div>
          <strong>PlantMaintHQ</strong> &copy; {datetime.now().year} &bull; Independent CMMS &amp; EAM Software Engineering Directory.
        </div>
        <div class="footer-links">
          <a href="/#directory">Directory</a>
          <a href="/#matrix">Matrix</a>
          <a href="/#guide">Evaluation Criteria</a>
          <a href="/contact">Advisor Contact</a>
          <a href="/sitemap.xml">Sitemap</a>
        </div>
      </div>
    </footer>
"""

# ==============================================================================
# Step 2: Compile Master Directory Homepage (index.html)
# ==============================================================================
print(f">>> [2/5] Compiling Master CMMS Directory Homepage (106 platforms)...")

cards_html_list = []
matrix_rows_list = []

for idx, p in enumerate(platforms):
    slug = p["slug"]
    name = p["name"]
    tagline = p.get("tagline", "")
    rating = p.get("overall_rating", 4.7)
    reviews = p.get("review_count", 350)
    timeline = p.get("deployment_timeline", "2 to 4 weeks")
    price = p.get("starting_price_tier", "Contact Vendor")
    scales = p.get("target_company_scales", [])
    verticals = p.get("supported_industry_verticals", [])[:3]
    pros_preview = p.get("pros", [])[:2]

    scales_html = "".join([f'<span class="pill" style="font-size:0.75rem;">{html.escape(s)}</span>' for s in scales[:2]])
    verticals_html = "".join([f'<span class="pill" style="font-size:0.75rem; background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe;">{html.escape(v)}</span>' for v in verticals])
    
    pros_html = "".join([
        f'<div style="display:flex; align-items:flex-start; gap:6px; font-size:0.85rem; color:#475569; margin-bottom:4px;">'
        f'<span style="color:#059669; font-weight:800;">&#10003;</span><span>{html.escape(pro)}</span></div>'
        for pro in pros_preview
    ])

    card = f"""
    <article class="platform-card" data-slug="{slug}" data-name="{name.lower()}" data-scale="{' '.join(scales).lower()}">
      <div class="platform-card-header">
        <div class="platform-info">
          <h2><a href="/cmms/{slug}/">{html.escape(name)}</a></h2>
          <p class="platform-tagline">{html.escape(tagline)}</p>
        </div>
        <span class="rating-badge">&#9733; {rating} / 5.0</span>
      </div>

      <div class="grid-stats-mobile" style="margin-bottom: 1rem; gap: 0.75rem;">
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Implementation</div>
          <div class="metric-stat-val" style="color:var(--primary); font-size:0.95rem;">{html.escape(timeline)}</div>
        </div>
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Starting Price</div>
          <div class="metric-stat-val" style="color:#0f172a; font-size:0.95rem;">{html.escape(price)}</div>
        </div>
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Free Trial</div>
          <div class="metric-stat-val" style="color:#059669; font-size:0.95rem;">{html.escape(p.get('free_trial_text', 'Yes'))}</div>
        </div>
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Founded</div>
          <div class="metric-stat-val" style="color:#0f172a; font-size:0.95rem;">{p.get('founded_year', 2015)}</div>
        </div>
      </div>

      <div style="margin-bottom: 0.85rem;">
        {scales_html}
        {verticals_html}
      </div>

      <div style="margin-bottom: 1.25rem;">
        {pros_html}
      </div>

      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; pt:8px; border-top:1px solid var(--border-color); padding-top:12px;">
        <a href="/cmms/{slug}/" class="btn btn-primary" style="font-size:0.85rem; padding:0.5rem 1rem;">
          Read Review &amp; Teardown &rarr;
        </a>
        <a href="/go/{slug}/" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size:0.85rem; padding:0.5rem 1rem;" data-track="visit_site" data-platform="{name}" data-slug="{slug}">
          Official Website &#8599;
        </a>
      </div>
    </article>
"""
    cards_html_list.append(card)

    # Top 20 for matrix table
    if idx < 20:
        matrix_rows_list.append(f"""
        <tr>
          <td><strong><a href="/cmms/{slug}/" style="color:var(--text-main); text-decoration:none;">{html.escape(name)}</a></strong></td>
          <td class="font-mono" style="color:var(--primary); font-weight:700;">{html.escape(timeline)}</td>
          <td class="font-mono">{html.escape(price)}</td>
          <td><span class="rating-badge" style="font-size:0.75rem; padding:0.2rem 0.5rem;">&#9733; {rating}</span></td>
          <td>{html.escape(p.get('deployment_timeline', 'Cloud'))}</td>
          <td><span class="pill" style="font-size:0.75rem;">{html.escape(verticals[0] if verticals else 'Manufacturing')}</span></td>
          <td><a href="/cmms/{slug}/" class="btn btn-outline" style="padding:0.25rem 0.65rem; font-size:0.75rem;">Review &rarr;</a></td>
        </tr>
""")

CLIENT_SEARCH_SCRIPT = """<script>
    document.addEventListener('DOMContentLoaded', function() {
      var searchInput = document.getElementById('cmms-search');
      var filterButtons = document.querySelectorAll('#scale-filters .filter-pill');
      var cards = document.querySelectorAll('.platform-card');
      var statusEl = document.getElementById('filter-status');
      var currentFilter = 'all';

      function filterCards() {
        var query = (searchInput.value || '').toLowerCase().trim();
        var visibleCount = 0;
        cards.forEach(function(card) {
          var text = card.textContent.toLowerCase();
          var scale = (card.getAttribute('data-scale') || '').toLowerCase();
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesFilter = currentFilter === 'all' || scale.indexOf(currentFilter) !== -1;
          var isVisible = matchesQuery && matchesFilter;
          card.style.display = isVisible ? 'block' : 'none';
          if (isVisible) visibleCount++;
        });

        if (statusEl) {
          statusEl.textContent = 'Showing ' + visibleCount + ' of ' + cards.length + ' platforms';
        }
      }

      if (searchInput) {
        searchInput.addEventListener('input', filterCards);
        searchInput.addEventListener('keyup', filterCards);
        searchInput.addEventListener('paste', function() { setTimeout(filterCards, 10); });
      }

      filterButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          filterButtons.forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          currentFilter = this.getAttribute('data-filter');
          filterCards();
        });
      });

      var urlParams = new URLSearchParams(window.location.search);
      var queryFilter = urlParams.get('filter');
      if (queryFilter && searchInput) {
        searchInput.value = queryFilter;
        filterCards();
      }
    });
</script>"""

schema_catalog = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "PlantMaintHQ - Top 106 CMMS & EAM Software Directory 2026",
    "description": "Comprehensive independent directory and teardown of 106 Computerized Maintenance Management Systems for plant maintenance managers and reliability engineers.",
    "url": f"{DOMAIN}/",
    "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "url": DOMAIN
    }
}

homepage_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(
      "PlantMaintHQ | Top 106 CMMS & EAM Software Directory 2026",
      "Independent technical directory, pricing breakdown, and head-to-head comparisons for 106 top CMMS platforms including Limble, MaintainX, UpKeep, Fiix, and eMaint.",
      f"{DOMAIN}/",
      json.dumps(schema_catalog)
  )}
</head>
<body>
  {get_header_html("directory")}

  <main class="container">
    <section class="hero">
      <span class="badge">Independent CMMS &amp; EAM Software Directory</span>
      <h1>Find &amp; Compare Top CMMS Software for <span style="color:var(--primary);">Plant Operations</span></h1>
      <p>
        Unbiased technical teardowns, deployment lead times, starting price tiers, and frontline mobile adoption benchmarks across 106 verified maintenance management platforms.
      </p>

      <div class="trust-grid" style="margin-top: 2rem;">
        <div class="trust-card">
          <div class="trust-number font-mono">{total_platforms}</div>
          <div class="trust-label">Platforms Audited</div>
        </div>
        <div class="trust-card">
          <div class="trust-number font-mono">15+</div>
          <div class="trust-label">Industrial Sectors</div>
        </div>
        <div class="trust-card">
          <div class="trust-number font-mono">100%</div>
          <div class="trust-label">Independent Analysis</div>
        </div>
        <div class="trust-card">
          <div class="trust-number font-mono">Zero</div>
          <div class="trust-label">Vendor Paywalls / Sponsored Ranks</div>
        </div>
      </div>
    </section>

    <!-- Live Client-Side Filter Bar (Directly Under Stat Grid) -->
    <section class="controls-card" id="directory">
      <div style="position:relative;">
        <input type="text" id="cmms-search" class="search-input" placeholder="Filter 106 platforms (e.g. MaintainX, Offline, SAP, Free Trial)...">
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-top:0.25rem;">
        <div class="filter-pills" id="scale-filters">
          <span style="font-size:0.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Company Scale:</span>
          <button class="filter-pill active" data-filter="all">All Scales</button>
          <button class="filter-pill" data-filter="small">Small (1-50)</button>
          <button class="filter-pill" data-filter="mid-market">Mid-Market (51-500)</button>
          <button class="filter-pill" data-filter="enterprise">Enterprise (500+)</button>
        </div>
        <div id="filter-status" style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">
          Showing {total_platforms} of {total_platforms} platforms
        </div>
      </div>
    </section>

    <!-- Platform Directory Cards List -->
    <section id="platforms-container">
      {"".join(cards_html_list)}
    </section>

    <!-- Top 20 Comparison Matrix -->
    <section class="card" id="matrix">
      <h2>Top CMMS Comparison Matrix</h2>
      <p style="color:var(--text-muted); margin-bottom: 1.5rem;">
        Direct comparison of implementation speeds, entry pricing models, and verified ratings across leading industrial maintenance tools.
      </p>
      <div style="overflow-x: auto;">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Implementation</th>
              <th>Starting Price</th>
              <th>Rating</th>
              <th>Deployment</th>
              <th>Primary Vertical</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {"".join(matrix_rows_list)}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Buyer's Guide & Evaluation Criteria -->
    <section class="card" id="guide">
      <h2>CMMS Buyer's Guide: 4 Key Evaluation Pillars for Plant Operations</h2>
      <p style="color:var(--text-muted); margin-bottom: 1.5rem; line-height:1.7;">
        Selecting software for plant maintenance requires balancing frontline adoption with executive data integrity. Prioritize tools that mechanics actually enjoy logging into.
      </p>

      <div class="grid-2">
        <div class="capability-card">
          <h4>1. Technician Mobile UX &amp; Offline Sync</h4>
          <p>Prioritize systems with true offline mobile sync so work orders, meter readings, and photo uploads work seamlessly inside metal-shielded plants or remote utility rooms.</p>
        </div>
        <div class="capability-card">
          <h4>2. Implementation Velocity &amp; Data Migration</h4>
          <p>Implementation timelines range from 48 hours for agile cloud tools up to 12 weeks for complex enterprise suites. Balance your team's internal IT bandwidth accordingly.</p>
        </div>
        <div class="capability-card">
          <h4>3. MRO Spare Parts Inventory &amp; Min/Max Alerts</h4>
          <p>Stockouts cause expensive catastrophic downtime. Choose CMMS tools with automated purchase order generation, barcode scanning, and min/max inventory triggers.</p>
        </div>
        <div class="capability-card">
          <h4>4. Condition-Based Monitoring &amp; IoT Telemetry</h4>
          <p>Transition from reactive firefighting to predictive reliability by evaluating direct sensor compatibility (vibration, thermal, run-hours) and PLC/SCADA integration.</p>
        </div>
      </div>
    </section>
  </main>

  {get_footer_html()}
  {CLIENT_SEARCH_SCRIPT}
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(homepage_html)
with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(homepage_html)

# ==============================================================================
# Step 3: Compile Dedicated Product Teardown Pages (/cmms/<slug>/index.html)
# ==============================================================================
print(f">>> [3/5] Compiling 106 Dedicated CMMS Product Teardowns...")

for p in platforms:
    slug = p["slug"]
    name = p["name"]
    tagline = p.get("tagline", "")
    description = p.get("description", "")
    website = p.get("website", "")
    founded = p.get("founded_year", 2015)
    timeline = p.get("deployment_timeline", "2 to 4 weeks")
    price = p.get("starting_price_tier", "Contact Vendor")
    overall_rating = p.get("overall_rating", 4.7)
    review_count = p.get("review_count", 350)
    free_trial_text = p.get("free_trial_text", "Yes")
    has_free_trial = p.get("has_free_trial", True)
    verticals = p.get("supported_industry_verticals", [])
    scales = p.get("target_company_scales", [])
    deployment_types = p.get("deployment_types", ["Cloud / SaaS"])
    capabilities = p.get("core_capabilities", [])
    pros = p.get("pros", [])
    limitations = p.get("limitations", [])
    teardown = p.get("editorial_teardown", {})

    canonical_url = f"{DOMAIN}/cmms/{slug}/"
    sitemap_urls.append(canonical_url)

    out_dir = os.path.join("public", "cmms", slug)
    os.makedirs(out_dir, exist_ok=True)

    # Industry pills
    verticals_html = "".join([f'<span class="pill">{html.escape(v)}</span>' for v in verticals])
    scales_html = "".join([f'<span class="pill">{html.escape(s)}</span>' for s in scales])

    # Core capabilities grid
    cap_html = "".join([
        f'<div class="capability-card"><h4>{html.escape(c.get("title", ""))}</h4><p>{html.escape(c.get("description", ""))}</p></div>'
        for c in capabilities[:6]
    ])

    # Pros list
    pros_html = "".join([
        f'<li><span style="color:#059669; font-weight:800;">&#10003;</span><span>{html.escape(pro)}</span></li>'
        for pro in pros
    ])

    # Limitations list
    limitations_html = "".join([
        f'<li><span style="color:#dc2626; font-weight:800;">&#9888;</span><span>{html.escape(con)}</span></li>'
        for con in limitations
    ])

    # Comparison links (top 6 alternatives)
    vs_links = []
    for other in platforms[:7]:
        if other["slug"] == slug:
            continue
        pair = sorted([slug, other["slug"]])
        vs_slug = f"{pair[0]}-vs-{pair[1]}"
        vs_links.append(f'<a href="/vs/{vs_slug}/" class="btn btn-outline" style="font-size:0.8rem; padding:0.4rem 0.8rem; margin:0.25rem;">{html.escape(name)} vs {html.escape(other["name"])} &rarr;</a>')

    vs_cross_links_html = "".join(vs_links)

    # Parse starting price for schema offers
    price_clean = "0"
    if "$" in price:
        m = re.search(r'\$?(\d+)', price)
        if m:
            price_clean = m.group(1)
    elif "free" in price.lower():
        price_clean = "0"

    # Schema.org SoftwareApplication & BreadcrumbList
    schema_app = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": f"{DOMAIN}/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "CMMS Directory",
                        "item": f"{DOMAIN}/#directory"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": f"{name} Review",
                        "item": canonical_url
                    }
                ]
            },
            {
                "@type": "SoftwareApplication",
                "name": name,
                "applicationCategory": "BusinessApplication / MaintenanceManagement",
                "operatingSystem": "Web, iOS, Android",
                "description": description,
                "url": canonical_url,
                "image": f"{DOMAIN}/og-image.png",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": f"{overall_rating:.1f}",
                    "reviewCount": str(review_count),
                    "bestRating": "5.0",
                    "worstRating": "1.0"
                },
                "offers": {
                    "@type": "Offer",
                    "price": price_clean,
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": SITE_NAME,
                    "url": DOMAIN
                }
            }
        ]
    }

    logo_url = f"https://ui-avatars.com/api/?name={html.escape(name)}&background=1d4ed8&color=fff&rounded=true&bold=true"

    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(
      f"{name} Review & Analysis 2026 | PlantMaintHQ",
      f"Independent CMMS review of {name}. Starting price: {price}. Implementation time: {timeline}. Ratings: {overall_rating}/5.0. Pros, limitations, and shop-floor adoption analysis.",
      canonical_url,
      json.dumps(schema_app)
  )}
</head>
<body>
  {get_header_html("directory")}

  <main class="container" style="padding-top: 2rem;">
    <!-- Back to Directory -->
    <div style="margin-bottom: 1.5rem;">
      <a href="/" class="btn btn-dark">&larr; Back to Directory</a>
    </div>

    <!-- Review Header (Exact Restored Layout) -->
    <div class="hero" style="background:#ffffff; border:1px solid var(--border-color); border-radius:14px; padding:2.5rem 1.5rem; box-shadow:var(--shadow-sm); margin-bottom:1.5rem;">
      <img src="{logo_url}" alt="{html.escape(name)} logo" style="width: 72px; height: 72px; object-fit: contain; margin-bottom: 1rem; border-radius: 12px; box-shadow: var(--shadow-sm);" />
      <br />
      <span class="badge">Independent CMMS Software Review</span>
      <h1 style="font-size:2.4rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem;">{html.escape(name)} Review &amp; Analysis</h1>
      <p style="font-size:1.05rem; color:var(--text-muted); max-width:720px; margin:0 auto;">{html.escape(tagline)}</p>
      
      <div style="margin-top: 1.25rem; display: flex; justify-content: center; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <span class="rating-badge">&#9733; {overall_rating} / 5.0 ({review_count:,} verified ratings)</span>
        <span style="font-size: 0.95rem; font-weight: 600; color: #374151;">Starts at {html.escape(price)}</span>
        <a href="/contact/?tool={html.escape(name)}&slug={slug}" class="btn btn-outline" style="padding: 0.45rem 0.9rem; font-size: 0.85rem; background: #ffffff;">Get Advisor Advice on {html.escape(name)}</a>
        <a href="/go/{slug}/" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 0.45rem 0.9rem; font-size: 0.85rem;" data-track="visit_site" data-platform="{name}" data-slug="{slug}">Official Website &#8599;</a>
      </div>
    </div>

    <!-- 2x2 Quick Metric Grid (Exact Restored Layout) -->
    <div class="grid-stats-mobile">
      <div class="metric-stat-box">
        <div class="metric-stat-label">Implementation</div>
        <div class="metric-stat-val" style="color: var(--primary);">{html.escape(timeline)}</div>
      </div>
      <div class="metric-stat-box">
        <div class="metric-stat-label">Deployment</div>
        <div class="metric-stat-val" style="color: #111827;">{html.escape(', '.join(deployment_types))}</div>
      </div>
      <div class="metric-stat-box">
        <div class="metric-stat-label">Free Trial</div>
        <div class="metric-stat-val" style="color: {'var(--success)' if has_free_trial else '#6b7280'};">{html.escape(free_trial_text)}</div>
      </div>
      <div class="metric-stat-box">
        <div class="metric-stat-label">Founded</div>
        <div class="metric-stat-val" style="color: #111827;">{founded}</div>
      </div>
    </div>

    <!-- Section: System Overview -->
    <div class="card">
      <h2>System Overview</h2>
      <p style="font-size: 1.05rem; color: #374151; line-height: 1.7; margin-bottom: 1.25rem;">
        {html.escape(description)}
      </p>

      <!-- Contextual Editor's Verdict Block -->
      <div style="background: #f8fafc; border-left: 4px solid var(--primary); padding: 1.25rem; border-radius: 0 8px 8px 0; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.05rem; color: #0f172a; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          &#128161; Editor's Verdict
        </h3>
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin-bottom: 0.75rem;">
          {html.escape(teardown.get('verdict', ''))}
        </p>
        <div style="font-size: 0.9rem; color: #1e293b; border-top: 1px solid #e2e8f0; padding-top: 0.5rem;">
          <strong>Target Recommendation:</strong> {html.escape(teardown.get('who_its_for', ''))}
        </div>
      </div>

      <div class="grid-2">
        <div>
          <h3 style="font-size: 1rem; color: #111827; margin-bottom: 0.5rem;">Supported Industry Verticals</h3>
          <div>{verticals_html}</div>
        </div>
        <div>
          <h3 style="font-size: 1rem; color: #111827; margin-bottom: 0.5rem;">Target Company Scales</h3>
          <div>{scales_html}</div>
        </div>
      </div>
    </div>

    <!-- Section: Core Capabilities Deep Dive -->
    <div class="card">
      <h2>Core Capabilities &amp; Architecture</h2>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">A granular look into how {html.escape(name)} structures day-to-day work orders, preventive triggers, and equipment telemetry.</p>
      <div class="grid-2">
        {cap_html}
      </div>
    </div>

    <!-- Section: Pros vs Limitations -->
    <div class="card">
      <h2>Strengths &amp; Trade-offs</h2>
      <div class="pro-con-grid">
        <div class="pro-box">
          <h3><span>&#10003;</span> What Plant Teams Love (Pros)</h3>
          <ul class="pro-list">
            {pros_html}
          </ul>
        </div>
        <div class="con-box">
          <h3><span>&#9888;</span> Limitations &amp; Considerations (Cons)</h3>
          <ul class="con-list">
            {limitations_html}
          </ul>
        </div>
      </div>
    </div>

    <!-- Head-to-Head Comparisons -->
    <div class="card">
      <h2>Compare {html.escape(name)} Head-to-Head</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">Direct side-by-side technical evaluation against other leading CMMS platforms:</p>
      <div>
        {vs_cross_links_html}
      </div>
    </div>
  </main>

  {get_footer_html()}
</body>
</html>
"""
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(page_html)

    # -------------------------------------------------------------
    # Generate /go/<slug> Redirect Page
    # -------------------------------------------------------------
    go_dir = os.path.join("public", "go", slug)
    os.makedirs(go_dir, exist_ok=True)
    
    redirect_url = website
    if "?" in redirect_url:
        redirect_url += "&utm_source=plantmainthq&utm_medium=directory&utm_campaign=cmms_review"
    else:
        redirect_url += "?utm_source=plantmainthq&utm_medium=directory&utm_campaign=cmms_review"
        
    go_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting to {html.escape(name)}...</title>
    <meta http-equiv="refresh" content="2; url={redirect_url}">
    <script>
        setTimeout(function() {{
            window.location.href = "{redirect_url}";
        }}, 2000);
    </script>
</head>
<body style="font-family:sans-serif; text-align:center; padding: 40px; background-color: #f8fafc; color: #0f172a;">
    <h2 style="font-size: 1.5rem; margin-bottom: 10px;">Redirecting you to {html.escape(name)}...</h2>
    <p style="color: #475569;">If you are not redirected automatically, <a href="{redirect_url}" style="color: #1d4ed8;">click here</a>.</p>
</body>
</html>
"""
    with open(os.path.join(go_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(go_html)

# ==============================================================================
# Step 4: Compile Head-to-Head Pairwise Comparisons (5,565 pages)
# ==============================================================================
matchup_pairs = list(itertools.combinations(platforms, 2))
total_matchups = len(matchup_pairs)
print(f">>> [4/5] Compiling {total_matchups} Programmatic Pairwise Comparison Pages...")

# Optimized batch write
for p1, p2 in matchup_pairs:
    pair_slug = f"{p1['slug']}-vs-{p2['slug']}"
    canonical_url = f"{DOMAIN}/vs/{pair_slug}/"
    sitemap_urls.append(canonical_url)

    out_dir = os.path.join("public", "vs", pair_slug)
    os.makedirs(out_dir, exist_ok=True)

    title = f"{p1['name']} vs {p2['name']} Comparison (2026) | PlantMaintHQ"
    description = f"Compare {p1['name']} vs {p2['name']}. Pricing ({p1['starting_price_tier']} vs {p2['starting_price_tier']}), implementation speed ({p1['deployment_timeline']} vs {p2['deployment_timeline']}), and verified user ratings."

    p1_price_clean = "0"
    if "$" in p1.get('starting_price_tier', ''):
        m1 = re.search(r'\$?(\d+)', p1.get('starting_price_tier', ''))
        if m1: p1_price_clean = m1.group(1)

    p2_price_clean = "0"
    if "$" in p2.get('starting_price_tier', ''):
        m2 = re.search(r'\$?(\d+)', p2.get('starting_price_tier', ''))
        if m2: p2_price_clean = m2.group(1)

    schema_vs = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": f"{DOMAIN}/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Comparisons",
                        "item": f"{DOMAIN}/#matrix"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": f"{p1['name']} vs {p2['name']}",
                        "item": canonical_url
                    }
                ]
            },
            {
                "@type": "WebPage",
                "@id": canonical_url,
                "url": canonical_url,
                "name": title,
                "description": description,
                "mainEntity": {
                    "@type": "ItemList",
                    "name": f"{p1['name']} vs {p2['name']} CMMS Comparison",
                    "itemListElement": [
                        {
                            "@type": "SoftwareApplication",
                            "position": 1,
                            "name": p1["name"],
                            "applicationCategory": "BusinessApplication / MaintenanceManagement",
                            "operatingSystem": "Web, iOS, Android",
                            "url": f"{DOMAIN}/cmms/{p1['slug']}/",
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": f"{p1.get('overall_rating', 4.7):.1f}",
                                "reviewCount": str(p1.get('review_count', 350)),
                                "bestRating": "5.0",
                                "worstRating": "1.0"
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": p1_price_clean,
                                "priceCurrency": "USD"
                            }
                        },
                        {
                            "@type": "SoftwareApplication",
                            "position": 2,
                            "name": p2["name"],
                            "applicationCategory": "BusinessApplication / MaintenanceManagement",
                            "operatingSystem": "Web, iOS, Android",
                            "url": f"{DOMAIN}/cmms/{p2['slug']}/",
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": f"{p2.get('overall_rating', 4.7):.1f}",
                                "reviewCount": str(p2.get('review_count', 350)),
                                "bestRating": "5.0",
                                "worstRating": "1.0"
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": p2_price_clean,
                                "priceCurrency": "USD"
                            }
                        }
                    ]
                }
            }
        ]
    }

    vs_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(title, description, canonical_url, json.dumps(schema_vs))}
</head>
<body>
  {get_header_html("matrix")}

  <main class="container" style="padding-top: 2rem;">
    <nav class="breadcrumbs">
      <a href="/">Home</a>
      <span>&rsaquo;</span>
      <a href="/#matrix">Comparisons</a>
      <span>&rsaquo;</span>
      <span>{html.escape(p1['name'])} vs {html.escape(p2['name'])}</span>
    </nav>

    <!-- Header Card -->
    <div class="hero" style="background:#ffffff; border:1px solid var(--border-color); border-radius:14px; padding:2.5rem 1.5rem; box-shadow:var(--shadow-sm); margin-bottom:1.5rem;">
      <span class="badge">Head-to-Head Evaluation</span>
      <h1 style="font-size:2.4rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem;">
        {html.escape(p1['name'])} <span style="color:var(--primary);">vs</span> {html.escape(p2['name'])}
      </h1>
      <p style="font-size:1.05rem; color:var(--text-muted); max-width:720px; margin:0 auto 1.5rem;">
        Technical comparison of implementation lead time, starting price tiers, mobile UX scores, and target operational scales.
      </p>

      <div class="grid-2" style="max-width:800px; margin:0 auto; text-align:left;">
        <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:1.25rem;">
          <h3 style="font-size:1.2rem; color:var(--text-main); margin-bottom:0.25rem;"><a href="/cmms/{p1['slug']}/" style="color:var(--text-main); text-decoration:none;">{html.escape(p1['name'])}</a></h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">{html.escape(p1['tagline'])}</p>
          <div style="font-weight:700; color:var(--primary); font-size:0.95rem; margin-bottom:0.25rem;">Starts at {html.escape(p1['starting_price_tier'])}</div>
          <div style="font-size:0.85rem; color:#475569; margin-bottom:0.75rem;">Implementation: {html.escape(p1['deployment_timeline'])}</div>
          <a href="/cmms/{p1['slug']}/" class="btn btn-primary" style="font-size:0.8rem; padding:0.4rem 0.8rem;">{html.escape(p1['name'])} Review &rarr;</a>
        </div>

        <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:1.25rem;">
          <h3 style="font-size:1.2rem; color:var(--text-main); margin-bottom:0.25rem;"><a href="/cmms/{p2['slug']}/" style="color:var(--text-main); text-decoration:none;">{html.escape(p2['name'])}</a></h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">{html.escape(p2['tagline'])}</p>
          <div style="font-weight:700; color:var(--primary); font-size:0.95rem; margin-bottom:0.25rem;">Starts at {html.escape(p2['starting_price_tier'])}</div>
          <div style="font-size:0.85rem; color:#475569; margin-bottom:0.75rem;">Implementation: {html.escape(p2['deployment_timeline'])}</div>
          <a href="/cmms/{p2['slug']}/" class="btn btn-primary" style="font-size:0.8rem; padding:0.4rem 0.8rem;">{html.escape(p2['name'])} Review &rarr;</a>
        </div>
      </div>
    </div>

    <!-- Comparison Table -->
    <div class="card">
      <h2>Side-by-Side Evaluation</h2>
      <div style="overflow-x: auto;">
        <table class="matrix-table">
          <thead>
            <tr>
              <th style="width:25%;">Dimension</th>
              <th style="width:37.5%;">{html.escape(p1['name'])}</th>
              <th style="width:37.5%;">{html.escape(p2['name'])}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Overall Rating</strong></td>
              <td><span class="rating-badge">&#9733; {p1['overall_rating']} / 5.0</span></td>
              <td><span class="rating-badge">&#9733; {p2['overall_rating']} / 5.0</span></td>
            </tr>
            <tr>
              <td><strong>Implementation Lead Time</strong></td>
              <td class="font-mono" style="color:var(--primary); font-weight:700;">{html.escape(p1['deployment_timeline'])}</td>
              <td class="font-mono" style="color:var(--primary); font-weight:700;">{html.escape(p2['deployment_timeline'])}</td>
            </tr>
            <tr>
              <td><strong>Starting Price</strong></td>
              <td class="font-mono">{html.escape(p1['starting_price_tier'])}</td>
              <td class="font-mono">{html.escape(p2['starting_price_tier'])}</td>
            </tr>
            <tr>
              <td><strong>Free Trial Availability</strong></td>
              <td>{html.escape(p1.get('free_trial_text', 'Yes'))}</td>
              <td>{html.escape(p2.get('free_trial_text', 'Yes'))}</td>
            </tr>
            <tr>
              <td><strong>Deployment Format</strong></td>
              <td>{html.escape(', '.join(p1.get('deployment_types', [])))}</td>
              <td>{html.escape(', '.join(p2.get('deployment_types', [])))}</td>
            </tr>
            <tr>
              <td><strong>Founded Year</strong></td>
              <td>{p1.get('founded_year', 2015)}</td>
              <td>{p2.get('founded_year', 2015)}</td>
            </tr>
            <tr>
              <td><strong>Top Strength</strong></td>
              <td style="color:#059669;">{html.escape(p1.get('pros', [''])[0])}</td>
              <td style="color:#059669;">{html.escape(p2.get('pros', [''])[0])}</td>
            </tr>
            <tr>
              <td><strong>Primary Limitation</strong></td>
              <td style="color:#dc2626;">{html.escape(p1.get('limitations', [''])[0])}</td>
              <td style="color:#dc2626;">{html.escape(p2.get('limitations', [''])[0])}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Editorial Decision Verdict -->
    <div class="card">
      <h2>How to Choose Between {html.escape(p1['name'])} and {html.escape(p2['name'])}</h2>
      <div class="grid-2">
        <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:1.25rem;">
          <h3 style="font-size:1.1rem; color:var(--primary); margin-bottom:0.5rem;">Choose {html.escape(p1['name'])} If:</h3>
          <p style="font-size:0.9rem; color:#475569; line-height:1.6;">
            {html.escape(p1.get('editorial_teardown', {}).get('who_its_for', ''))}
          </p>
          <div style="margin-top:1rem;">
            <a href="/cmms/{p1['slug']}/" class="btn btn-outline" style="font-size:0.8rem; padding:0.4rem 0.8rem;">Full {html.escape(p1['name'])} Teardown &rarr;</a>
          </div>
        </div>

        <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:10px; padding:1.25rem;">
          <h3 style="font-size:1.1rem; color:var(--primary); margin-bottom:0.5rem;">Choose {html.escape(p2['name'])} If:</h3>
          <p style="font-size:0.9rem; color:#475569; line-height:1.6;">
            {html.escape(p2.get('editorial_teardown', {}).get('who_its_for', ''))}
          </p>
          <div style="margin-top:1rem;">
            <a href="/cmms/{p2['slug']}/" class="btn btn-outline" style="font-size:0.8rem; padding:0.4rem 0.8rem;">Full {html.escape(p2['name'])} Teardown &rarr;</a>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
        <span style="font-size:0.95rem; color:#475569; margin-right:1rem;">Need tailored selection guidance for your maintenance facility?</span>
        <a href="/contact" class="btn btn-primary" style="font-size:0.85rem; padding:0.5rem 1rem;">Speak with an Advisor &rarr;</a>
      </div>
    </div>
  </main>

  {get_footer_html()}
</body>
</html>
"""
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(vs_html)

# ==============================================================================
# Step 4.5: Compile SEO Category Pages
# ==============================================================================
print(f">>> [4.5/5] Compiling High-Value SEO Category Pages...")

categories = [
    {
        "url_path": "best-cmms-for-manufacturing",
        "title": "Best CMMS Software for Manufacturing (2026)",
        "h1": "Best CMMS for Manufacturing",
        "desc": "Compare the top CMMS platforms built specifically for manufacturing facilities, discrete assembly, and production lines.",
        "filter": lambda p: any("manufacturing" in v.lower() for v in p.get("supported_industry_verticals", []))
    },
    {
        "url_path": "best-cmms-for-facilities",
        "title": "Best CMMS Software for Facilities Management (2026)",
        "h1": "Best CMMS for Facilities Management",
        "desc": "Top maintenance software for commercial real estate, campuses, and facilities management.",
        "filter": lambda p: any("facilities" in v.lower() or "property" in v.lower() for v in p.get("supported_industry_verticals", []))
    },
    {
        "url_path": "best-cmms-for-food-beverage",
        "title": "Best CMMS Software for Food & Beverage Processing (2026)",
        "h1": "Best CMMS for Food & Beverage",
        "desc": "FDA and regulatory compliant maintenance software for food and beverage processing plants.",
        "filter": lambda p: any("food" in v.lower() or "beverage" in v.lower() for v in p.get("supported_industry_verticals", []))
    },
    {
        "url_path": "best-cmms-for-fleet-maintenance",
        "title": "Best CMMS Software for Fleet Maintenance (2026)",
        "h1": "Best CMMS for Fleet Maintenance",
        "desc": "Top EAM and CMMS solutions for heavy equipment, logistics, and fleet maintenance.",
        "filter": lambda p: any("fleet" in v.lower() or "heavy equipment" in v.lower() for v in p.get("supported_industry_verticals", []))
    },
    {
        "url_path": "pricing/best-free-cmms-software",
        "title": "Best Free CMMS Software & Trials (2026)",
        "h1": "Best Free CMMS Software",
        "desc": "The ultimate list of completely free CMMS software and full-access free trials for maintenance teams.",
        "filter": lambda p: p.get("has_free_trial") or "free" in str(p.get("starting_price_tier", "")).lower()
    },
    {
        "url_path": "pricing/affordable-cmms-under-50",
        "title": "Best Affordable CMMS Software Under $50 (2026)",
        "h1": "Affordable CMMS Under $50/mo",
        "desc": "Cost-effective CMMS and work order management solutions starting under $50 per user per month.",
        "filter": lambda p: "$" in str(p.get("starting_price_tier", "")) and int(re.search(r'\$?(\d+)', str(p.get("starting_price_tier", ""))).group(1)) <= 50 if re.search(r'\$?(\d+)', str(p.get("starting_price_tier", ""))) else False
    },
    {
        "url_path": "best-cmms-for-small-teams",
        "title": "Best CMMS Software for Small Teams (2026)",
        "h1": "Best CMMS for Small Teams",
        "desc": "Agile, easy-to-use maintenance management software designed for small teams of 1 to 15 technicians.",
        "filter": lambda p: any("smb" in s.lower() or "small" in s.lower() for s in p.get("target_company_scales", []))
    },
    {
        "url_path": "best-enterprise-eam-software",
        "title": "Best Enterprise EAM Software (2026)",
        "h1": "Best Enterprise EAM Software",
        "desc": "Heavy-duty Enterprise Asset Management (EAM) platforms for multi-plant networks and global operations.",
        "filter": lambda p: any("enterprise" in s.lower() for s in p.get("target_company_scales", []))
    }
]

def generate_card_html(p):
    slug = p["slug"]
    name = p["name"]
    tagline = p.get("tagline", "")
    rating = p.get("overall_rating", 4.7)
    reviews = p.get("review_count", 350)
    timeline = p.get("deployment_timeline", "2 to 4 weeks")
    price = p.get("starting_price_tier", "Contact Vendor")
    scales = p.get("target_company_scales", [])
    verticals = p.get("supported_industry_verticals", [])[:3]
    pros_preview = p.get("pros", [])[:2]

    scales_html = "".join([f'<span class="pill" style="font-size:0.75rem;">{html.escape(s)}</span>' for s in scales[:2]])
    verticals_html = "".join([f'<span class="pill" style="font-size:0.75rem; background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe;">{html.escape(v)}</span>' for v in verticals])
    
    pros_html = "".join([
        f'<div style="display:flex; align-items:flex-start; gap:6px; font-size:0.85rem; color:#475569; margin-bottom:4px;">'
        f'<span style="color:#059669; font-weight:800;">&#10003;</span><span>{html.escape(pro)}</span></div>'
        for pro in pros_preview
    ])

    return f'''
    <article class="platform-card" data-slug="{slug}" data-name="{name.lower()}" data-scale="{' '.join(scales).lower()}">
      <div class="platform-card-header">
        <div class="platform-info">
          <h2><a href="/cmms/{slug}/">{html.escape(name)}</a></h2>
          <p class="platform-tagline">{html.escape(tagline)}</p>
        </div>
        <span class="rating-badge">&#9733; {rating} / 5.0</span>
      </div>

      <div class="grid-stats-mobile" style="margin-bottom: 1rem; gap: 0.75rem;">
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Implementation</div>
          <div class="metric-stat-val" style="color:var(--primary); font-size:0.95rem;">{html.escape(timeline)}</div>
        </div>
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Starting Price</div>
          <div class="metric-stat-val" style="color:#0f172a; font-size:0.95rem;">{html.escape(price)}</div>
        </div>
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Free Trial</div>
          <div class="metric-stat-val" style="color:#059669; font-size:0.95rem;">{html.escape(p.get('free_trial_text', 'Yes'))}</div>
        </div>
        <div class="metric-stat-box" style="padding: 0.75rem;">
          <div class="metric-stat-label">Founded</div>
          <div class="metric-stat-val" style="color:#0f172a; font-size:0.95rem;">{p.get('founded_year', 2015)}</div>
        </div>
      </div>

      <div style="margin-bottom: 0.85rem;">
        {scales_html}
        {verticals_html}
      </div>

      <div style="margin-bottom: 1.25rem;">
        {pros_html}
      </div>

      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; pt:8px; border-top:1px solid var(--border-color); padding-top:12px;">
        <a href="/cmms/{slug}/" class="btn btn-primary" style="font-size:0.85rem; padding:0.5rem 1rem;">
          Read Review &amp; Teardown &rarr;
        </a>
        <a href="/go/{slug}/" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size:0.85rem; padding:0.5rem 1rem;" data-track="visit_site" data-platform="{name}" data-slug="{slug}">
          Official Website &#8599;
        </a>
      </div>
    </article>
'''

for cat in categories:
    cat_platforms = [p for p in platforms if cat["filter"](p)]
    cat_cards_html = "".join([generate_card_html(p) for p in cat_platforms])
    canonical_url = f"{DOMAIN}/{cat['url_path']}/"
    sitemap_urls.append(canonical_url)
    
    out_dir = os.path.join("public", cat["url_path"])
    os.makedirs(out_dir, exist_ok=True)
    
    schema_cat = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": cat["title"],
        "description": cat["desc"],
        "url": canonical_url
    }
    
    cat_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(
      cat["title"],
      cat["desc"],
      canonical_url,
      json.dumps(schema_cat)
  )}
</head>
<body>
  {get_header_html("directory")}

  <main class="container" style="padding-top: 2rem;">
    <nav class="breadcrumbs">
      <a href="/">Home</a>
      <span>&rsaquo;</span>
      <span>{html.escape(cat['h1'])}</span>
    </nav>

    <div class="hero" style="background:#ffffff; border:1px solid var(--border-color); border-radius:14px; padding:2.5rem 1.5rem; box-shadow:var(--shadow-sm); margin-bottom:2rem;">
      <span class="badge">Curated Shortlist</span>
      <h1 style="font-size:2.4rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem;">{html.escape(cat["h1"])}</h1>
      <p style="font-size:1.05rem; color:var(--text-muted); max-width:720px; margin:0 auto;">
        {html.escape(cat["desc"])} We found <strong>{len(cat_platforms)}</strong> platforms matching this criteria.
      </p>
    </div>

    <section id="platforms-container">
      {cat_cards_html}
    </section>
  </main>
  
  {get_footer_html()}
  {CLIENT_SEARCH_SCRIPT}
</body>
</html>
"""
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(cat_html)

# ==============================================================================
# Step 4.7: Compile ROI Calculator Page
# ==============================================================================
print(f">>> [4.7/5] Compiling ROI Calculator Widget Page...")

roi_dir = os.path.join("public", "roi-calculator")
os.makedirs(roi_dir, exist_ok=True)
canonical_url = f"{DOMAIN}/roi-calculator/"
sitemap_urls.append(canonical_url)

schema_roi = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "CMMS & Maintenance ROI Calculator",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Interactive calculator to estimate wrench time recovery, annual downtime savings, and CMMS software payback period.",
    "url": canonical_url
}

roi_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(
      "Maintenance ROI & Downtime Calculator | PlantMaintHQ",
      "Interactive ROI calculator to prove the financial value of CMMS software to your plant management. Calculate downtime savings and payback period.",
      canonical_url,
      json.dumps(schema_roi)
  )}
</head>
<body>
  {get_header_html()}

  <main class="container" style="padding-top: 2rem;">
    <nav class="breadcrumbs">
      <a href="/">Home</a>
      <span>&rsaquo;</span>
      <span>ROI Calculator</span>
    </nav>

    <div class="hero" style="background:#ffffff; border:1px solid var(--border-color); border-radius:14px; padding:2.5rem 1.5rem; box-shadow:var(--shadow-sm); margin-bottom:2rem;">
      <span class="badge">Interactive Tool</span>
      <h1 style="font-size:2.4rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem;">CMMS Maintenance ROI Calculator</h1>
      <p style="font-size:1.05rem; color:var(--text-muted); max-width:720px; margin:0 auto;">
        Estimate your potential annual savings from reduced unplanned downtime and increased wrench time by implementing a modern CMMS.
      </p>
    </div>

    <div class="grid-2" style="align-items: start;">
      <div class="card" style="margin-bottom:0;">
        <h2>Facility Inputs</h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display:block; font-weight:600; margin-bottom:0.5rem;">Number of Maintenance Technicians</label>
            <input type="number" id="roi-techs" value="10" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--border-color); font-size:1rem;">
          </div>
          <div>
            <label style="display:block; font-weight:600; margin-bottom:0.5rem;">Average Hourly Wage (with burden)</label>
            <input type="number" id="roi-wage" value="45" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--border-color); font-size:1rem;">
          </div>
          <div>
            <label style="display:block; font-weight:600; margin-bottom:0.5rem;">Unplanned Downtime Hours (Annual)</label>
            <input type="number" id="roi-downtime" value="250" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--border-color); font-size:1rem;">
          </div>
          <div>
            <label style="display:block; font-weight:600; margin-bottom:0.5rem;">Cost per Hour of Downtime ($)</label>
            <input type="number" id="roi-downtime-cost" value="10000" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--border-color); font-size:1rem;">
          </div>
          <div>
            <label style="display:block; font-weight:600; margin-bottom:0.5rem;">Estimated CMMS Cost (Annual)</label>
            <input type="number" id="roi-cmms-cost" value="12000" style="width:100%; padding:0.75rem; border-radius:8px; border:1px solid var(--border-color); font-size:1rem;">
          </div>
        </div>
      </div>
      
      <div class="card" style="background:#f8fafc; margin-bottom:0;">
        <h2>Estimated ROI Breakdown</h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background:#ffffff; border:1px solid var(--border-color); padding:1rem; border-radius:8px;">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Labor Efficiency Savings</div>
            <div id="out-labor" style="font-size:1.5rem; font-weight:800; color:var(--primary);">$0</div>
            <div style="font-size:0.85rem; color:var(--text-light); margin-top:0.25rem;">Based on 15% wrench time increase</div>
          </div>
          <div style="background:#ffffff; border:1px solid var(--border-color); padding:1rem; border-radius:8px;">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Downtime Reduction Savings</div>
            <div id="out-downtime" style="font-size:1.5rem; font-weight:800; color:var(--primary);">$0</div>
            <div style="font-size:0.85rem; color:var(--text-light); margin-top:0.25rem;">Based on 20% reduction in downtime</div>
          </div>
          <div style="background:#ffffff; border:1px solid var(--border-color); padding:1rem; border-radius:8px; border-left:4px solid var(--success);">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Annual ROI</div>
            <div id="out-total" style="font-size:2rem; font-weight:800; color:var(--success);">$0</div>
          </div>
          <div style="background:#ffffff; border:1px solid var(--border-color); padding:1rem; border-radius:8px;">
            <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Payback Period</div>
            <div id="out-payback" style="font-size:1.5rem; font-weight:800; color:var(--text-main);">0 Months</div>
          </div>
        </div>
        
        <div style="margin-top: 1.5rem;">
          <a href="/contact/?inquiry_type=ROI%20Breakdown" class="btn btn-primary" style="width:100%;">Email Me This ROI Breakdown &rarr;</a>
        </div>
      </div>
    </div>
  </main>
  
  <script>
    function formatCurrency(val) {{
      return new Intl.NumberFormat('en-US', {{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}).format(val);
    }}
    
    function calculateROI() {{
      const techs = parseFloat(document.getElementById('roi-techs').value) || 0;
      const wage = parseFloat(document.getElementById('roi-wage').value) || 0;
      const downtime = parseFloat(document.getElementById('roi-downtime').value) || 0;
      const downtimeCost = parseFloat(document.getElementById('roi-downtime-cost').value) || 0;
      const cmmsCost = parseFloat(document.getElementById('roi-cmms-cost').value) || 0;
      
      const laborSavings = techs * 2080 * wage * 0.15;
      const downtimeSavings = downtime * downtimeCost * 0.20;
      const totalSavings = laborSavings + downtimeSavings;
      const netSavings = totalSavings - cmmsCost;
      
      let payback = 0;
      if (totalSavings > 0) {{
        payback = (cmmsCost / totalSavings) * 12;
      }}
      
      document.getElementById('out-labor').textContent = formatCurrency(laborSavings);
      document.getElementById('out-downtime').textContent = formatCurrency(downtimeSavings);
      document.getElementById('out-total').textContent = formatCurrency(totalSavings);
      document.getElementById('out-payback').textContent = payback.toFixed(1) + " Months";
    }}
    
    document.querySelectorAll('input[type="number"]').forEach(input => {{
      input.addEventListener('input', calculateROI);
    }});
    
    document.addEventListener('DOMContentLoaded', calculateROI);
  </script>
  
  {get_footer_html()}
  {CLIENT_SEARCH_SCRIPT}
</body>
</html>
"""
with open(os.path.join(roi_dir, "index.html"), "w", encoding="utf-8") as f:
    f.write(roi_html)

# ==============================================================================
# Step 5: Sync Data Bundles & XML Sitemap
# ==============================================================================
print(f">>> [5/5] Generating XML Sitemap & Client Data Bundles...")

# Write client json and js bundles
shutil.copy2("cmms_data.json", "public/cmms_data.json")
with open("public/cmms_data.js", "w", encoding="utf-8") as f:
    f.write(f"window.__CMMS_DATA__ = {json.dumps(platforms, indent=2)};\n")

# Generate XML Sitemap
sitemap_xml_lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
]

for url in sitemap_urls:
    priority = "1.0" if url == f"{DOMAIN}/" else ("0.8" if "/cmms/" in url else "0.7")
    sitemap_xml_lines.append(f"""  <url>
    <loc>{url}</loc>
    <lastmod>{TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>{priority}</priority>
  </url>""")

sitemap_xml_lines.append("</urlset>")
sitemap_content = "\n".join(sitemap_xml_lines)

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write(sitemap_content)
with open("public/sitemap.xml", "w", encoding="utf-8") as f:
    f.write(sitemap_content)

t_end = time.time()
print(f"\n========================================================")
print(f" Engine Compilation Complete in {t_end - t_start:.2f} seconds!")
print(f" Total Programmatic Pages Generated: {len(sitemap_urls)}")
print(f" - Directory Catalog: 1 page")
print(f" - CMMS Platform Teardowns: {total_platforms} pages")
print(f" - Head-to-Head Comparisons: {total_matchups} pages")
print(f" - Contact Page: 1 page")
print(f" - XML Sitemap: {len(sitemap_urls)} indexed URLs")
print(f" Destination Directory: ./public")
print(f"========================================================")
