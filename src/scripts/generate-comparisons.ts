/**
 * generate-comparisons.ts
 * 
 * Standalone Node.js script that loops through the top 20 CMMS/EAM platforms
 * in software.ts and generates static [software-a]-vs-[software-b].html comparison pages
 * comparing features, pricing, dimension scores, and usability ratings side-by-side.
 */

import * as fs from 'fs';
import * as path from 'path';
import { cmmsSoftware } from '../data/software';
import { CMMS_DATABASE } from '../data/database';
import { EVALUATION_CRITERIA } from '../data/criteria';
import { CMMSSoftware, FAQItem } from '../types/cmms';

const DOMAIN = 'https://plantmainthq.com';
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const COMPARE_DIR = path.join(DIST_DIR, 'compare');

// Ensure output directories exist
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(COMPARE_DIR, { recursive: true });

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateSoftwareSchema(software: CMMSSoftware): string {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': software.name,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': software.deploymentTypes.join(', '),
    'description': software.tagline || software.overview,
    'url': software.websiteUrl,
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': software.overallRating,
      'reviewCount': software.reviewCount,
      'bestRating': '5',
      'worstRating': '1',
    },
  };

  if (typeof software.pricing.startingPricePerUserMonth === 'number') {
    schema.offers = {
      '@type': 'Offer',
      'price': software.pricing.startingPricePerUserMonth,
      'priceCurrency': 'USD',
    };
  }

  return JSON.stringify(schema, null, 2);
}

function generateFaqSchema(faqs: FAQItem[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  };
  return JSON.stringify(schema, null, 2);
}

function renderRoiCalculator(): string {
  return `
    <div class="card" id="roiCalculatorCard" style="background: #ffffff; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); margin-top: 2rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
        <span style="font-size: 1.5rem;">⏱️</span>
        <h2 style="margin: 0; font-size: 1.4rem;">Plant Downtime & Maintenance ROI Estimator</h2>
      </div>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
        Calculate estimated annual cost reductions in unplanned equipment stoppages, emergency technician labor, and MRO stockout penalties.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
        <div>
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">Number of Technicians</label>
          <input type="number" id="calcTechCount" value="8" min="1" max="500" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-family: inherit;" />
        </div>
        <div>
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">Avg Technician Hourly Rate ($/hr)</label>
          <input type="number" id="calcHourlyWage" value="38" min="15" max="250" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-family: inherit;" />
        </div>
        <div>
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">Annual Downtime Hours</label>
          <input type="number" id="calcDowntimeHours" value="120" min="5" max="5000" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-family: inherit;" />
        </div>
        <div>
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">Downtime Cost per Hour ($)</label>
          <input type="number" id="calcDowntimeCost" value="1500" min="50" max="100000" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-family: inherit;" />
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding: 1.25rem; background: var(--primary-light); border: 1px solid var(--primary-border); border-radius: 10px; display: flex; flex-wrap: wrap; justify-content: space-around; gap: 1rem; text-align: center;">
        <div>
          <div style="font-size: 0.82rem; font-weight: 700; color: #1e40af; text-transform: uppercase;">Estimated Annual Savings</div>
          <div id="calcAnnualSavings" style="font-size: 1.8rem; font-weight: 800; color: #1e3a8a; margin-top: 0.25rem;">$54,000</div>
        </div>
        <div>
          <div style="font-size: 0.82rem; font-weight: 700; color: #1e40af; text-transform: uppercase;">Wrench-Time Recovered</div>
          <div id="calcHoursSaved" style="font-size: 1.8rem; font-weight: 800; color: #1e3a8a; margin-top: 0.25rem;">1,248 hrs/yr</div>
        </div>
        <div>
          <div style="font-size: 0.82rem; font-weight: 700; color: #1e40af; text-transform: uppercase;">Payback Period</div>
          <div id="calcPaybackPeriod" style="font-size: 1.8rem; font-weight: 800; color: #1e3a8a; margin-top: 0.25rem;">1.8 Months</div>
        </div>
      </div>
      <script>
        (function() {
          function recalc() {
            var techs = parseFloat(document.getElementById('calcTechCount').value) || 0;
            var wage = parseFloat(document.getElementById('calcHourlyWage').value) || 0;
            var dtHours = parseFloat(document.getElementById('calcDowntimeHours').value) || 0;
            var dtCost = parseFloat(document.getElementById('calcDowntimeCost').value) || 0;

            var wrenchHoursSaved = techs * 3 * 52;
            var directLaborSavings = wrenchHoursSaved * (wage * 0.4);
            var downtimeSavings = (dtHours * 0.25) * dtCost;
            var totalSavings = directLaborSavings + downtimeSavings;
            var estimatedAnnualSoftwareCost = techs * 45 * 12;
            var paybackMonths = (estimatedAnnualSoftwareCost / (totalSavings || 1)) * 12;

            document.getElementById('calcAnnualSavings').innerText = '$' + Math.round(totalSavings).toLocaleString();
            document.getElementById('calcHoursSaved').innerText = Math.round(wrenchHoursSaved).toLocaleString() + ' hrs/yr';
            document.getElementById('calcPaybackPeriod').innerText = Math.max(0.5, Math.round(paybackMonths * 10) / 10) + ' Months';
          }
          ['calcTechCount', 'calcHourlyWage', 'calcDowntimeHours', 'calcDowntimeCost'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', recalc);
          });
          recalc();
        })();
      </script>
    </div>
  `;
}

