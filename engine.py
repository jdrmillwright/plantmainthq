#!/usr/bin/env python3
"""
PlantMaintHQ Static Site Generation Engine
Compiles programmatic CMMS directories, product teardowns, head-to-head comparison matrices,
sitemaps, and client-side data bundles.
"""
import json, os, shutil, itertools
from datetime import datetime

DOMAIN = "https://plantmainthq.com"
SITE_NAME = "PlantMaintHQ"
TODAY = datetime.now().strftime("%Y-%m-%d")

print(">>> [1/5] Loading CMMS Dataset & Initializing Public Assets...")
os.makedirs("public", exist_ok=True)

# Copy static assets into public directory
for static_file in ["favicon.svg", "favicon.ico", "style.css", "analytics.js", "robots.txt", "404.html"]:
    if os.path.exists(static_file):
        shutil.copy2(static_file, os.path.join("public", static_file))

# Load CMMS platforms database
with open("cmms_data.json", "r", encoding="utf-8") as f:
    platforms = json.load(f)

# Sort platforms primarily by overall rating descending, then name
platforms = sorted(platforms, key=lambda x: (-x.get("overall_rating", 0), x["name"]))
total_platforms = len(platforms)
sitemap_urls = [f"{DOMAIN}/"]

print(f"    Loaded {total_platforms} verified CMMS platforms.")

# Helper HTML Components
def get_common_head(title, description, canonical_url, schema_json=None):
    schema_script = f'<script type="application/ld+json">{schema_json}</script>' if schema_json else ""
    return f"""
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <link rel="canonical" href="{canonical_url}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="stylesheet" href="/style.css">
    <script src="/analytics.js" defer></script>
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:site_name" content="{SITE_NAME}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{description}">
    {schema_script}
"""

def get_header_html(active_nav="directory"):
    dir_active = " active" if active_nav == "directory" else ""
    matrix_active = " active" if active_nav == "matrix" else ""
    guide_active = " active" if active_nav == "guide" else ""
    return f"""
    <header class="topbar">
      <div class="container topbar-inner">
        <a href="/" class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          PlantMaint<span>HQ</span>
        </a>
        <nav class="nav-links">
          <a href="/#directory" class="nav-link{dir_active}">CMMS Directory</a>
          <a href="/#matrix" class="nav-link{matrix_active}">Comparison Matrix</a>
          <a href="/#guide" class="nav-link{guide_active}">Buyer's Guide</a>
        </nav>
      </div>
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
          <a href="/sitemap.xml">Sitemap</a>
        </div>
      </div>
    </footer>
"""

# ==============================================================================
# Step 2: Compile Master Directory Homepage (index.html)
# ==============================================================================
print(">>> [2/5] Compiling Master CMMS Directory Homepage (index.html)...")

# Build Directory Cards
platform_cards_html = []
for p in platforms:
    slug = p["slug"]
    name = p["name"]
    tagline = p["tagline"]
    rating = p.get("overall_rating", 4.8)
    timeline = p.get("deployment_timeline", "2 - 4 weeks")
    price = p.get("starting_price_tier", "Contact Vendor")
    mobile_ux = p.get("mobile_ux_rating", 4.7)
    scales = p.get("target_company_scales", [])
    verticals = p.get("supported_industry_verticals", [])[:4]
    pros_preview = p.get("pros", [])[:2]
    limitations_preview = p.get("limitations", [])[:1]

    scales_html = "".join([f'<span class="tag-scale">{s}</span>' for s in scales])
    verticals_html = "".join([f'<span class="tag-vertical">{v}</span>' for v in verticals])
    
    pros_html = "".join([
        f'<div class="highlight-item"><span class="highlight-icon-pos">&#10003;</span><span>{pro}</span></div>' 
        for pro in pros_preview
    ])
    limitations_html = "".join([
        f'<div class="highlight-item"><span class="highlight-icon-neg">&#9888;</span><span>{con}</span></div>' 
        for con in limitations_preview
    ])

    card = f"""
    <article class="platform-card" data-slug="{slug}" data-name="{name.lower()}" data-timeline="{timeline.lower()}" data-scale="{' '.join(scales).lower()}">
      <div class="platform-card-header">
        <div class="platform-info">
          <h2><a href="/cmms/{slug}/">{name}</a></h2>
          <p class="platform-tagline">{tagline}</p>
        </div>
        <div class="score-badge">
          <span class="score-num font-mono">{rating}</span>
          <span class="score-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        </div>
      </div>

      <div class="metrics-row">
        <div class="metric-item">
          <span class="metric-label">Deployment Timeline</span>
          <span class="metric-val emerald font-mono">{timeline}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Starting Price</span>
          <span class="metric-val gold font-mono">{price}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Mobile UX Rating</span>
          <span class="metric-val sky font-mono">{mobile_ux} / 5.0</span>
        </div>
      </div>

      <div class="tags-row">
        {scales_html}
        {verticals_html}
      </div>

      <div class="highlights-block">
        {pros_html}
        {limitations_html}
      </div>

      <div class="card-actions">
        <a href="/cmms/{slug}/" class="btn btn-primary" data-track="review_click" data-platform="{name}" data-slug="{slug}">
          Read Deep Teardown &rarr;
        </a>
        <a href="{p['website']}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" data-track="visit_site" data-platform="{name}" data-slug="{slug}">
          Official Website &#8599;
        </a>
      </div>
    </article>
"""
    platform_cards_html.append(card)

# Build Head-to-Head Comparison Matrix Table Rows
matrix_rows = []
for p in platforms:
    slug = p["slug"]
    name = p["name"]
    timeline = p.get("deployment_timeline", "2-4 weeks")
    price = p.get("starting_price_tier", "Contact Vendor")
    mobile_ux = p.get("mobile_ux_rating", 4.7)
    scale = ", ".join(p.get("target_company_scales", [])[:2])
    niche = p.get("supported_industry_verticals", ["Manufacturing"])[0]

    matrix_rows.append(f"""
    <tr>
      <td><strong><a href="/cmms/{slug}/" style="color:var(--text-primary); text-decoration:none;">{name}</a></strong></td>
      <td class="font-mono" style="color:var(--accent-emerald);">{timeline}</td>
      <td class="font-mono" style="color:var(--accent-amber);">{price}</td>
      <td class="font-mono" style="color:var(--accent-sky); font-weight:700;">{mobile_ux} / 5.0</td>
      <td>{scale}</td>
      <td><span class="tag-vertical">{niche}</span></td>
      <td>
        <a href="/cmms/{slug}/" class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem;">Teardown &rarr;</a>
      </td>
    </tr>
""")

schema_catalog = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "PlantMaintHQ - Top CMMS & EAM Software Directory 2026",
    "description": "Comprehensive independent directory and teardown of top Computerized Maintenance Management Systems for plant maintenance managers and reliability engineers.",
    "url": f"{DOMAIN}/",
    "publisher": {
        "@type": "Organization",
        "name": SITE_NAME,
        "url": DOMAIN
    }
}

CLIENT_SEARCH_SCRIPT = """<script>
    // Client-side search and scale filtering
    document.addEventListener('DOMContentLoaded', function() {
      var searchInput = document.getElementById('cmms-search');
      var filterButtons = document.querySelectorAll('#scale-filters .filter-pill');
      var cards = document.querySelectorAll('.platform-card');

      var currentFilter = 'all';

      function filterCards() {
        var query = (searchInput.value || '').toLowerCase().trim();
        cards.forEach(function(card) {
          var text = card.textContent.toLowerCase();
          var scale = (card.getAttribute('data-scale') || '').toLowerCase();
          
          var matchesQuery = !query || text.indexOf(query) !== -1;
          var matchesFilter = currentFilter === 'all' || scale.indexOf(currentFilter) !== -1;

          if (matchesQuery && matchesFilter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      }

      if (searchInput) {
        searchInput.addEventListener('input', filterCards);
      }

      filterButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          filterButtons.forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          currentFilter = this.getAttribute('data-filter');
          filterCards();
        });
      });
    });
  </script>"""