function renderComparisonHtml(softwareA: CMMSSoftware, softwareB: CMMSSoftware): string {
  const priceA = typeof softwareA.pricing.startingPricePerUserMonth === 'number'
    ? `$${softwareA.pricing.startingPricePerUserMonth}/user/mo`
    : softwareA.pricing.startingPricePerUserMonth;
  const priceB = typeof softwareB.pricing.startingPricePerUserMonth === 'number'
    ? `$${softwareB.pricing.startingPricePerUserMonth}/user/mo`
    : softwareB.pricing.startingPricePerUserMonth;

  const faqs: FAQItem[] = [
    {
      question: `Which is better between ${softwareA.name} and ${softwareB.name}?`,
      answer: `${softwareA.name} scores ${softwareA.overallRating}/5.0 (Best for: ${softwareA.bestFor}), while ${softwareB.name} scores ${softwareB.overallRating}/5.0 (Best for: ${softwareB.bestFor}). Choose based on your specific plant scale, mobile requirements, and ERP integration priorities.`,
    },
    {
      question: `How do the pricing plans of ${softwareA.name} and ${softwareB.name} compare?`,
      answer: `${softwareA.name} starts at ${priceA}, whereas ${softwareB.name} starts at ${priceB}. ${softwareA.pricing.hasFreeTier ? `${softwareA.name} includes a permanent free tier.` : ''} ${softwareB.pricing.hasFreeTier ? `${softwareB.name} includes a permanent free tier.` : ''}`,
    },
    {
      question: `Which platform is faster to implement in an active facility?`,
      answer: `${softwareA.name} estimated implementation timeline is ${softwareA.implementationTime}, compared to ${softwareB.name} at ${softwareB.implementationTime}.`,
    },
    {
      question: `How do their mobile technician usability scores compare?`,
      answer: `${softwareA.name} holds a technician usability score of ${softwareA.technicianUsabilityScore || 8.5}/10, while ${softwareB.name} holds a score of ${softwareB.technicianUsabilityScore || 8.5}/10.`,
    },
  ];

  const title = `${softwareA.name} vs ${softwareB.name} Comparison (2025 Review & Pricing) | PlantMaintHQ`;
  const metaDescription = `Comparing ${softwareA.name} vs ${softwareB.name}? Side-by-side technical evaluation of features, starting pricing (${priceA} vs ${priceB}), technician usability scores, and plant deployment fit.`;
  const canonicalUrl = `${DOMAIN}/compare/${softwareA.slug}-vs-${softwareB.slug}`;

  const jsonLdSchemas = [
    generateSoftwareSchema(softwareA),
    generateSoftwareSchema(softwareB),
    generateFaqSchema(faqs),
  ];

  const jsonLdScripts = jsonLdSchemas
    .map((s) => `\n  <script type="application/ld+json">\n${s}\n  </script>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Favicons & App Icons -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="theme-color" content="#0f52ba" />

  <!-- Open Graph / Social SEO -->
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:image" content="${DOMAIN}/og-banner.png" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="PlantMaintHQ" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
  <meta name="twitter:image" content="${DOMAIN}/og-banner.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">${jsonLdScripts}

  <style>
    :root {
      --primary: #1d4ed8;
      --primary-dark: #1e40af;
      --primary-light: #eff6ff;
      --primary-border: #bfdbfe;
      --accent: #0284c7;
      --accent-warm: #d97706;
      --text-main: #0f172a;
      --text-muted: #475569;
      --text-light: #64748b;
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --border-color: #e2e8f0;
      --border-hover: #cbd5e1;
      --border-focus: #3b82f6;
      --success: #059669;
      --success-light: #ecfdf5;
      --danger: #dc2626;
      --danger-light: #fef2f2;
      --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05);
      --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04);
      --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: var(--font-body);
      background-color: var(--bg-page);
      color: var(--text-main);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, .logo, .btn, .badge, .rating-badge {
      font-family: var(--font-display);
      letter-spacing: -0.02em;
    }
    header {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .logo span.logo-brand { color: var(--text-main); }
    .nav-links {
      display: flex;
      gap: 1.25rem;
      list-style: none;
      align-items: center;
    }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.92rem;
    }
    .nav-links a:hover { color: var(--primary); }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
    }
    .breadcrumbs {
      font-size: 0.85rem;
      color: var(--text-light);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .breadcrumbs a { color: var(--text-muted); text-decoration: none; font-weight: 500; }
    .breadcrumbs a:hover { color: var(--primary); text-decoration: underline; }
    .breadcrumbs span { color: var(--text-main); font-weight: 600; }
    .hero {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.25rem 2rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .hero h1 {
      font-size: 2.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0.75rem 0 0.5rem;
      line-height: 1.2;
    }
    .hero p {
      font-size: 1.05rem;
      color: var(--text-muted);
      max-width: 800px;
      line-height: 1.55;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      background: var(--primary-light);
      color: var(--primary);
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .rating-badge {
      display: inline-flex;
      align-items: center;
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.88rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.75rem;
      box-shadow: var(--shadow-sm);
      margin-bottom: 2rem;
    }
    .card h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 1.25rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.65rem 1.35rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      border: 1px solid var(--primary);
    }
    .btn-primary:hover {
      background: var(--primary-dark);
      border-color: var(--primary-dark);
      color: #ffffff;
    }
    .btn-outline {
      background: #ffffff;
      color: var(--primary);
      border: 1px solid var(--border-color);
    }
    .btn-outline:hover {
      background: var(--primary-light);
      border-color: var(--primary-border);
    }
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.92rem;
    }
    .data-table th {
      background: #f1f5f9;
      padding: 0.85rem 1rem;
      font-weight: 700;
      color: #334155;
      border-bottom: 1px solid var(--border-color);
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: var(--text-main);
    }
    .data-table tr:hover td {
      background: #f8fafc;
    }
    .check-yes {
      color: var(--success);
      font-weight: 700;
    }
    .check-no {
      color: #94a3b8;
    }
    .winner-tag {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      font-size: 0.82rem;
      border: 1px solid #bfdbfe;
    }
    .winner-tie {
      display: inline-block;
      background: #f1f5f9;
      color: #64748b;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      font-size: 0.82rem;
    }
    .pro-list, .con-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .pro-list li::before {
      content: "✔ ";
      color: var(--success);
      font-weight: 700;
      margin-right: 0.35rem;
    }
    .con-list li::before {
      content: "✖ ";
      color: var(--danger);
      font-weight: 700;
      margin-right: 0.35rem;
    }
    .faq-item {
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 0;
    }
    .faq-item:last-child { border-bottom: none; }
    .faq-question {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text-main);
      margin-bottom: 0.4rem;
    }
    .faq-answer {
      color: var(--text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
    }
    footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 3rem 1.5rem 2rem;
      margin-top: 4rem;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #1e293b;
    }
    .footer-links {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .footer-links a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .footer-links a:hover { color: #ffffff; }
    @media (max-width: 768px) {
      .hero h1 { font-size: 1.7rem; }
      .grid-2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav-container">
      <a href="/" class="logo">
        <img src="/favicon.svg" alt="PlantMaintHQ Logo" width="28" height="28" style="vertical-align: middle; border-radius: 6px;" />
        <span>PlantMaint<span class="logo-brand">HQ</span></span>
      </a>
      <ul class="nav-links">
        <li><a href="/">Directory</a></li>
        <li><a href="/pricing/best-free-cmms-software">Free CMMS</a></li>
        <li><a href="/pricing/affordable-cmms-under-50">Pricing</a></li>
        <li><a href="/best-cmms-for-manufacturing">Manufacturing</a></li>
        <li><a href="/best-cmms-for-enterprise">Enterprise EAM</a></li>
        <li><a href="/contact" style="color: var(--primary); font-weight: 700;">Advisory Desk</a></li>
      </ul>
    </div>
  </header>

  <main>
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a> &rsaquo; 
      <a href="/">Comparisons</a> &rsaquo; 
      <span>${escapeHtml(softwareA.name)} vs. ${escapeHtml(softwareB.name)}</span>
    </nav>

    <div class="hero">
      <span class="badge">Head-to-Head Technical Comparison</span>
      <h1>${escapeHtml(softwareA.name)} vs. ${escapeHtml(softwareB.name)}</h1>
      <p>Side-by-side technical evaluation of features, starting pricing, technician usability scores, and plant deployment fit for modern industrial maintenance teams.</p>
    </div>

    <!-- Overview Cards -->
    <div class="grid-2">
      <div class="card" style="margin-bottom: 0;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <img src="${escapeHtml(softwareA.logoUrl)}" alt="${escapeHtml(softwareA.name)} logo" style="width: 56px; height: 56px; object-fit: contain; border-radius: 10px; border: 1px solid #e2e8f0; padding: 4px; background: #ffffff;" />
          <div>
            <h2 style="margin-bottom: 0.25rem;">${escapeHtml(softwareA.name)}</h2>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <span class="rating-badge">★ ${softwareA.overallRating} / 5.0</span>
              <span style="font-size: 0.85rem; font-weight: 700; color: #0284c7; background: #f0f9ff; padding: 0.2rem 0.5rem; border-radius: 6px;">Tech Usability: ${softwareA.technicianUsabilityScore || 8.5}/10</span>
            </div>
          </div>
        </div>
        <p style="margin: 0.75rem 0;"><strong>Best for:</strong> ${escapeHtml(softwareA.bestFor)}</p>
        <p><strong>Starting Price:</strong> ${priceA}</p>
        <p style="margin-top: 0.35rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Implementation:</strong> ${escapeHtml(softwareA.implementationTime)}</p>
        <p style="margin-top: 0.35rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Deployment:</strong> ${escapeHtml(softwareA.deploymentTypes.join(', '))}</p>
        <div style="margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.6rem;">
          <a href="/software/${softwareA.slug}" class="btn btn-outline" style="flex: 1; min-width: 135px; text-align: center;">Read Full Review</a>
          <a href="/go/${softwareA.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="flex: 1; min-width: 135px; text-align: center;">Visit Website ↗</a>
        </div>
      </div>

      <div class="card" style="margin-bottom: 0;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <img src="${escapeHtml(softwareB.logoUrl)}" alt="${escapeHtml(softwareB.name)} logo" style="width: 56px; height: 56px; object-fit: contain; border-radius: 10px; border: 1px solid #e2e8f0; padding: 4px; background: #ffffff;" />
          <div>
            <h2 style="margin-bottom: 0.25rem;">${escapeHtml(softwareB.name)}</h2>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <span class="rating-badge">★ ${softwareB.overallRating} / 5.0</span>
              <span style="font-size: 0.85rem; font-weight: 700; color: #0284c7; background: #f0f9ff; padding: 0.2rem 0.5rem; border-radius: 6px;">Tech Usability: ${softwareB.technicianUsabilityScore || 8.5}/10</span>
            </div>
          </div>
        </div>
        <p style="margin: 0.75rem 0;"><strong>Best for:</strong> ${escapeHtml(softwareB.bestFor)}</p>
        <p><strong>Starting Price:</strong> ${priceB}</p>
        <p style="margin-top: 0.35rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Implementation:</strong> ${escapeHtml(softwareB.implementationTime)}</p>
        <p style="margin-top: 0.35rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Deployment:</strong> ${escapeHtml(softwareB.deploymentTypes.join(', '))}</p>
        <div style="margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.6rem;">
          <a href="/software/${softwareB.slug}" class="btn btn-outline" style="flex: 1; min-width: 135px; text-align: center;">Read Full Review</a>
          <a href="/go/${softwareB.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="flex: 1; min-width: 135px; text-align: center;">Visit Website ↗</a>
        </div>
      </div>
    </div>

    <!-- Quick Benchmark Matrix -->
    <div class="card">
      <h2>High-Level Benchmark Matrix</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 36%;">Core Benchmark</th>
              <th style="width: 32%; text-align: center;">${escapeHtml(softwareA.name)}</th>
              <th style="width: 32%; text-align: center;">${escapeHtml(softwareB.name)}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Overall Rating</strong></td>
              <td style="text-align: center;"><span class="rating-badge">★ ${softwareA.overallRating} / 5.0</span></td>
              <td style="text-align: center;"><span class="rating-badge">★ ${softwareB.overallRating} / 5.0</span></td>
            </tr>
            <tr>
              <td><strong>Technician Usability Score</strong></td>
              <td style="text-align: center;"><strong>${softwareA.technicianUsabilityScore || 8.5} / 10</strong></td>
              <td style="text-align: center;"><strong>${softwareB.technicianUsabilityScore || 8.5} / 10</strong></td>
            </tr>
            <tr>
              <td><strong>Starting Pricing</strong></td>
              <td style="text-align: center;"><strong>${priceA}</strong></td>
              <td style="text-align: center;"><strong>${priceB}</strong></td>
            </tr>
            <tr>
              <td><strong>Free Trial Available</strong></td>
              <td style="text-align: center;">${softwareA.pricing.hasFreeTrial ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
              <td style="text-align: center;">${softwareB.pricing.hasFreeTrial ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
            </tr>
            <tr>
              <td><strong>Permanent Free Tier</strong></td>
              <td style="text-align: center;">${softwareA.pricing.hasFreeTier ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
              <td style="text-align: center;">${softwareB.pricing.hasFreeTier ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
            </tr>
            <tr>
              <td><strong>Mobile-First & Offline Work</strong></td>
              <td style="text-align: center;">${softwareA.deploymentTypes.includes('Mobile-First') ? '<span class="check-yes">✔ Native Offline</span>' : '<span class="check-no">Cloud / Web</span>'}</td>
              <td style="text-align: center;">${softwareB.deploymentTypes.includes('Mobile-First') ? '<span class="check-yes">✔ Native Offline</span>' : '<span class="check-no">Cloud / Web</span>'}</td>
            </tr>
            <tr>
              <td><strong>Predictive Maintenance / IoT Sensors</strong></td>
              <td style="text-align: center;">${softwareA.features.predictiveMaintenanceAndIot >= 8.5 ? '<span class="check-yes">✔ Advanced Telemetry</span>' : '<span class="check-no">Basic Condition</span>'}</td>
              <td style="text-align: center;">${softwareB.features.predictiveMaintenanceAndIot >= 8.5 ? '<span class="check-yes">✔ Advanced Telemetry</span>' : '<span class="check-no">Basic Condition</span>'}</td>
            </tr>
            <tr>
              <td><strong>ERP Integrations (SAP / Oracle / NetSuite)</strong></td>
              <td style="text-align: center;">${softwareA.keyIntegrations.some((i) => /SAP|Oracle|NetSuite/i.test(i)) ? '<span class="check-yes">✔ Native Connectors</span>' : '<span class="check-no">API / Custom</span>'}</td>
              <td style="text-align: center;">${softwareB.keyIntegrations.some((i) => /SAP|Oracle|NetSuite/i.test(i)) ? '<span class="check-yes">✔ Native Connectors</span>' : '<span class="check-no">API / Custom</span>'}</td>
            </tr>
            <tr>
              <td><strong>Typical Implementation Timeline</strong></td>
              <td style="text-align: center;"><strong>${escapeHtml(softwareA.implementationTime)}</strong></td>
              <td style="text-align: center;"><strong>${escapeHtml(softwareB.implementationTime)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Side-by-Side Dimension Scores -->
    <div class="card">
      <h2>Side-by-Side Dimension Scores</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Evaluation Criterion</th>
              <th>${escapeHtml(softwareA.name)}</th>
              <th>${escapeHtml(softwareB.name)}</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            ${EVALUATION_CRITERIA.map((criterion) => {
              const scoreA = softwareA.features[criterion.id as keyof typeof softwareA.features];
              const scoreB = softwareB.features[criterion.id as keyof typeof softwareB.features];
              const winnerText = scoreA > scoreB ? softwareA.name : scoreB > scoreA ? softwareB.name : 'Tie';
              const winnerClass = scoreA === scoreB ? 'winner-tie' : 'winner-tag';
              return `<tr>
                <td><strong>${escapeHtml(criterion.name)}</strong></td>
                <td>${scoreA.toFixed(1)} / 10</td>
                <td>${scoreB.toFixed(1)} / 10</td>
                <td><span class="${winnerClass}">${escapeHtml(winnerText)}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pros and Cons -->
    <div class="grid-2">
      <div class="card">
        <h2>${escapeHtml(softwareA.name)} Advantages & Trade-offs</h2>
        <h3 style="font-size: 0.95rem; color: var(--success); text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 700;">Key Pros</h3>
        <ul class="pro-list" style="margin-bottom: 1.25rem;">
          ${softwareA.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
        <h3 style="font-size: 0.95rem; color: var(--danger); text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 700;">Considerations</h3>
        <ul class="con-list">
          ${softwareA.cons.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </div>

      <div class="card">
        <h2>${escapeHtml(softwareB.name)} Advantages & Trade-offs</h2>
        <h3 style="font-size: 0.95rem; color: var(--success); text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 700;">Key Pros</h3>
        <ul class="pro-list" style="margin-bottom: 1.25rem;">
          ${softwareB.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
        <h3 style="font-size: 0.95rem; color: var(--danger); text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 700;">Considerations</h3>
        <ul class="con-list">
          ${softwareB.cons.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Strategic Recommendation -->
    <div class="card" style="background: #f8fafc; border: 1px solid #cbd5e1;">
      <h2>Strategic Recommendation: How to Choose</h2>
      <div class="grid-2" style="margin-top: 1rem; margin-bottom: 0;">
        <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px;">
          <h3 style="font-size: 1.1rem; color: var(--primary); margin-bottom: 0.5rem;">Why Choose ${escapeHtml(softwareA.name)}?</h3>
          <p style="font-size: 0.95rem; color: #374151; line-height: 1.6;">
            Select <strong>${escapeHtml(softwareA.name)}</strong> if your team prioritizes <strong>${escapeHtml(softwareA.bestFor)}</strong>. It is designed for ${softwareA.targetCompanySizes.join(' and ')} operations with an estimated deployment time of ${escapeHtml(softwareA.implementationTime)}.
          </p>
          <div style="margin-top: 1rem;">
            <a href="/go/${softwareA.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.45rem 1rem;">Explore ${escapeHtml(softwareA.name)} ↗</a>
          </div>
        </div>
        <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px;">
          <h3 style="font-size: 1.1rem; color: var(--primary); margin-bottom: 0.5rem;">Why Choose ${escapeHtml(softwareB.name)}?</h3>
          <p style="font-size: 0.95rem; color: #374151; line-height: 1.6;">
            Select <strong>${escapeHtml(softwareB.name)}</strong> if your operational focus centers on <strong>${escapeHtml(softwareB.bestFor)}</strong>. It fits ${softwareB.targetCompanySizes.join(' and ')} facilities and delivers an implementation speed of ${escapeHtml(softwareB.implementationTime)}.
          </p>
          <div style="margin-top: 1rem;">
            <a href="/go/${softwareB.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.45rem 1rem;">Explore ${escapeHtml(softwareB.name)} ↗</a>
          </div>
        </div>
      </div>
    </div>

    <!-- ROI & Downtime Calculator -->
    ${renderRoiCalculator()}

    <!-- Frequently Asked Questions -->
    <div class="card">
      <h2>Frequently Asked Questions</h2>
      ${faqs.map((faq) => `
        <div class="faq-item">
          <div class="faq-question">${escapeHtml(faq.question)}</div>
          <div class="faq-answer">${escapeHtml(faq.answer)}</div>
        </div>
      `).join('')}
    </div>
  </main>

  <footer>
    <div class="footer-content">
      <div>
        <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem;">PlantMaint<span style="color: #60a5fa;">HQ</span></div>
        <p style="font-size: 0.85rem; max-width: 320px; line-height: 1.5;">The independent directory and technical evaluation resource for plant engineers, maintenance managers, and millwrights.</p>
      </div>
      <div class="footer-links">
        <div>
          <div style="font-weight: 700; color: #ffffff; margin-bottom: 0.5rem; font-size: 0.85rem; text-transform: uppercase;">Comparisons</div>
          <p><a href="/compare/maintainx-vs-upkeep">MaintainX vs UpKeep</a></p>
          <p><a href="/compare/limble-cmms-vs-maintainx">Limble vs MaintainX</a></p>
          <p><a href="/compare/fiix-vs-limble-cmms">Fiix vs Limble</a></p>
          <p><a href="/compare/ibm-maximo-vs-sap-eam">Maximo vs SAP EAM</a></p>
        </div>
        <div>
          <div style="font-weight: 700; color: #ffffff; margin-bottom: 0.5rem; font-size: 0.85rem; text-transform: uppercase;">Resources</div>
          <p><a href="/pricing/best-free-cmms-software">Free CMMS Guide</a></p>
          <p><a href="/pricing/affordable-cmms-under-50">Affordable CMMS</a></p>
          <p><a href="/best-cmms-for-manufacturing">Manufacturing CMMS</a></p>
          <p><a href="/contact">Advisory Desk</a></p>
        </div>
      </div>
    </div>
    <div style="max-width: 1200px; margin: 1.5rem auto 0; font-size: 0.8rem; color: #64748b; text-align: center;">
      &copy; 2025-2026 PlantMaintHQ. Independent maintenance benchmarks. All product names and trademarks belong to their respective holders.
    </div>
  </footer>
</body>
</html>`;
}

/**
 * Main generator loop:
 * Takes the top 20 platforms from software.ts, loops through every combination,
 * and outputs static [software-a]-vs-[software-b].html pages.
 */
export function generateTop20Comparisons(): { count: number; files: string[] } {
  console.log(`🔍 Reading top 20 platforms from software.ts...`);

  // Grab the top 20 platforms from cmmsSoftware
  const top20Raw = cmmsSoftware.slice(0, 20);

  // Map to full CMMSSoftware objects from CMMS_DATABASE
  const top20: CMMSSoftware[] = top20Raw.map((raw) => {
    const found = CMMS_DATABASE.find((db) => db.id === raw.id || db.slug === raw.slug);
    if (!found) {
      throw new Error(`Software ${raw.name} (${raw.id}) not found in CMMS_DATABASE`);
    }
    return found;
  });

  console.log(`📋 Top 20 platforms selected:`);
  top20.forEach((p, idx) => console.log(`   ${idx + 1}. ${p.name} (${p.slug})`));

  let generatedCount = 0;
  const generatedFiles: string[] = [];

  for (let i = 0; i < top20.length; i++) {
    for (let j = i + 1; j < top20.length; j++) {
      const swA = top20[i];
      const swB = top20[j];

      const html = renderComparisonHtml(swA, swB);
      const filename = `${swA.slug}-vs-${swB.slug}.html`;

      // 1. Output to dist/compare/[software-a]-vs-[software-b].html
      const compareFilePath = path.join(COMPARE_DIR, filename);
      fs.writeFileSync(compareFilePath, html, 'utf-8');

      // 2. Output to dist/compare/[software-a]-vs-[software-b]/index.html for clean URL routing
      const compareNestedDir = path.join(COMPARE_DIR, `${swA.slug}-vs-${swB.slug}`);
      fs.mkdirSync(compareNestedDir, { recursive: true });
      fs.writeFileSync(path.join(compareNestedDir, 'index.html'), html, 'utf-8');

      // 3. Output to dist/[software-a]-vs-[software-b].html as specified in user prompt
      const rootDistFilePath = path.join(DIST_DIR, filename);
      fs.writeFileSync(rootDistFilePath, html, 'utf-8');

      generatedCount++;
      generatedFiles.push(filename);
    }
  }

  console.log(`\n✨ Successfully generated ${generatedCount} static comparison pages!`);
  console.log(`   - Saved to: ${COMPARE_DIR}/[software-a]-vs-[software-b].html`);
  console.log(`   - Saved to: ${COMPARE_DIR}/[software-a]-vs-[software-b]/index.html`);
  console.log(`   - Saved to: ${DIST_DIR}/[software-a]-vs-[software-b].html`);

  return { count: generatedCount, files: generatedFiles };
}

// Auto-run if executed directly
if (require.main === module) {
  generateTop20Comparisons();
}