homepage_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(
      "PlantMaintHQ | Top CMMS & EAM Directory for Maintenance & Reliability",
      "Independent technical directory, pricing breakdown, and head-to-head comparisons for top CMMS platforms: Limble, MaintainX, UpKeep, Fiix, and eMaint.",
      f"{DOMAIN}/",
      json.dumps(schema_catalog)
  )}
</head>
<body>
  {get_header_html("directory")}

  <main class="container">
    <section class="hero">
      <div class="hero-pill">
        <span class="hero-pill-dot"></span>
        2026 Industrial Reliability Benchmarks
      </div>
      <h1 class="hero-title">
        Find the Right CMMS Platform for <span class="gradient-text">Your Plant Operations</span>
      </h1>
      <p class="hero-subtitle">
        Independent engineering teardowns, deployment timelines, starting price tiers, and mobile adoption benchmarks for industrial maintenance teams.
      </p>

      <div class="trust-grid">
        <div class="trust-card">
          <div class="trust-number font-mono">{total_platforms}</div>
          <div class="trust-label">Verified Teardowns</div>
        </div>
        <div class="trust-card">
          <div class="trust-number font-mono">10</div>
          <div class="trust-label">Head-to-Head Comparisons</div>
        </div>
        <div class="trust-card">
          <div class="trust-number font-mono">100%</div>
          <div class="trust-label">Independent Analysis</div>
        </div>
        <div class="trust-card">
          <div class="trust-number font-mono">Zero</div>
          <div class="trust-label">Pay-to-Play Rankings</div>
        </div>
      </div>
    </section>

    <!-- Search & Filter Controls -->
    <section class="controls-card" id="directory">
      <div class="search-row">
        <div class="search-input-wrap">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="cmms-search" class="search-input" placeholder="Search platforms by name, vertical, or feature (e.g. Limble, Manufacturing, Offline, IoT)...">
        </div>
      </div>

      <div class="filter-row">
        <div class="filter-pills" id="scale-filters">
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Plant Scale:</span>
          <button class="filter-pill active" data-filter="all">All Scales</button>
          <button class="filter-pill" data-filter="smb">SMB (1-25 Techs)</button>
          <button class="filter-pill" data-filter="mid-market">Mid-Market</button>
          <button class="filter-pill" data-filter="enterprise">Enterprise</button>
        </div>
      </div>
    </section>

    <!-- Platform Directory Grid -->
    <section class="directory-grid" id="platforms-container">
      {"".join(platform_cards_html)}
    </section>

    <!-- Head-to-Head Comparison Matrix -->
    <section class="matrix-card" id="matrix">
      <h2 style="font-size: 1.6rem; margin-bottom: 8px;">Top 5 CMMS Comparison Matrix</h2>
      <p style="color:var(--text-secondary); margin-bottom: 20px;">
        High-level breakdown of deployment speeds, entry pricing models, and mobile usability across top industrial platforms.
      </p>
      <div style="overflow-x: auto;">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Deployment Timeline</th>
              <th>Starting Price</th>
              <th>Mobile UX</th>
              <th>Target Scale</th>
              <th>Primary Industry</th>
              <th>Deep Dive</th>
            </tr>
          </thead>
          <tbody>
            {"".join(matrix_rows)}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Buyer's Guide & Evaluation Criteria -->
    <section class="card" id="guide" style="padding:32px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); margin-bottom:48px;">
      <h2 style="font-size: 1.8rem; margin-bottom: 12px;">CMMS Buyer's Guide: 5 Key Evaluation Pillars for Plant Operations</h2>
      <p style="color:var(--text-secondary); margin-bottom: 24px; line-height:1.7;">
        Selecting software for industrial maintenance isn't like purchasing corporate HR or accounting tools. If frontline mechanics find the user interface clunky or if the system requires steady Wi-Fi in remote electrical substations, technician compliance crashes and your database fills with garbage data.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:20px;">
        <div style="background:var(--bg-surface-elevated); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <h3 style="font-size:1.1rem; color:var(--accent-amber); margin-bottom:8px;">1. Technician Mobile UX &amp; Offline Sync</h3>
          <p style="font-size:0.88rem; color:var(--text-secondary);">
            The best CMMS is the one mechanics actually use. Prioritize systems with true offline mobile caching so work orders, meter readings, and photo uploads work seamlessly inside metal-shielded plants or underground utility tunnels.
          </p>
        </div>

        <div style="background:var(--bg-surface-elevated); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <h3 style="font-size:1.1rem; color:var(--accent-sky); margin-bottom:8px;">2. Deployment Velocity &amp; Data Migration</h3>
          <p style="font-size:0.88rem; color:var(--text-secondary);">
            Implementation timelines range from 48 hours for agile cloud tools like MaintainX and Limble up to 12 weeks for deeply customized suites like eMaint. Determine whether your team has dedicated IT resources or needs self-guided CSV onboarding.
          </p>
        </div>

        <div style="background:var(--bg-surface-elevated); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <h3 style="font-size:1.1rem; color:var(--accent-emerald); margin-bottom:8px;">3. MRO Inventory &amp; Automated Reorder</h3>
          <p style="font-size:0.88rem; color:var(--text-secondary);">
            Spare parts stockouts cause prolonged catastrophic machine downtime. Look for automated min/max threshold triggers, barcode bin scanning, and purchase order workflow routing that links parts consumption directly to specific equipment assets.
          </p>
        </div>

        <div style="background:var(--bg-surface-elevated); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <h3 style="font-size:1.1rem; color:#a855f7; margin-bottom:8px;">4. Condition Monitoring &amp; IoT Sensors</h3>
          <p style="font-size:0.88rem; color:var(--text-secondary);">
            Moving from reactive firefighting to predictive maintenance requires hardware connectivity. Evaluate whether you need native wireless vibration sensors (UpKeep Edge, Fluke eMaint) or PLC/SCADA industrial network integration (Fiix Foresight).
          </p>
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
print(f">>> [3/5] Compiling {total_platforms} Dedicated CMMS Product Teardowns...")

for p in platforms:
    slug = p["slug"]
    name = p["name"]
    tagline = p["tagline"]
    description = p["description"]
    website = p["website"]
    founded = p.get("founded_year", 2015)
    timeline = p.get("deployment_timeline", "1 - 3 weeks")
    price = p.get("starting_price_tier", "Contact Vendor")
    pricing_model = p.get("pricing_model", "Subscription")
    mobile_ux = p.get("mobile_ux_rating", 4.8)
    overall_rating = p.get("overall_rating", 4.8)
    review_count = p.get("review_count", 1000)
    verticals = p.get("supported_industry_verticals", [])
    scales = p.get("target_company_scales", [])
    deployment_types = p.get("deployment_types", [])
    features = p.get("features", [])
    pros = p.get("pros", [])
    limitations = p.get("limitations", [])
    teardown = p.get("editorial_teardown", {})
    specs = teardown.get("key_specifications", {})

    canonical_url = f"{DOMAIN}/cmms/{slug}/"
    sitemap_urls.append(canonical_url)

    out_dir = os.path.join("public", "cmms", slug)
    os.makedirs(out_dir, exist_ok=True)

    # Build features checkmarks
    features_html = "".join([
        f'<div style="display:flex; align-items:center; gap:8px; background:var(--bg-surface-elevated); padding:10px 14px; border-radius:6px; font-size:0.88rem; border:1px solid var(--border-subtle);">'
        f'<span style="color:var(--accent-emerald); font-weight:800;">&#10003;</span><span>{feat}</span></div>'
        for feat in features
    ])

    # Build pros list
    pros_html = "".join([
        f'<li style="margin-bottom:12px; display:flex; align-items:flex-start; gap:10px;">'
        f'<span style="color:var(--accent-emerald); font-weight:800; line-height:1.4;">&#10003;</span>'
        f'<span>{pro}</span></li>'
        for pro in pros
    ])

    # Build limitations list
    limitations_html = "".join([
        f'<li style="margin-bottom:12px; display:flex; align-items:flex-start; gap:10px;">'
        f'<span style="color:var(--accent-rose); font-weight:800; line-height:1.4;">&#9888;</span>'
        f'<span>{con}</span></li>'
        for con in limitations
    ])

    # Build specifications boxes
    specs_html = "".join([
        f'<div class="spec-box"><div class="spec-box-title">{k}</div><div class="spec-box-content">{v}</div></div>'
        for k, v in specs.items()
    ])

    # Build head-to-head comparison cross-links
    vs_links = []
    for other in platforms:
        if other["slug"] == slug:
            continue
        # Ensure canonical alphabetical order for matchup slug
        pair = sorted([slug, other["slug"]])
        vs_slug = f"{pair[0]}-vs-{pair[1]}"
        vs_links.append(f'<a href="/vs/{vs_slug}/" class="btn btn-secondary" style="font-size:0.8rem; padding:8px 12px;">{name} vs {other["name"]} &rarr;</a>')

    vs_cross_links_html = "".join(vs_links)

    # Schema.org SoftwareApplication
    schema_app = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "operatingSystem": "iOS, Android, Web",
        "applicationCategory": "BusinessApplication",
        "description": description,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": str(overall_rating),
            "reviewCount": str(review_count),
            "bestRating": "5",
            "worstRating": "1"
        },
        "offers": {
            "@type": "Offer",
            "price": price.split()[0].replace("$", "") if "$" in price else "0",
            "priceCurrency": "USD"
        }
    }

    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(
      f"{name} Review & Technical Teardown 2026 | PlantMaintHQ",
      f"Exhaustive technical review of {name}. Starting price: {price}. Deployment timeline: {timeline}. Mobile UX score: {mobile_ux}/5.0. Pros, limitations, and shop-floor adoption analysis.",
      canonical_url,
      json.dumps(schema_app)
  )}
</head>
<body>
  {get_header_html("directory")}

  <main class="container" style="padding-top: 24px;">
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <a href="/">Home</a>
      <span>&rsaquo;</span>
      <a href="/#directory">CMMS Directory</a>
      <span>&rsaquo;</span>
      <span style="color:var(--text-primary);">{name}</span>
    </nav>

    <!-- Header Card -->
    <article class="teardown-header-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:16px;">
        <div>
          <h1 style="font-size: 2.4rem; margin-bottom: 6px;">{name}</h1>
          <p style="color:var(--accent-amber); font-weight:700; font-size:1.1rem;">{tagline}</p>
        </div>
        <div class="score-badge" style="padding:12px 18px;">
          <div style="text-align:right;">
            <div class="score-num font-mono" style="font-size:1.8rem;">{overall_rating} <span style="font-size:1rem; color:var(--text-muted);">/ 5.0</span></div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">{review_count}+ Verified Reviews</div>
          </div>
        </div>
      </div>

      <p style="color:var(--text-secondary); font-size:1.05rem; line-height:1.7; margin-bottom:24px;">
        {description}
      </p>

      <!-- Key Metrics Row -->
      <div class="metrics-row" style="margin-bottom:24px;">
        <div class="metric-item">
          <span class="metric-label">Deployment Timeline</span>
          <span class="metric-val emerald font-mono" style="font-size:1.05rem;">{timeline}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Starting Price Tier</span>
          <span class="metric-val gold font-mono" style="font-size:1.05rem;">{price}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Mobile UX Score</span>
          <span class="metric-val sky font-mono" style="font-size:1.05rem;">{mobile_ux} / 5.0 Rating</span>
        </div>
      </div>

      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <a href="{website}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" data-track="visit_site" data-platform="{name}" data-slug="{slug}">
          Visit Official {name} Site &#8599;
        </a>
        <a href="/#matrix" class="btn btn-secondary">
          &larr; Back to Comparison Matrix
        </a>
      </div>
    </article>

    <!-- Detailed Key Specs Grid -->
    <section style="margin-bottom:32px;">
      <h2 style="font-size:1.6rem; margin-bottom:16px;">Platform Architecture &amp; Technical Specs</h2>
      <div class="specs-grid">
        <div class="spec-box">
          <div class="spec-box-title">Target Company Scales</div>
          <div class="spec-box-content">{", ".join(scales)}</div>
        </div>
        <div class="spec-box">
          <div class="spec-box-title">Supported Industry Verticals</div>
          <div class="spec-box-content">{", ".join(verticals)}</div>
        </div>
        <div class="spec-box">
          <div class="spec-box-title">Deployment Models</div>
          <div class="spec-box-content">{", ".join(deployment_types)}</div>
        </div>
        <div class="spec-box">
          <div class="spec-box-title">Pricing Architecture</div>
          <div class="spec-box-content">{pricing_model}</div>
        </div>
        {specs_html}
      </div>
    </section>

    <!-- Pros vs Limitations Columns -->
    <section class="teardown-columns">
      <div class="teardown-column" style="border-top: 3px solid var(--accent-emerald);">
        <h3 style="font-size:1.3rem; margin-bottom:16px; color:var(--accent-emerald); display:flex; align-items:center; gap:8px;">
          <span>&#10003;</span> What Plant Teams Love (Strengths)
        </h3>
        <ul style="list-style:none; padding:0;">
          {pros_html}
        </ul>
      </div>

      <div class="teardown-column" style="border-top: 3px solid var(--accent-rose);">
        <h3 style="font-size:1.3rem; margin-bottom:16px; color:var(--accent-rose); display:flex; align-items:center; gap:8px;">
          <span>&#9888;</span> Limitations &amp; Trade-offs
        </h3>
        <ul style="list-style:none; padding:0;">
          {limitations_html}
        </ul>
      </div>
    </section>

    <!-- Editorial Verdict & Implementation Guidance -->
    <section class="verdict-box">
      <h2 style="font-size:1.5rem; margin-bottom:12px; color:var(--accent-amber);">PlantMaintHQ Editorial Verdict</h2>
      <p style="font-size:1rem; line-height:1.7; margin-bottom:16px; color:var(--text-primary);">
        {teardown.get('verdict', '')}
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:20px;">
        <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div style="font-weight:700; color:var(--accent-emerald); margin-bottom:6px; font-size:0.9rem;">IDEAL FIT (WHO IT'S FOR)</div>
          <p style="font-size:0.85rem; color:var(--text-secondary);">{teardown.get('who_its_for', '')}</p>
        </div>
        <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div style="font-weight:700; color:var(--accent-rose); margin-bottom:6px; font-size:0.9rem;">CAUTION (WHO SHOULD AVOID)</div>
          <p style="font-size:0.85rem; color:var(--text-secondary);">{teardown.get('who_should_avoid', '')}</p>
        </div>
      </div>
    </section>

    <!-- Key Features Grid -->
    <section style="margin-bottom:40px;">
      <h2 style="font-size:1.5rem; margin-bottom:16px;">Core Functional Capabilities</h2>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
        {features_html}
      </div>
    </section>

    <!-- Head-to-Head Matchups Section -->
    <section class="card" style="padding:24px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); margin-bottom:48px;">
      <h2 style="font-size:1.4rem; margin-bottom:10px;">Compare {name} Head-to-Head</h2>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:16px;">
        Direct side-by-side feature, pricing, and adoption breakdowns comparing {name} against top market alternatives:
      </p>
      <div style="display:flex; flex-wrap:wrap; gap:10px;">
        {vs_cross_links_html}
      </div>
    </section>
  </main>

  {get_footer_html()}
</body>
</html>
"""
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(page_html)

# ==============================================================================
# Step 4: Compile Head-to-Head Comparison Matrix Pages (/vs/<p1>-vs-<p2>/index.html)
# ==============================================================================
matchup_pairs = list(itertools.combinations(platforms, 2))
print(f">>> [4/5] Compiling {len(matchup_pairs)} Head-to-Head Comparison Matchup Pages...")

for p1, p2 in matchup_pairs:
    pair_slug = f"{p1['slug']}-vs-{p2['slug']}"
    canonical_url = f"{DOMAIN}/vs/{pair_slug}/"
    sitemap_urls.append(canonical_url)

    out_dir = os.path.join("public", "vs", pair_slug)
    os.makedirs(out_dir, exist_ok=True)

    title = f"{p1['name']} vs {p2['name']} Comparison (2026) | PlantMaintHQ"
    description = f"Detailed technical comparison: {p1['name']} vs {p2['name']}. Compare pricing ({p1['starting_price_tier']} vs {p2['starting_price_tier']}), deployment speed ({p1['deployment_timeline']} vs {p2['deployment_timeline']}), and mobile UX."

    schema_vs = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": canonical_url
    }

    vs_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  {get_common_head(title, description, canonical_url, json.dumps(schema_vs))}
</head>
<body>
  {get_header_html("matrix")}

  <main class="container" style="padding-top: 24px;">
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <a href="/">Home</a>
      <span>&rsaquo;</span>
      <a href="/#matrix">Comparisons</a>
      <span>&rsaquo;</span>
      <span style="color:var(--text-primary);">{p1['name']} vs {p2['name']}</span>
    </nav>

    <!-- Header Card -->
    <section class="vs-header-card">
      <div class="hero-pill">
        <span class="hero-pill-dot"></span>
        Head-to-Head Evaluation
      </div>
      <h1 class="vs-matchup-title">{p1['name']} <span style="color:var(--accent-amber);">vs</span> {p2['name']}</h1>
      <p style="color:var(--text-secondary); max-width:680px; margin:0 auto 24px; font-size:1.05rem;">
        Which CMMS platform fits your maintenance workflow? Compare deployment velocity, starting price tiers, frontline mobile experience, and sensor integration.
      </p>

      <div class="vs-cards-comparison">
        <div style="background:var(--bg-surface-elevated); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); text-align:left;">
          <h2 style="font-size:1.4rem; margin-bottom:4px;"><a href="/cmms/{p1['slug']}/" style="color:var(--text-primary); text-decoration:none;">{p1['name']}</a></h2>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:12px;">{p1['tagline']}</p>
          <div class="font-mono" style="color:var(--accent-amber); font-weight:700; margin-bottom:6px;">{p1['starting_price_tier']}</div>
          <div class="font-mono" style="color:var(--accent-emerald); font-size:0.85rem; margin-bottom:12px;">Deployment: {p1['deployment_timeline']}</div>
          <a href="/cmms/{p1['slug']}/" class="btn btn-secondary" style="font-size:0.8rem; padding:6px 12px;">{p1['name']} Teardown &rarr;</a>
        </div>

        <div style="background:var(--bg-surface-elevated); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); text-align:left;">
          <h2 style="font-size:1.4rem; margin-bottom:4px;"><a href="/cmms/{p2['slug']}/" style="color:var(--text-primary); text-decoration:none;">{p2['name']}</a></h2>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:12px;">{p2['tagline']}</p>
          <div class="font-mono" style="color:var(--accent-amber); font-weight:700; margin-bottom:6px;">{p2['starting_price_tier']}</div>
          <div class="font-mono" style="color:var(--accent-emerald); font-size:0.85rem; margin-bottom:12px;">Deployment: {p2['deployment_timeline']}</div>
          <a href="/cmms/{p2['slug']}/" class="btn btn-secondary" style="font-size:0.8rem; padding:6px 12px;">{p2['name']} Teardown &rarr;</a>
        </div>
      </div>
    </section>

    <!-- Side-by-Side Comparison Matrix Table -->
    <section class="matrix-card" style="margin-bottom:32px;">
      <h2 style="font-size:1.5rem; margin-bottom:16px;">Side-by-Side Technical Comparison</h2>
      <div style="overflow-x: auto;">
        <table class="matrix-table">
          <thead>
            <tr>
              <th style="width:28%;">Evaluation Dimension</th>
              <th style="width:36%;">{p1['name']}</th>
              <th style="width:36%;">{p2['name']}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Overall Rating</strong></td>
              <td class="font-mono" style="color:var(--accent-amber); font-weight:700;">{p1['overall_rating']} / 5.0 ({p1['review_count']} reviews)</td>
              <td class="font-mono" style="color:var(--accent-amber); font-weight:700;">{p2['overall_rating']} / 5.0 ({p2['review_count']} reviews)</td>
            </tr>
            <tr>
              <td><strong>Deployment Timeline</strong></td>
              <td class="font-mono" style="color:var(--accent-emerald);">{p1['deployment_timeline']}</td>
              <td class="font-mono" style="color:var(--accent-emerald);">{p2['deployment_timeline']}</td>
            </tr>
            <tr>
              <td><strong>Starting Price Tier</strong></td>
              <td class="font-mono">{p1['starting_price_tier']}</td>
              <td class="font-mono">{p2['starting_price_tier']}</td>
            </tr>
            <tr>
              <td><strong>Mobile UX Rating</strong></td>
              <td class="font-mono" style="color:var(--accent-sky); font-weight:700;">{p1['mobile_ux_rating']} / 5.0</td>
              <td class="font-mono" style="color:var(--accent-sky); font-weight:700;">{p2['mobile_ux_rating']} / 5.0</td>
            </tr>
            <tr>
              <td><strong>Target Company Scales</strong></td>
              <td>{", ".join(p1.get('target_company_scales', []))}</td>
              <td>{", ".join(p2.get('target_company_scales', []))}</td>
            </tr>
            <tr>
              <td><strong>Primary Industry Verticals</strong></td>
              <td>{", ".join(p1.get('supported_industry_verticals', [])[:3])}</td>
              <td>{", ".join(p2.get('supported_industry_verticals', [])[:3])}</td>
            </tr>
            <tr>
              <td><strong>Top Strength</strong></td>
              <td style="color:var(--accent-emerald);">{p1.get('pros', [''])[0]}</td>
              <td style="color:var(--accent-emerald);">{p2.get('pros', [''])[0]}</td>
            </tr>
            <tr>
              <td><strong>Primary Limitation</strong></td>
              <td style="color:var(--accent-rose);">{p1.get('limitations', [''])[0]}</td>
              <td style="color:var(--accent-rose);">{p2.get('limitations', [''])[0]}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Comparative Decision Verdict -->
    <section class="verdict-box" style="margin-bottom:48px;">
      <h2 style="font-size:1.5rem; margin-bottom:16px; color:var(--accent-amber);">The Bottom Line: How to Choose Between {p1['name']} and {p2['name']}</h2>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <h3 style="font-size:1.1rem; color:var(--accent-sky); margin-bottom:8px;">Choose {p1['name']} If:</h3>
          <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.6;">
            {p1.get('editorial_teardown', {}).get('who_its_for', f"You need {p1['name']}'s strengths in rapid execution and frontline workflows.")}
          </p>
          <div style="margin-top:14px;">
            <a href="/cmms/{p1['slug']}/" class="btn btn-secondary" style="font-size:0.8rem; padding:6px 12px;">Full {p1['name']} Breakdown &rarr;</a>
          </div>
        </div>

        <div style="background:var(--bg-surface); padding:20px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <h3 style="font-size:1.1rem; color:var(--accent-emerald); margin-bottom:8px;">Choose {p2['name']} If:</h3>
          <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.6;">
            {p2.get('editorial_teardown', {}).get('who_its_for', f"You prioritize {p2['name']}'s capabilities and operational depth.")}
          </p>
          <div style="margin-top:14px;">
            <a href="/cmms/{p2['slug']}/" class="btn btn-secondary" style="font-size:0.8rem; padding:6px 12px;">Full {p2['name']} Breakdown &rarr;</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  {get_footer_html()}
</body>
</html>
"""
    with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(vs_html)

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

print(f"\n========================================================")
print(f" Engine Compilation Complete!")
print(f" Total Programmatic Pages Generated: {len(sitemap_urls)}")
print(f" - Directory Catalog: 1 page")
print(f" - CMMS Platform Teardowns: {total_platforms} pages")
print(f" - Head-to-Head Comparisons: {len(matchup_pairs)} pages")
print(f" - XML Sitemap: {len(sitemap_urls)} indexed URLs")
print(f" Destination Directory: ./public")
print(f"========================================================")
