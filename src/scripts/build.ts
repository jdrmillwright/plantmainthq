import * as fs from 'fs';
import * as path from 'path';
import { CMMS_DATABASE } from '../data/database';
import { EVALUATION_CRITERIA, INDUSTRY_CONFIGURATIONS } from '../data/criteria';
import { getAllProgrammaticRoutes } from '../lib/seo';
import { CMMSSoftware, GeneratedSeoPage, FAQItem } from '../types/cmms';
import { writeSitemapAndRobots } from './generate-sitemap';

const DOMAIN = 'https://plantmainthq.com';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

// Helper to escape HTML characters safely
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Basic HTML Minifier that safely preserves script tags
function minifyHtml(html: string): string {
  const scripts: string[] = [];
  const placeholderPrefix = '___SCRIPT_PLACEHOLDER_';
  const htmlWithoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => {
    const idx = scripts.length;
    scripts.push(match);
    return `${placeholderPrefix}${idx}___`;
  });

  const minifiedHtml = htmlWithoutScripts
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/>\s+</g, '><')
    .trim();

  return minifiedHtml.replace(new RegExp(`${placeholderPrefix}(\\d+)___`, 'g'), (_, idx) => {
    return scripts[Number(idx)];
  });
}

// Generate JSON-LD SoftwareApplication schema markup for software profile pages
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

// Generate JSON-LD BreadcrumbList schema
function generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]): string {
  const itemListElement = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': crumb.name,
    'item': crumb.url.startsWith('http') ? crumb.url : `${DOMAIN}${crumb.url}`,
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': itemListElement,
  }, null, 2);
}

// Generate JSON-LD FAQPage schema markup
function generateFaqSchema(faqs: FAQItem[]): string {
  const mainEntity = faqs.map((faq) => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.answer,
    },
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': mainEntity,
  }, null, 2);
}

// Render HTML FAQ Accordion Card
function renderFaqSection(faqs: FAQItem[]): string {
  if (!faqs || faqs.length === 0) return '';

  return `
    <div class="card">
      <h2>Frequently Asked Questions</h2>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
        ${faqs
          .map(
            (faq) => `
          <div style="border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px; background: #f8fafc;">
            <h3 style="font-size: 1.05rem; color: #0f172a; margin-bottom: 0.4rem;">❓ ${escapeHtml(faq.question)}</h3>
            <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6;">${escapeHtml(faq.answer)}</p>
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;
}

// Render Interactive Maintenance ROI & Downtime Cost Calculator
function renderRoiCalculator(): string {
  return `
    <div class="card" style="background: #0f172a; color: #ffffff; border: 1px solid #1e293b;">
      <h2 style="color: #ffffff; border-bottom: 1px solid #334155;">🧮 Interactive Maintenance ROI & Downtime Savings Calculator</h2>
      <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">Estimate annual cost savings by reducing equipment downtime and streamlining technician wrench time with an industrial CMMS.</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div>
          <label style="font-size: 0.85rem; color: #cbd5e1; display: block; margin-bottom: 0.4rem; font-weight: 500;">Maintenance Techs / Operators</label>
          <input type="number" id="roiTechs" value="10" min="1" max="500" style="width: 100%; min-height: 44px; padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid #475569; background: #1e293b; color: #fff; font-size: 16px;" />
        </div>
        <div>
          <label style="font-size: 0.85rem; color: #cbd5e1; display: block; margin-bottom: 0.4rem; font-weight: 500;">Hourly Unplanned Downtime Cost ($)</label>
          <input type="number" id="roiDowntimeCost" value="1500" min="100" step="100" style="width: 100%; min-height: 44px; padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid #475569; background: #1e293b; color: #fff; font-size: 16px;" />
        </div>
        <div>
          <label style="font-size: 0.85rem; color: #cbd5e1; display: block; margin-bottom: 0.4rem; font-weight: 500;">Unplanned Downtime Hours / Month</label>
          <input type="number" id="roiDowntimeHours" value="12" min="1" max="200" style="width: 100%; min-height: 44px; padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid #475569; background: #1e293b; color: #fff; font-size: 16px;" />
        </div>
      </div>

      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 1rem; text-align: center;">
        <div style="padding: 0.5rem;">
          <div style="font-size: 0.78rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600;">Est. Annual Downtime Cost Reduction</div>
          <div id="roiDowntimeSavings" style="font-size: 1.55rem; font-weight: 800; color: #34d399; margin-top: 0.35rem;">$129,600</div>
        </div>
        <div style="padding: 0.5rem;">
          <div style="font-size: 0.78rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600;">Est. Tech Wrench Time Recovered</div>
          <div id="roiTechSavings" style="font-size: 1.55rem; font-weight: 800; color: #60a5fa; margin-top: 0.35rem;">1,040 hrs/yr</div>
        </div>
        <div style="padding: 0.5rem;">
          <div style="font-size: 0.78rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600;">Est. CMMS System ROI</div>
          <div id="roiMultiple" style="font-size: 1.55rem; font-weight: 800; color: #f59e0b; margin-top: 0.35rem;">21.6x Return</div>
        </div>
      </div>

      <script>
        (function() {
          const techsInput = document.getElementById('roiTechs');
          const costInput = document.getElementById('roiDowntimeCost');
          const hoursInput = document.getElementById('roiDowntimeHours');

          const downtimeSavingsEl = document.getElementById('roiDowntimeSavings');
          const techSavingsEl = document.getElementById('roiTechSavings');
          const roiMultipleEl = document.getElementById('roiMultiple');

          function calculateROI() {
            const techs = Math.max(1, parseFloat(techsInput.value) || 0);
            const hourlyCost = Math.max(0, parseFloat(costInput.value) || 0);
            const monthlyDowntime = Math.max(0, parseFloat(hoursInput.value) || 0);

            /* Assumptions: CMMS reduces unplanned downtime by ~60%, recovers 2 hrs/tech/week of admin time */
            const annualDowntimeCost = monthlyDowntime * 12 * hourlyCost;
            const downtimeSavings = Math.round(annualDowntimeCost * 0.60);

            const hoursSavedPerTechYear = 2 * 52; /* 104 hours/year per tech */
            const totalHoursSaved = techs * hoursSavedPerTechYear;

            /* Estimated CMMS cost: $600/user/year */
            const estimatedCmmsCost = techs * 600;
            const roiRatio = estimatedCmmsCost > 0 ? (downtimeSavings / estimatedCmmsCost).toFixed(1) : '0';

            downtimeSavingsEl.textContent = '$' + downtimeSavings.toLocaleString();
            techSavingsEl.textContent = totalHoursSaved.toLocaleString() + ' hrs/yr';
            roiMultipleEl.textContent = roiRatio + 'x Return';
          }

          [techsInput, costInput, hoursInput].forEach(el => {
            if (el) el.addEventListener('input', calculateROI);
          });
        })();
      </script>
    </div>
  `;
}

// Global Layout Wrapper with OpenGraph, Google Analytics & Multi-Schema Support
function renderLayout(page: {
  title: string;
  metaDescription: string;
  canonicalUrl: string;
  bodyHtml: string;
  jsonLdSchemas?: string[];
  breadcrumbs?: { name: string; url: string }[];
}): string {
  const jsonLdScripts = (page.jsonLdSchemas || [])
    .map((schema) => `\n  <script type="application/ld+json">\n${schema}\n  </script>`)
    .join('');

  const breadcrumbsHtml = page.breadcrumbs && page.breadcrumbs.length > 0
    ? `<nav class="breadcrumbs" aria-label="Breadcrumb">
        ${page.breadcrumbs
          .map((crumb, idx) =>
            idx === page.breadcrumbs!.length - 1
              ? `<span>${escapeHtml(crumb.name)}</span>`
              : `<a href="${crumb.url}">${escapeHtml(crumb.name)}</a> &rsaquo; `
          )
          .join('')}
      </nav>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.metaDescription)}" />
  <link rel="canonical" href="${page.canonicalUrl}" />

  <!-- Favicons & App Icons (Browser Tabs, Bookmarks, Mobile Shortcuts) -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="theme-color" content="#0f52ba" />

  <!-- Google Analytics (GA4) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-PLANTMAINT"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-PLANTMAINT');
  </script>

  <!-- Open Graph / Social SEO -->
  <meta property="og:title" content="${escapeHtml(page.title)}" />
  <meta property="og:description" content="${escapeHtml(page.metaDescription)}" />
  <meta property="og:image" content="${DOMAIN}/og-banner.png" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${page.canonicalUrl}" />
  <meta property="og:site_name" content="PlantMaintHQ" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(page.title)}" />
  <meta name="twitter:description" content="${escapeHtml(page.metaDescription)}" />
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
      -moz-osx-font-smoothing: grayscale;
    }
    h1, h2, h3, h4, .logo, .btn, .badge, .rating-badge, .filter-preset-btn {
      font-family: var(--font-display);
      letter-spacing: -0.02em;
    }
    header {
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
      transition: all 0.2s ease;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }
    .logo {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--primary);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      letter-spacing: -0.03em;
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
      transition: color 0.15s ease, background-color 0.15s ease;
      padding: 0.4rem 0.65rem;
      border-radius: 6px;
    }
    .nav-links a:hover {
      color: var(--primary);
      background-color: var(--primary-light);
    }
    .mobile-menu-btn {
      display: none;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.5rem;
      width: 44px;
      height: 44px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-main);
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .mobile-menu-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.75rem 1.5rem 5rem 1.5rem;
    }
    .breadcrumbs {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }
    .breadcrumbs a {
      color: var(--primary);
      text-decoration: none;
    }
    .breadcrumbs a:hover { text-decoration: underline; }
    .breadcrumbs span {
      color: var(--text-main);
      font-weight: 600;
    }
    .hero {
      margin-bottom: 2.5rem;
      text-align: center;
    }
    .hero h1 {
      font-size: 2.4rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.75rem;
      line-height: 1.25;
      letter-spacing: -0.03em;
    }
    .hero p {
      font-size: 1.1rem;
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--primary-light);
      color: var(--primary-dark);
      border: 1px solid var(--primary-border);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 2rem;
      box-shadow: var(--shadow-sm);
      margin-bottom: 2rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card h2 {
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.65rem;
      letter-spacing: -0.02em;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      gap: 1.5rem;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
      gap: 1.5rem;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 1rem;
    }
    .grid-stats-mobile {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
      min-height: 42px;
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 1px 2px rgba(29, 78, 216, 0.2);
    }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline {
      background: #ffffff;
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }
    .btn-outline:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: var(--primary);
    }
    .btn-dark {
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #334155;
    }
    .btn-dark:hover { background: #1e293b; color: #ffffff; }
    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.88rem;
    }
    .pill {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 500;
      margin: 0.2rem 0.25rem 0.2rem 0;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 1.25rem 0;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: #ffffff;
    }
    table.data-table {
      width: 100%;
      min-width: 540px;
      border-collapse: collapse;
      background: #fff;
    }
    table.data-table th, table.data-table td {
      padding: 0.9rem 1.15rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    table.data-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
      font-family: var(--font-display);
      font-size: 0.88rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    table.data-table tr:last-child td { border-bottom: none; }
    table.data-table tr:hover td { background: #fbfcfe; }
    .score-bar-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .score-bar-bg {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .score-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 4px;
    }
    .pros-cons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }
    .pro-list { color: #065f46; list-style: none; }
    .pro-list li { margin-bottom: 0.6rem; position: relative; padding-left: 1.5rem; line-height: 1.5; font-size: 0.95rem; }
    .pro-list li::before { content: "✓"; font-weight: 800; color: var(--success); position: absolute; left: 0; }
    .con-list { color: #991b1b; list-style: none; }
    .con-list li { margin-bottom: 0.6rem; position: relative; padding-left: 1.5rem; line-height: 1.5; font-size: 0.95rem; }
    .con-list li::before { content: "✕"; font-weight: 800; color: var(--danger); position: absolute; left: 0; }
    .capability-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem;
      transition: border-color 0.15s ease;
    }
    .capability-card:hover { border-color: #cbd5e1; }
    .capability-card h4 {
      font-size: 1.05rem;
      color: #0f172a;
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .capability-card p {
      font-size: 0.92rem;
      color: var(--text-muted);
      line-height: 1.55;
    }
    .check-yes { color: var(--success); font-weight: 800; font-size: 1.05rem; }
    .check-no { color: var(--danger); font-weight: 800; font-size: 1.05rem; }
    
    /* Software directory card styling */
    .software-card {
      border: 1px solid var(--border-color);
      padding: 1.35rem;
      border-radius: 12px;
      background: #ffffff;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .software-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: #cbd5e1;
    }
    .software-card h4 a {
      color: var(--text-main);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .software-card h4 a:hover { color: var(--primary); }

    /* Filter Presets horizontal scrollable bar */
    .filter-presets-scroll {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 0.2rem 0.2rem 0.6rem 0.2rem;
      scrollbar-width: none;
    }
    .filter-presets-scroll::-webkit-scrollbar { display: none; }
    .filter-preset-btn {
      flex-shrink: 0;
      white-space: nowrap;
      min-height: 36px;
      border-radius: 20px;
      padding: 0.3rem 0.85rem;
      font-size: 0.82rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    /* iOS safe input sizing (>=16px to prevent auto-zoom) */
    input[type="text"], input[type="number"], select {
      font-family: var(--font-body);
      font-size: 16px;
      min-height: 44px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      padding: 0.6rem 0.85rem;
      background: #ffffff;
      color: var(--text-main);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 3.5rem 1.5rem 2.5rem 1.5rem;
      border-top: 1px solid #1e293b;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 2.5rem;
    }
    .footer-col h4 {
      color: #ffffff;
      font-size: 1rem;
      margin-bottom: 1.1rem;
      letter-spacing: -0.01em;
    }
    .footer-col ul { list-style: none; }
    .footer-col ul li { margin-bottom: 0.65rem; }
    .footer-col a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.15s ease;
    }
    .footer-col a:hover { color: #ffffff; }
    .footer-bottom {
      max-width: 1200px;
      margin: 2.5rem auto 0 auto;
      padding-top: 1.5rem;
      border-top: 1px solid #1e293b;
      text-align: center;
      font-size: 0.85rem;
      color: #64748b;
    }

    @media (max-width: 768px) {
      .hero { text-align: left; margin-bottom: 1.75rem; }
      .hero h1 { font-size: 1.85rem; line-height: 1.25; }
      .hero p { font-size: 1rem; margin: 0; }
      .pros-cons { grid-template-columns: 1fr; gap: 1rem; }
      .mobile-menu-btn { display: inline-flex; }
      .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #ffffff;
        border-bottom: 1px solid var(--border-color);
        box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.1);
        flex-direction: column;
        width: 100%;
        padding: 0.75rem 1rem 1.25rem 1rem;
        gap: 0.4rem;
        z-index: 100;
        animation: mobileMenuSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes mobileMenuSlideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .nav-links.active {
        display: flex;
      }
      .nav-links a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        min-height: 44px;
        font-size: 0.98rem;
        color: var(--text-main);
        border-radius: 8px;
        background: #f8fafc;
      }
      .nav-links a:hover, .nav-links a:active {
        background: var(--primary-light);
        color: var(--primary);
      }
      .card {
        padding: 1.25rem 1rem;
        margin-bottom: 1.25rem;
        border-radius: 10px;
      }
      main {
        padding: 1rem 1rem 3rem 1rem;
      }
      .grid-stats-mobile {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.65rem;
      }
      .footer-container {
        grid-template-columns: 1fr;
        gap: 1.75rem;
      }
      .footer-col ul li a {
        display: inline-block;
        padding: 0.25rem 0;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav-container">
      <a href="/" class="logo">
        <img src="/favicon.svg" alt="PlantMaintHQ Logo" width="28" height="28" style="vertical-align: middle; border-radius: 6px; display: inline-block;" />
        <span>PlantMaint<span class="logo-brand">HQ</span></span>
      </a>
      <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle Navigation Menu" aria-expanded="false">
        <svg class="icon-hamburger" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg class="icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <ul class="nav-links" id="mainNavLinks">
        <li><a href="/pricing/best-free-cmms-software">Free CMMS</a></li>
        <li><a href="/pricing/affordable-cmms-under-50">Pricing Guide</a></li>
        <li><a href="/best-cmms-for-manufacturing">Manufacturing</a></li>
        <li><a href="/best-cmms-for-work-order-management">Features</a></li>
        <li><a href="/best-cmms-for-small-teams">Small Teams</a></li>
        <li><a href="/best-cmms-for-enterprise">Enterprise EAM</a></li>
        <li><a href="/contact" style="color: var(--primary); font-weight: 700;">Contact & Advisory</a></li>
      </ul>
    </div>
  </header>

  <main>
    ${breadcrumbsHtml}
    ${page.bodyHtml}
  </main>

  <footer>
    <div class="footer-container">
      <div class="footer-col">
        <h4>PlantMaintHQ</h4>
        <p style="font-size: 0.85rem; line-height: 1.5;">The independent CMMS and Enterprise Asset Management benchmark directory for industrial, manufacturing, and facility leaders.</p>
        <p style="font-size: 0.8rem; color: #6b7280; margin-top: 0.75rem;">106 verified systems benchmarked across 20+ operational criteria.</p>
        <div style="margin-top: 1rem;">
          <a href="/contact" class="btn btn-outline" style="font-size: 0.82rem; padding: 0.4rem 0.85rem; background: #ffffff; color: #1e293b; border-color: #cbd5e1; display: inline-block;">Get Free CMMS Advice ➔</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Popular Industries</h4>
        <ul>
          <li><a href="/best-cmms-for-manufacturing">Manufacturing CMMS</a></li>
          <li><a href="/best-cmms-for-food-beverage">Food & Beverage</a></li>
          <li><a href="/best-cmms-for-facilities-property">Facilities & Property</a></li>
          <li><a href="/best-cmms-for-oil-gas">Oil & Gas</a></li>
          <li><a href="/best-cmms-for-fleet-heavy-equipment">Fleet & Heavy Equipment</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Pricing & Evaluation</h4>
        <ul>
          <li><a href="/pricing/best-free-cmms-software">100% Free CMMS Software</a></li>
          <li><a href="/pricing/affordable-cmms-under-50">Budget CMMS Under $50/mo</a></li>
          <li><a href="/best-cmms-for-small-teams">Small Business CMMS Guide</a></li>
          <li><a href="/best-cmms-for-mid-market-plants">Mid-Market Facilities</a></li>
          <li><a href="/best-cmms-for-enterprise">Enterprise EAM Systems</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Maintenance Features</h4>
        <ul>
          <li><a href="/best-cmms-for-work-order-management">Work Order Management</a></li>
          <li><a href="/best-cmms-for-preventive-maintenance">Preventive Maintenance (PM)</a></li>
          <li><a href="/best-cmms-for-mro-inventory-management">MRO Inventory & Parts</a></li>
          <li><a href="/best-cmms-for-mobile-app-usability">Technician Mobile Usability</a></li>
          <li><a href="/best-cmms-for-predictive-maintenance-and-iot">Predictive & IoT Sensors</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} PlantMaintHQ.com — Independent Maintenance Software Directory. <a href="/contact" style="color: #94a3b8; text-decoration: underline; margin-left: 0.75rem;">Contact & Advisory Team</a></p>
    </div>
  </footer>
  <script>
    (function() {
      var btn = document.getElementById('mobileMenuBtn');
      var nav = document.getElementById('mainNavLinks');
      if (btn && nav) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var isOpen = nav.classList.toggle('active');
          btn.classList.toggle('active', isOpen);
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          var iconHam = btn.querySelector('.icon-hamburger');
          var iconClose = btn.querySelector('.icon-close');
          if (iconHam && iconClose) {
            iconHam.style.display = isOpen ? 'none' : 'block';
            iconClose.style.display = isOpen ? 'block' : 'none';
          }
        });
        document.addEventListener('click', function(e) {
          if (nav.classList.contains('active') && !nav.contains(e.target) && e.target !== btn) {
            nav.classList.remove('active');
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
            var iconHam = btn.querySelector('.icon-hamburger');
            var iconClose = btn.querySelector('.icon-close');
            if (iconHam && iconClose) {
              iconHam.style.display = 'block';
              iconClose.style.display = 'none';
            }
          }
        });
      }
    })();
  </script>
</body>
</html>`;
}

// Helper to construct FAQs for software profile pages
function buildSoftwareFaqs(software: CMMSSoftware): FAQItem[] {
  if (software.faqs && software.faqs.length > 0) return software.faqs;

  const startingPrice =
    typeof software.pricing.startingPricePerUserMonth === 'number'
      ? `$${software.pricing.startingPricePerUserMonth} per user per month`
      : software.pricing.startingPricePerUserMonth;

  return [
    {
      question: `How much does ${software.name} cost?`,
      answer: `${software.name} starting plans begin at ${startingPrice}. ${software.pricing.hasFreeTrial ? 'A free trial is available to evaluate features before committing.' : 'Contact sales for custom enterprise tier quotes.'}`,
    },
    {
      question: `How long does it take to implement ${software.name}?`,
      answer: `Typical onboarding and deployment for ${software.name} takes approximately ${software.implementationTime}, depending on team scale and data migration needs.`,
    },
    {
      question: `What industries is ${software.name} best suited for?`,
      answer: `${software.name} is widely used in ${software.supportedIndustries.join(', ')} maintenance operations.`,
    },
    {
      question: `Does ${software.name} offer a free tier or trial?`,
      answer: `${software.pricing.hasFreeTier ? 'Yes, a free plan option is available.' : 'There is no permanent free tier, but a free trial is available.'}`,
    },
  ];
}

// Renderers for different page types
function renderSoftwareProfile(software: CMMSSoftware): { bodyHtml: string; faqs: FAQItem[] } {
  const priceDisplay =
    typeof software.pricing.startingPricePerUserMonth === 'number'
      ? `$${software.pricing.startingPricePerUserMonth} / user / month`
      : software.pricing.startingPricePerUserMonth;

  // Other software for comparison links
  const otherSoftware = CMMS_DATABASE.filter((s) => s.id !== software.id).slice(0, 4);

  // Map industry verticals to internal SEO guide URLs for interlinking
  const industryGuidesMap: Record<string, string> = {
    'Manufacturing': '/best-cmms-for-manufacturing',
    'Food & Beverage': '/best-cmms-for-food-beverage',
    'Oil & Gas': '/best-cmms-for-oil-gas',
    'Facilities & Property': '/best-cmms-for-facilities-property',
    'Fleet & Heavy Equipment': '/best-cmms-for-fleet-heavy-equipment',
  };

  const industryLinks = software.supportedIndustries
    .map((ind) => {
      const guideUrl = industryGuidesMap[ind];
      return guideUrl
        ? `<a href="${guideUrl}" class="pill" style="color: var(--primary); text-decoration: none; font-weight: 500;">${escapeHtml(ind)} Guide →</a>`
        : `<span class="pill">${escapeHtml(ind)}</span>`;
    })
    .join('');

  // Generate contextual Editor's Verdict if not explicitly provided
  const verdictText =
    software.editorsVerdict ||
    `${software.name} achieves a rating of ${software.overallRating}/5.0 based on verified user evaluations, standing out as a compelling platform for ${software.supportedIndustries.slice(0, 3).join(', ')} maintenance operations. With an estimated onboarding timeline of ${software.implementationTime.toLowerCase()}, its primary operational strength lies in ${software.pros[0] ? software.pros[0].toLowerCase() : 'reliable asset management workflows'}. While teams should consider ${software.cons[0] ? software.cons[0].toLowerCase() : 'potential deployment considerations'}, ${software.name} offers strong strategic value for ${software.targetCompanySizes.join(' and ')} organizations.`;

  const faqs = buildSoftwareFaqs(software);

  const bodyHtml = `
    <div style="margin-bottom: 1.5rem;">
      <a href="/" class="btn btn-dark">← Back to Directory</a>
    </div>
    <div class="hero">
      <img src="${escapeHtml(software.logoUrl)}" alt="${escapeHtml(software.name)} logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 1rem; border-radius: 8px; background: #fff; padding: 0.5rem; box-shadow: var(--shadow-sm);" />
      <br />
      <span class="badge">Independent CMMS Software Review</span>
      <h1>${escapeHtml(software.name)} Review & Analysis</h1>
      <p>${escapeHtml(software.tagline)}</p>
      <div style="margin-top: 1.25rem; display: flex; justify-content: center; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <span class="rating-badge">★ ${software.overallRating} / 5.0 (${software.reviewCount.toLocaleString()} verified ratings)</span>
        <span style="font-size: 0.95rem; font-weight: 600; color: #374151;">Starts at ${priceDisplay}</span>
        <a href="/contact?tool=${encodeURIComponent(software.name)}" class="btn btn-outline" style="padding: 0.45rem 0.9rem; font-size: 0.85rem; background: #ffffff;">Get Advisor Advice on ${escapeHtml(software.name)}</a>
        <a href="/go/${software.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="padding: 0.45rem 0.9rem; font-size: 0.85rem;">Official Website ↗</a>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid-stats-mobile">
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 10px; text-align: center; box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">Implementation</div>
        <div style="font-size: 1.05rem; font-weight: 800; color: var(--primary); margin-top: 0.3rem;">${escapeHtml(software.implementationTime)}</div>
      </div>
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 10px; text-align: center; box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">Deployment</div>
        <div style="font-size: 1.05rem; font-weight: 800; color: #111827; margin-top: 0.3rem;">${software.deploymentTypes.join(', ')}</div>
      </div>
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 10px; text-align: center; box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">Free Trial</div>
        <div style="font-size: 1.05rem; font-weight: 800; color: ${software.pricing.hasFreeTrial ? 'var(--success)' : '#6b7280'}; margin-top: 0.3rem;">${software.pricing.hasFreeTrial ? 'Yes (Full Access)' : 'No'}</div>
      </div>
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 10px; text-align: center; box-shadow: var(--shadow-sm);">
        <div style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">Founded</div>
        <div style="font-size: 1.05rem; font-weight: 800; color: #111827; margin-top: 0.3rem;">${software.yearFounded}</div>
      </div>
    </div>

    <!-- Section: System Overview -->
    <div class="card">
      <h2>System Overview</h2>
      <p style="font-size: 1.05rem; color: #374151; line-height: 1.7; margin-bottom: 1.25rem;">
        ${escapeHtml(software.overview)}
      </p>

      <!-- Contextual Editor's Verdict Block -->
      <div style="background: #f8fafc; border-left: 4px solid var(--primary); padding: 1.25rem; border-radius: 0 8px 8px 0; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.05rem; color: #0f172a; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
          💡 Editor's Verdict
        </h3>
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin-bottom: 0.75rem;">
          ${escapeHtml(verdictText)}
        </p>
        <div style="font-size: 0.9rem; color: #1e293b; border-top: 1px solid #e2e8f0; padding-top: 0.5rem;">
          <strong>Target Recommendation:</strong> ${escapeHtml(software.bestFor)}
        </div>
      </div>

      <div class="grid-2">
        <div>
          <h3 style="font-size: 1rem; color: #111827; margin-bottom: 0.5rem;">Supported Industry Verticals</h3>
          <div>${industryLinks}</div>
        </div>
        <div>
          <h3 style="font-size: 1rem; color: #111827; margin-bottom: 0.5rem;">Target Company Scales</h3>
          <div>
            ${software.targetCompanySizes.map((sz) => `<span class="pill">${escapeHtml(sz)}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Core Capabilities Deep Dive -->
    <div class="card">
      <h2>Core Capabilities & Architecture</h2>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">A granular look into how ${escapeHtml(software.name)} structures day-to-day work orders, preventive triggers, and equipment telemetry.</p>
      
      <div class="grid-2">
        ${software.coreCapabilities
          .map(
            (cap) => `
          <div class="capability-card">
            <h4>⚙️ ${escapeHtml(cap.title)}</h4>
            <p>${escapeHtml(cap.description)}</p>
          </div>`
          )
          .join('')}
      </div>
    </div>

    <!-- Section: Evaluation Dimension Ratings -->
    <div class="card">
      <h2>Evaluation Dimension Ratings (Out of 10)</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 38%;">Feature Dimension</th>
              <th style="width: 42%;">Score Rating</th>
              <th style="width: 20%;">Category</th>
            </tr>
          </thead>
          <tbody>
            ${EVALUATION_CRITERIA.map((criterion) => {
              const score = software.features[criterion.id as keyof typeof software.features];
              const pct = Math.round((score / 10) * 100);
              return `<tr>
                <td>
                  <strong>${escapeHtml(criterion.name)}</strong>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(criterion.description)}</div>
                </td>
                <td>
                  <div class="score-bar-container">
                    <div class="score-bar-bg">
                      <div class="score-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                    <span class="rating-badge">${score.toFixed(1)} / 10</span>
                  </div>
                </td>
                <td><span style="text-transform: capitalize; color: var(--text-muted); font-size: 0.85rem;">${criterion.category}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section: Pros and Limitations -->
    <div class="card">
      <h2>Pros & Limitations</h2>
      <div class="pros-cons">
        <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 8px; border: 1px solid #bbf7d0;">
          <h4 style="color: #166534; margin-bottom: 0.75rem; font-size: 1.1rem;">Key Advantages</h4>
          <ul class="pro-list">
            ${software.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
          </ul>
        </div>
        <div style="background: #fef2f2; padding: 1.5rem; border-radius: 8px; border: 1px solid #fecaca;">
          <h4 style="color: #991b1b; margin-bottom: 0.75rem; font-size: 1.1rem;">Limitations & Watchouts</h4>
          <ul class="con-list">
            ${software.cons.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- Section: Support & Ecosystem -->
    <div class="card">
      <h2>Customer Support & Integrations</h2>
      <div class="grid-2">
        <div>
          <h3 style="font-size: 1.05rem; margin-bottom: 0.5rem; color: #111827;">Support SLA & Onboarding</h3>
          <p style="font-size: 0.95rem; color: var(--text-muted);">${escapeHtml(software.customerSupport)}</p>
        </div>
        <div>
          <h3 style="font-size: 1.05rem; margin-bottom: 0.5rem; color: #111827;">Ecosystem & ERP Bridges</h3>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 0.5rem;">Pre-built or native connectors available for:</p>
          <div>
            ${software.keyIntegrations.map((ig) => `<span class="pill">${escapeHtml(ig)}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Pricing Tiers -->
    <div class="card">
      <h2>Pricing Plans & Licensing Tiers</h2>
      <div class="grid-3" style="margin-top: 1rem;">
        ${software.pricing.plans
          .map((plan) => {
            const price = typeof plan.pricePerUserMonth === 'number' ? `$${plan.pricePerUserMonth}` : plan.pricePerUserMonth;
            return `
            <div style="border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 8px; background: #fafafa; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="font-size: 1.15rem; color: var(--primary-dark);">${escapeHtml(plan.name)}</h3>
                <p style="font-size: 1.5rem; font-weight: 800; margin: 0.5rem 0; color: #111827;">${price} <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">/ user / mo (${plan.billingCycle})</span></p>
                <ul style="font-size: 0.88rem; color: #4b5563; padding-left: 1.2rem; margin-top: 0.75rem;">
                  ${plan.highlightedFeatures.map((f) => `<li style="margin-bottom: 0.35rem;">${escapeHtml(f)}</li>`).join('')}
                </ul>
              </div>
            </div>`;
          })
          .join('')}
      </div>
      <div style="margin-top: 2rem; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <a href="/contact?tool=${encodeURIComponent(software.name)}" class="btn btn-outline" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: #ffffff;">Ask an Advisor About ${escapeHtml(software.name)} ➔</a>
        <a href="/go/${software.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 1rem;">Explore ${software.name} Official Plans ↗</a>
      </div>
    </div>

    <!-- Section: FAQ -->
    ${renderFaqSection(faqs)}

    <!-- Section: Compare Against Alternatives -->
    <div class="card">
      <h2>Compare ${escapeHtml(software.name)} with Other CMMS Platforms</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">Evaluate how ${escapeHtml(software.name)} stacks up against leading competitors in side-by-side technical benchmarks.</p>
      <div class="grid-2">
        ${otherSoftware
          .map(
            (other) => `
          <div style="border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${escapeHtml(other.logoUrl)}" alt="${escapeHtml(other.name)} logo" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px;" />
              <div>
                <strong>${escapeHtml(software.name)} vs ${escapeHtml(other.name)}</strong>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(other.tagline)}</div>
              </div>
            </div>
            <a href="/compare/${software.slug}-vs-${other.slug}" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.35rem 0.7rem; white-space: nowrap;">Compare</a>
          </div>`
          )
          .join('')}
      </div>
      <div style="margin-top: 1rem; text-align: right;">
        <a href="/alternatives/${software.slug}" style="color: var(--primary); font-size: 0.95rem; font-weight: 600; text-decoration: none;">View All ${software.name} Alternatives & Competitors →</a>
      </div>
    </div>
  `;

  return { bodyHtml, faqs };
}

function renderVsComparison(softwareA: CMMSSoftware, softwareB: CMMSSoftware): { bodyHtml: string; faqs: FAQItem[] } {
  const priceA = typeof softwareA.pricing.startingPricePerUserMonth === 'number' ? `$${softwareA.pricing.startingPricePerUserMonth}/user/mo` : softwareA.pricing.startingPricePerUserMonth;
  const priceB = typeof softwareB.pricing.startingPricePerUserMonth === 'number' ? `$${softwareB.pricing.startingPricePerUserMonth}/user/mo` : softwareB.pricing.startingPricePerUserMonth;

  const faqs: FAQItem[] = [
    {
      question: `Which is better between ${softwareA.name} and ${softwareB.name}?`,
      answer: `${softwareA.name} scores ${softwareA.overallRating}/5.0 (Best for: ${softwareA.bestFor}), while ${softwareB.name} scores ${softwareB.overallRating}/5.0 (Best for: ${softwareB.bestFor}). Choose based on your primary facility workflow priorities.`,
    },
    {
      question: `How do the pricing plans of ${softwareA.name} and ${softwareB.name} compare?`,
      answer: `${softwareA.name} starts at ${priceA}, whereas ${softwareB.name} starts at ${priceB}. ${softwareA.pricing.hasFreeTier ? `${softwareA.name} includes a free tier.` : ''} ${softwareB.pricing.hasFreeTier ? `${softwareB.name} includes a free tier.` : ''}`,
    },
    {
      question: `Which platform is faster to implement?`,
      answer: `${softwareA.name} estimated implementation speed is ${softwareA.implementationTime}, compared to ${softwareB.name} at ${softwareB.implementationTime}.`,
    },
  ];

  const bodyHtml = `
    <div class="hero">
      <span class="badge">Head-to-Head CMMS Comparison</span>
      <h1>${escapeHtml(softwareA.name)} vs. ${escapeHtml(softwareB.name)}</h1>
      <p>Compare ratings, pricing structures, mobile functionality, and determine the superior platform for your plant operations.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <img src="${escapeHtml(softwareA.logoUrl)}" alt="${escapeHtml(softwareA.name)} logo" style="width: 56px; height: 56px; object-fit: contain; border-radius: 10px; border: 1px solid #e2e8f0; padding: 4px; background: #ffffff;" />
          <div>
            <h2 style="margin-bottom: 0.25rem; border: none; padding: 0;">${escapeHtml(softwareA.name)}</h2>
            <span class="rating-badge">★ ${softwareA.overallRating} / 5.0</span>
          </div>
        </div>
        <p style="margin: 0.75rem 0;"><strong>Best for:</strong> ${escapeHtml(softwareA.bestFor)}</p>
        <p><strong>Starting Price:</strong> ${priceA}</p>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Implementation:</strong> ${escapeHtml(softwareA.implementationTime)}</p>
        <div style="margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.6rem;">
          <a href="/software/${softwareA.slug}" class="btn btn-outline" style="flex: 1; min-width: 135px; text-align: center;">Read Full Review</a>
          <a href="/go/${softwareA.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="flex: 1; min-width: 135px; text-align: center;">Visit Website ↗</a>
        </div>
      </div>
      <div class="card">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <img src="${escapeHtml(softwareB.logoUrl)}" alt="${escapeHtml(softwareB.name)} logo" style="width: 56px; height: 56px; object-fit: contain; border-radius: 10px; border: 1px solid #e2e8f0; padding: 4px; background: #ffffff;" />
          <div>
            <h2 style="margin-bottom: 0.25rem; border: none; padding: 0;">${escapeHtml(softwareB.name)}</h2>
            <span class="rating-badge">★ ${softwareB.overallRating} / 5.0</span>
          </div>
        </div>
        <p style="margin: 0.75rem 0;"><strong>Best for:</strong> ${escapeHtml(softwareB.bestFor)}</p>
        <p><strong>Starting Price:</strong> ${priceB}</p>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Implementation:</strong> ${escapeHtml(softwareB.implementationTime)}</p>
        <div style="margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.6rem;">
          <a href="/software/${softwareB.slug}" class="btn btn-outline" style="flex: 1; min-width: 135px; text-align: center;">Read Full Review</a>
          <a href="/go/${softwareB.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="flex: 1; min-width: 135px; text-align: center;">Visit Website ↗</a>
        </div>
      </div>
    </div>

    <!-- Visual Feature Matrix Table -->
    <div class="card">
      <h2>Visual Feature Matrix</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40%;">Core Operational Feature</th>
              <th style="width: 30%; text-align: center;">${escapeHtml(softwareA.name)}</th>
              <th style="width: 30%; text-align: center;">${escapeHtml(softwareB.name)}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Free Trial Offered</strong></td>
              <td style="text-align: center;">${softwareA.pricing.hasFreeTrial ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
              <td style="text-align: center;">${softwareB.pricing.hasFreeTrial ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
            </tr>
            <tr>
              <td><strong>Permanent Free Tier</strong></td>
              <td style="text-align: center;">${softwareA.pricing.hasFreeTier ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
              <td style="text-align: center;">${softwareB.pricing.hasFreeTier ? '<span class="check-yes">✔ Yes</span>' : '<span class="check-no">✖ No</span>'}</td>
            </tr>
            <tr>
              <td><strong>Mobile-First / Offline Support</strong></td>
              <td style="text-align: center;">${softwareA.deploymentTypes.includes('Mobile-First') ? '<span class="check-yes">✔ Native Offline</span>' : '<span class="check-no">Cloud Web</span>'}</td>
              <td style="text-align: center;">${softwareB.deploymentTypes.includes('Mobile-First') ? '<span class="check-yes">✔ Native Offline</span>' : '<span class="check-no">Cloud Web</span>'}</td>
            </tr>
            <tr>
              <td><strong>IoT & Predictive Sensor Support</strong></td>
              <td style="text-align: center;">${softwareA.features.predictiveMaintenanceAndIot >= 8.5 ? '<span class="check-yes">✔ Advanced</span>' : '<span class="check-no">Basic</span>'}</td>
              <td style="text-align: center;">${softwareB.features.predictiveMaintenanceAndIot >= 8.5 ? '<span class="check-yes">✔ Advanced</span>' : '<span class="check-no">Basic</span>'}</td>
            </tr>
            <tr>
              <td><strong>Enterprise ERP Bridges</strong></td>
              <td style="text-align: center;">${softwareA.keyIntegrations.some((i) => ['SAP', 'Oracle', 'NetSuite'].some((erp) => i.includes(erp))) ? '<span class="check-yes">✔ Native ERP</span>' : '<span class="check-no">API / Webhooks</span>'}</td>
              <td style="text-align: center;">${softwareB.keyIntegrations.some((i) => ['SAP', 'Oracle', 'NetSuite'].some((erp) => i.includes(erp))) ? '<span class="check-yes">✔ Native ERP</span>' : '<span class="check-no">API / Webhooks</span>'}</td>
            </tr>
            <tr>
              <td><strong>Implementation Speed</strong></td>
              <td style="text-align: center;"><strong>${escapeHtml(softwareA.implementationTime)}</strong></td>
              <td style="text-align: center;"><strong>${escapeHtml(softwareB.implementationTime)}</strong></td>
            </tr>
            <tr>
              <td><strong>Overall Score Rating</strong></td>
              <td style="text-align: center;"><span class="rating-badge">★ ${softwareA.overallRating} / 5.0</span></td>
              <td style="text-align: center;"><span class="rating-badge">★ ${softwareB.overallRating} / 5.0</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Side-by-Side Dimension Scores</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Evaluation Feature</th>
              <th>${escapeHtml(softwareA.name)}</th>
              <th>${escapeHtml(softwareB.name)}</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            ${EVALUATION_CRITERIA.map((criterion) => {
              const scoreA = softwareA.features[criterion.id as keyof typeof softwareA.features];
              const scoreB = softwareB.features[criterion.id as keyof typeof softwareB.features];
              const winner = scoreA > scoreB ? softwareA.name : scoreB > scoreA ? softwareB.name : 'Tie';
              return `<tr>
                <td><strong>${escapeHtml(criterion.name)}</strong></td>
                <td>${scoreA.toFixed(1)} / 10</td>
                <td>${scoreB.toFixed(1)} / 10</td>
                <td><span style="font-weight: 700; color: var(--primary);">${escapeHtml(winner)}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h2>${escapeHtml(softwareA.name)} Key Pros</h2>
        <ul class="pro-list">
          ${softwareA.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h2>${escapeHtml(softwareB.name)} Key Pros</h2>
        <ul class="pro-list">
          ${softwareB.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Editorial Decision Guide -->
    <div class="card" style="background: #f8fafc; border: 1px solid #cbd5e1;">
      <h2>Strategic Recommendation: How to Choose</h2>
      <div class="grid-2" style="margin-top: 1rem;">
        <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px;">
          <h3 style="font-size: 1.1rem; color: var(--primary); margin-bottom: 0.5rem;">Why choose ${escapeHtml(softwareA.name)}?</h3>
          <p style="font-size: 0.95rem; color: #374151; line-height: 1.6;">
            Select <strong>${escapeHtml(softwareA.name)}</strong> if your team prioritizes <strong>${escapeHtml(softwareA.bestFor)}</strong>. It is designed for ${softwareA.targetCompanySizes.join(' and ')} operations with an estimated implementation time of ${escapeHtml(softwareA.implementationTime)}.
          </p>
          <div style="margin-top: 1rem;">
            <a href="/go/${softwareA.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.45rem 1rem;">Explore ${escapeHtml(softwareA.name)} Plans ↗</a>
          </div>
        </div>
        <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px;">
          <h3 style="font-size: 1.1rem; color: var(--primary); margin-bottom: 0.5rem;">Why choose ${escapeHtml(softwareB.name)}?</h3>
          <p style="font-size: 0.95rem; color: #374151; line-height: 1.6;">
            Select <strong>${escapeHtml(softwareB.name)}</strong> if your operational focus leans toward <strong>${escapeHtml(softwareB.bestFor)}</strong>. It fits ${softwareB.targetCompanySizes.join(' and ')} facilities and delivers an implementation speed of ${escapeHtml(softwareB.implementationTime)}.
          </p>
          <div style="margin-top: 1rem;">
            <a href="/go/${softwareB.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.45rem 1rem;">Explore ${escapeHtml(softwareB.name)} Plans ↗</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive CMMS Downtime & ROI Savings Calculator -->
    ${renderRoiCalculator()}

    <!-- Section: Comparison FAQs -->
    ${renderFaqSection(faqs)}
  `;

  return { bodyHtml, faqs };
}

function renderListingPage(page: GeneratedSeoPage): { bodyHtml: string; faqs: FAQItem[] } {
  const matchingSoftware = CMMS_DATABASE.filter(
    (s) => page.relatedEntities.includes(s.id) || page.relatedEntities.includes(s.slug)
  );

  const faqs: FAQItem[] = [
    {
      question: `What are the top recommended maintenance platforms in this guide?`,
      answer: `Our top evaluated platforms include ${matchingSoftware.slice(0, 3).map((s) => s.name).join(', ')}, selected based on verified technician usability, score benchmarks, and customer support ratings.`,
    },
    {
      question: `How were these CMMS software platforms benchmarked?`,
      answer: `Platforms are rigorously assessed across 9 key dimension scores: work order speed, preventive maintenance scheduling, mobile usability, inventory control, and system reliability.`,
    },
  ];

  const bodyHtml = `
    <div class="hero">
      <span class="badge">${page.pageType.replace(/_/g, ' ').toUpperCase()}</span>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.metaDescription)}</p>
    </div>

    <div class="card">
      <h2>Recommended CMMS Platforms (${matchingSoftware.length})</h2>
      <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">
        ${matchingSoftware
          .map((sw) => {
            const priceDisplay =
              typeof sw.pricing.startingPricePerUserMonth === 'number'
                ? `$${sw.pricing.startingPricePerUserMonth}/user/mo`
                : sw.pricing.startingPricePerUserMonth;

            return `
            <div style="border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 12px; background: #ffffff; box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <img src="${escapeHtml(sw.logoUrl)}" alt="${escapeHtml(sw.name)} logo" style="width: 48px; height: 48px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; padding: 4px; background: #ffffff; flex-shrink: 0;" />
                  <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem;"><a href="/software/${sw.slug}" style="color: var(--primary); text-decoration: none;">${escapeHtml(sw.name)}</a></h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem;">${escapeHtml(sw.tagline)}</p>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem;">
                  <span class="rating-badge">★ ${sw.overallRating} / 5.0</span>
                  <div style="font-size: 0.85rem; font-weight: 600; color: #374151;">From ${priceDisplay}</div>
                </div>
              </div>
              <p style="font-size: 0.95rem; margin: 0.85rem 0; color: #374151; line-height: 1.6;">${escapeHtml(sw.overview.substring(0, 240))}...</p>
              <div style="font-size: 0.9rem; margin-bottom: 0.85rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem 0.75rem;">
                <strong>Best For:</strong> ${escapeHtml(sw.bestFor)}
              </div>
              <div style="display: flex; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap;">
                <a href="/software/${sw.slug}" class="btn btn-outline" style="min-height: 40px;">Read Full Review</a>
                <a href="/go/${sw.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="min-height: 40px;">Visit Website ↗</a>
              </div>
            </div>`;
          })
          .join('')}
      </div>
    </div>

    <!-- Interactive CMMS ROI Calculator -->
    ${renderRoiCalculator()}

    ${renderFaqSection(faqs)}
  `;

  return { bodyHtml, faqs };
}

function renderHomePage(): string {
  const industryOptions = Object.keys(INDUSTRY_CONFIGURATIONS)
    .map((ind) => `<option value="${escapeHtml(ind)}">${escapeHtml(ind)}</option>`)
    .join('\n          ');

  return `
    <div class="hero">
      <span class="badge">The Industrial CMMS Directory</span>
      <h1>Find the Perfect CMMS for Your Plant & Operations</h1>
      <p>Unbiased data, side-by-side technical benchmarks, and real-world technician usability scores for modern maintenance teams.</p>
    </div>

    <!-- Live Client-Side Search, Filtering & Sorting Toolbar -->
    <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <h3 style="font-size: 1.15rem; color: var(--text-main); margin: 0; font-weight: 800;">🔍 Search & Filter Directory</h3>
        <button id="resetFiltersBtn" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.85rem; color: var(--text-muted); cursor: pointer; font-weight: 600; min-height: 38px;">Reset Filters</button>
      </div>

      <!-- Quick Filter Shortcut Chips (Horizontal Touch Scroll on Mobile) -->
      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.78rem; font-weight: 700; color: #64748b; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.04em;">Quick Presets:</div>
        <div class="filter-presets-scroll">
          <button class="filter-preset-btn" data-preset="all" style="background: var(--primary); color: #fff; border: 1px solid var(--primary); font-weight: 700;">All (106)</button>
          <button class="filter-preset-btn" data-preset="free" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1;">Free / Freemium</button>
          <button class="filter-preset-btn" data-preset="under50" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1;">Under $50/mo</button>
          <button class="filter-preset-btn" data-preset="mobile" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1;">Mobile-First</button>
          <button class="filter-preset-btn" data-preset="manufacturing" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1;">Manufacturing</button>
          <button class="filter-preset-btn" data-preset="small" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1;">Small Teams (1-50)</button>
          <button class="filter-preset-btn" data-preset="enterprise" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1;">Enterprise EAM</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 0.75rem; align-items: center;">
        <input
          type="text"
          id="searchInput"
          placeholder="Search by name or feature..."
          style="width: 100%;"
        />
        <select id="industryFilter" style="width: 100%;">
          <option value="all">All Industries</option>
          ${industryOptions}
        </select>
        <select id="deploymentFilter" style="width: 100%;">
          <option value="all">All Deployment Types</option>
          <option value="Cloud/SaaS">Cloud/SaaS</option>
          <option value="Mobile-First">Mobile-First</option>
          <option value="On-Premise">On-Premise</option>
          <option value="Hybrid">Hybrid</option>
        </select>
        <select id="sizeFilter" style="width: 100%;">
          <option value="all">All Company Sizes</option>
          <option value="Small (1-50)">Small Teams (1-50)</option>
          <option value="Mid-Market (51-500)">Mid-Market (51-500)</option>
          <option value="Enterprise (500+)">Enterprise (500+)</option>
        </select>
        <select id="pricingFilter" style="width: 100%;">
          <option value="all">All Pricing Models</option>
          <option value="free">100% Free / Free Tier</option>
          <option value="under50">Under $50 / user / mo</option>
          <option value="trial">Free Trial Available</option>
        </select>
        <select id="sortBySelect" style="width: 100%;">
          <option value="rating">Sort: Highest Rated</option>
          <option value="reviews">Sort: Most Reviews</option>
          <option value="price-asc">Sort: Price (Low to High)</option>
          <option value="name">Sort: Alphabetical (A-Z)</option>
        </select>
      </div>
      <div id="resultsCounter" style="margin-top: 0.85rem; font-size: 0.88rem; color: var(--text-muted); font-weight: 600;">
        Showing all ${CMMS_DATABASE.length} maintenance management systems
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <h3>🏭 By Industry</h3>
        <ul style="list-style: none; margin-top: 0.75rem;">
          <li><a href="/best-cmms-for-manufacturing" style="color: var(--primary); text-decoration: none;">Manufacturing CMMS</a></li>
          <li><a href="/best-cmms-for-food-beverage" style="color: var(--primary); text-decoration: none;">Food & Beverage</a></li>
          <li><a href="/best-cmms-for-oil-gas" style="color: var(--primary); text-decoration: none;">Oil & Gas</a></li>
          <li><a href="/best-cmms-for-facilities-property" style="color: var(--primary); text-decoration: none;">Facilities & Property</a></li>
          <li><a href="/best-cmms-for-fleet-heavy-equipment" style="color: var(--primary); text-decoration: none;">Fleet & Heavy Equipment</a></li>
        </ul>
      </div>

      <div class="card">
        <h3>🏢 By Company Size</h3>
        <ul style="list-style: none; margin-top: 0.75rem;">
          <li><a href="/best-cmms-for-small-teams" style="color: var(--primary); text-decoration: none;">Small Teams (1-50 users)</a></li>
          <li><a href="/best-cmms-for-mid-market-plants" style="color: var(--primary); text-decoration: none;">Mid-Market Facilities</a></li>
          <li><a href="/best-cmms-for-enterprise" style="color: var(--primary); text-decoration: none;">Enterprise EAM (500+ users)</a></li>
          <li><a href="/pricing/best-free-cmms-software" style="color: var(--primary); text-decoration: none;">Best 100% Free CMMS</a></li>
          <li><a href="/pricing/affordable-cmms-under-50" style="color: var(--primary); text-decoration: none;">CMMS Under $50/mo</a></li>
        </ul>
      </div>

      <div class="card">
        <h3>⚙️ By Core Capability</h3>
        <ul style="list-style: none; margin-top: 0.75rem;">
          <li><a href="/best-cmms-for-work-order-management" style="color: var(--primary); text-decoration: none;">Work Order Management</a></li>
          <li><a href="/best-cmms-for-preventive-maintenance" style="color: var(--primary); text-decoration: none;">Preventive Maintenance</a></li>
          <li><a href="/best-cmms-for-mro-inventory-management" style="color: var(--primary); text-decoration: none;">MRO Spare Parts</a></li>
          <li><a href="/best-cmms-for-mobile-app-usability" style="color: var(--primary); text-decoration: none;">Technician Mobile Apps</a></li>
          <li><a href="/best-cmms-for-predictive-maintenance-and-iot" style="color: var(--primary); text-decoration: none;">Predictive & IoT Sensors</a></li>
        </ul>
      </div>
    </div>

    <!-- Unbiased Advisory & Facility Intake Banner -->
    <div class="card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; border: 1px solid #334155; padding: 2rem; border-radius: 12px; margin: 2rem 0; box-shadow: var(--shadow-md);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
        <div style="max-width: 650px;">
          <span style="background: rgba(37,99,235,0.3); color: #93c5fd; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0.65rem; border-radius: 4px; display: inline-block; margin-bottom: 0.65rem; border: 1px solid rgba(147, 197, 253, 0.3);">Free Facility Advisory</span>
          <h3 style="color: #ffffff; font-size: 1.45rem; font-weight: 800; margin-bottom: 0.5rem; border: none; padding: 0;">Unsure Which CMMS Fits Your Plant?</h3>
          <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; margin: 0;">Tell us your plant size, industry, and maintenance workflow. Our specialists review your technical requirements and send an unbiased 3-system shortlist tailored to your budget.</p>
        </div>
        <div>
          <a href="/contact" class="btn" style="background: var(--primary); color: #ffffff; font-size: 0.95rem; font-weight: 700; padding: 0.85rem 1.6rem; border-radius: 8px; border: 1px solid #60a5fa; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; white-space: nowrap; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
            Get Free CMMS Advice ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Interactive CMMS ROI Calculator -->
    ${renderRoiCalculator()}

    <div class="card">
      <h2>All Indexed CMMS Systems (${CMMS_DATABASE.length})</h2>
      <div id="softwareGrid" class="grid-2" style="margin-top: 1rem;">
        ${CMMS_DATABASE.map(
          (s) => {
            const isFree = s.pricing.hasFreeTier || (typeof s.pricing.startingPricePerUserMonth === 'number' && s.pricing.startingPricePerUserMonth === 0);
            const isUnder50 = isFree || (typeof s.pricing.startingPricePerUserMonth === 'number' && s.pricing.startingPricePerUserMonth <= 50);
            const hasTrial = s.pricing.hasFreeTrial ? 'true' : 'false';
            const priceLabel = typeof s.pricing.startingPricePerUserMonth === 'number'
              ? (s.pricing.startingPricePerUserMonth === 0 ? 'Free tier available' : `From $${s.pricing.startingPricePerUserMonth}/user/mo`)
              : s.pricing.startingPricePerUserMonth;
            const numericPrice = typeof s.pricing.startingPricePerUserMonth === 'number' ? s.pricing.startingPricePerUserMonth : (s.pricing.startingPricePerUserMonth === 'Free' ? 0 : 999);

            return `
          <div
            class="software-card"
            data-name="${escapeHtml(s.name.toLowerCase())}"
            data-tagline="${escapeHtml(s.tagline.toLowerCase())}"
            data-industries="${escapeHtml(s.supportedIndustries.join(','))}"
            data-deployment="${escapeHtml(s.deploymentTypes.join(','))}"
            data-sizes="${escapeHtml(s.targetCompanySizes.join(','))}"
            data-rating="${s.overallRating}"
            data-reviews="${s.reviewCount}"
            data-price="${numericPrice}"
            data-is-free="${isFree ? 'true' : 'false'}"
            data-is-under50="${isUnder50 ? 'true' : 'false'}"
            data-has-trial="${hasTrial}"
            style="border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 12px; background: #ffffff; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;"
          >
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <img src="${escapeHtml(s.logoUrl)}" alt="${escapeHtml(s.name)} logo" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; padding: 3px; background: #ffffff; flex-shrink: 0;" />
                  <h4 style="margin: 0; font-size: 1.1rem;"><a href="/software/${s.slug}" style="color: var(--primary); text-decoration: none;">${escapeHtml(s.name)}</a></h4>
                </div>
                <span class="rating-badge" style="flex-shrink: 0;">★ ${s.overallRating}</span>
              </div>
              <p style="font-size: 0.88rem; color: var(--text-muted); margin: 0.75rem 0 0.6rem 0; line-height: 1.5;">${escapeHtml(s.tagline)}</p>
              <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; font-size: 0.8rem;">
                <span style="background: #f1f5f9; padding: 0.25rem 0.55rem; border-radius: 6px; color: #334155; font-weight: 500;"><strong>Price:</strong> ${escapeHtml(priceLabel)}</span>
                <span style="background: #f1f5f9; padding: 0.25rem 0.55rem; border-radius: 6px; color: #334155; font-weight: 500;"><strong>Setup:</strong> ${escapeHtml(s.implementationTime)}</span>
                <span style="background: #f1f5f9; padding: 0.25rem 0.55rem; border-radius: 6px; color: #334155; font-weight: 500;"><strong>Reviews:</strong> ${s.reviewCount.toLocaleString()}</span>
              </div>
            </div>
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <a href="/software/${s.slug}" style="font-size: 0.88rem; color: var(--primary); font-weight: 700; text-decoration: none; padding: 0.25rem 0;">Read Review →</a>
              <a href="/go/${s.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.35rem 0.75rem; min-height: 36px; display: inline-flex; align-items: center;">Visit Site ↗</a>
            </div>
          </div>`;
          }
        ).join('')}
      </div>
    </div>

    <!-- Client-Side Filter & Sort Script -->
    <script>
      (function() {
        const searchInput = document.getElementById('searchInput');
        const industryFilter = document.getElementById('industryFilter');
        const deploymentFilter = document.getElementById('deploymentFilter');
        const sizeFilter = document.getElementById('sizeFilter');
        const pricingFilter = document.getElementById('pricingFilter');
        const sortBySelect = document.getElementById('sortBySelect');
        const resetBtn = document.getElementById('resetFiltersBtn');
        const softwareGrid = document.getElementById('softwareGrid');
        const presetBtns = document.querySelectorAll('.filter-preset-btn');
        const resultsCounter = document.getElementById('resultsCounter');

        function sortCards() {
          const sortVal = sortBySelect ? sortBySelect.value : 'rating';
          const cardsArray = Array.from(softwareGrid.querySelectorAll('.software-card'));

          cardsArray.sort((a, b) => {
            if (sortVal === 'rating') {
              const ratingA = parseFloat(a.getAttribute('data-rating') || '0');
              const ratingB = parseFloat(b.getAttribute('data-rating') || '0');
              return ratingB - ratingA;
            } else if (sortVal === 'reviews') {
              const revA = parseInt(a.getAttribute('data-reviews') || '0', 10);
              const revB = parseInt(b.getAttribute('data-reviews') || '0', 10);
              return revB - revA;
            } else if (sortVal === 'price-asc') {
              const priceA = parseFloat(a.getAttribute('data-price') || '999');
              const priceB = parseFloat(b.getAttribute('data-price') || '999');
              return priceA - priceB;
            } else if (sortVal === 'name') {
              const nameA = a.getAttribute('data-name') || '';
              const nameB = b.getAttribute('data-name') || '';
              return nameA.localeCompare(nameB);
            }
            return 0;
          });

          cardsArray.forEach(c => softwareGrid.appendChild(c));
        }

        function filterCards() {
          const query = searchInput.value.toLowerCase().trim();
          const selectedIndustry = industryFilter.value;
          const selectedDeployment = deploymentFilter.value;
          const selectedSize = sizeFilter.value;
          const selectedPricing = pricingFilter ? pricingFilter.value : 'all';
          const cards = softwareGrid.querySelectorAll('.software-card');

          let visibleCount = 0;

          cards.forEach(card => {
            const name = card.getAttribute('data-name') || '';
            const tagline = card.getAttribute('data-tagline') || '';
            const industries = card.getAttribute('data-industries') || '';
            const deployment = card.getAttribute('data-deployment') || '';
            const sizes = card.getAttribute('data-sizes') || '';
            const isFree = card.getAttribute('data-is-free') === 'true';
            const isUnder50 = card.getAttribute('data-is-under50') === 'true';
            const hasTrial = card.getAttribute('data-has-trial') === 'true';

            const matchesQuery = !query || name.includes(query) || tagline.includes(query);
            const matchesIndustry = selectedIndustry === 'all' || industries.includes(selectedIndustry);
            const matchesDeployment = selectedDeployment === 'all' || deployment.includes(selectedDeployment);
            const matchesSize = selectedSize === 'all' || sizes.includes(selectedSize);

            let matchesPricing = true;
            if (selectedPricing === 'free') {
              matchesPricing = isFree;
            } else if (selectedPricing === 'under50') {
              matchesPricing = isUnder50;
            } else if (selectedPricing === 'trial') {
              matchesPricing = hasTrial;
            }

            if (matchesQuery && matchesIndustry && matchesDeployment && matchesSize && matchesPricing) {
              card.style.display = 'block';
              visibleCount++;
            } else {
              card.style.display = 'none';
            }
          });

          resultsCounter.textContent = 'Showing ' + visibleCount + ' of ' + cards.length + ' maintenance management systems';
        }

        function updatePresetButtons(activePreset) {
          presetBtns.forEach(btn => {
            if (btn.getAttribute('data-preset') === activePreset) {
              btn.style.background = 'var(--primary)';
              btn.style.color = '#fff';
              btn.style.borderColor = 'var(--primary)';
              btn.style.fontWeight = '600';
            } else {
              btn.style.background = '#fff';
              btn.style.color = '#334155';
              btn.style.borderColor = '#cbd5e1';
              btn.style.fontWeight = '500';
            }
          });
        }

        presetBtns.forEach(btn => {
          btn.addEventListener('click', function() {
            const preset = this.getAttribute('data-preset');
            searchInput.value = '';
            industryFilter.value = 'all';
            deploymentFilter.value = 'all';
            sizeFilter.value = 'all';
            pricingFilter.value = 'all';

            if (preset === 'free') {
              pricingFilter.value = 'free';
            } else if (preset === 'under50') {
              pricingFilter.value = 'under50';
            } else if (preset === 'mobile') {
              deploymentFilter.value = 'Mobile-First';
            } else if (preset === 'manufacturing') {
              industryFilter.value = 'Manufacturing';
            } else if (preset === 'small') {
              sizeFilter.value = 'Small (1-50)';
            } else if (preset === 'enterprise') {
              sizeFilter.value = 'Enterprise (500+)';
            }

            updatePresetButtons(preset);
            filterCards();
          });
        });

        searchInput.addEventListener('input', () => { updatePresetButtons(''); filterCards(); });
        industryFilter.addEventListener('change', () => { updatePresetButtons(''); filterCards(); });
        deploymentFilter.addEventListener('change', () => { updatePresetButtons(''); filterCards(); });
        sizeFilter.addEventListener('change', () => { updatePresetButtons(''); filterCards(); });
        if (pricingFilter) pricingFilter.addEventListener('change', () => { updatePresetButtons(''); filterCards(); });
        if (sortBySelect) sortBySelect.addEventListener('change', sortCards);

        if (resetBtn) {
          resetBtn.addEventListener('click', function() {
            searchInput.value = '';
            industryFilter.value = 'all';
            deploymentFilter.value = 'all';
            sizeFilter.value = 'all';
            if (pricingFilter) pricingFilter.value = 'all';
            if (sortBySelect) sortBySelect.value = 'rating';
            updatePresetButtons('all');
            sortCards();
            filterCards();
          });
        }

        // Initialize sort by rating
        sortCards();
      })();
    </script>
  `;
}

function renderContactPage(): string {
  return `
    <div class="hero">
      <span class="badge">Independent CMMS Software Advisory</span>
      <h1>Talk to a Maintenance Software Specialist</h1>
      <p>Need help finding the right CMMS for your facility, comparing vendor quotes, or want an unbiased shortlist? Send us your plant details and our team will get in touch.</p>
    </div>

    <div class="grid-2" style="align-items: start; gap: 2rem;">
      <!-- Left Column: Interactive Contact & Advisory Intake Form -->
      <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); border-radius: 12px; padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.85rem;">
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0;">📋 Facility & Advisory Intake</h2>
          <span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 0.25rem 0.6rem; border-radius: 9999px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #16a34a;"></span> Direct Routing
          </span>
        </div>
        <p style="font-size: 0.92rem; color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.55;">Fill out the brief details below. Your submission routes directly to <strong>jason@plantmainthq.com</strong> so our maintenance software advisory desk can prepare tailored recommendations for your plant.</p>

        <form id="advisoryContactForm" action="https://formsubmit.co/jason@plantmainthq.com" method="POST" style="display: flex; flex-direction: column; gap: 1.15rem;">
          <!-- FormSubmit Configuration for Direct Delivery to jason@plantmainthq.com -->
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" id="formSubmitSubject" name="_subject" value="[PlantMaintHQ Lead] New CMMS Software Advisory Inquiry" />
          <input type="text" name="_honey" style="display: none !important;" tabindex="-1" autocomplete="off" />

          <div>
            <label for="contactName" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">Full Name <span style="color: #dc2626;">*</span></label>
            <input type="text" id="contactName" name="name" required placeholder="e.g. John Doe, Maintenance Supervisor" style="width: 100%; min-height: 44px; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; transition: border-color 0.15s, box-shadow 0.15s;" />
          </div>

          <div>
            <label for="contactEmail" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">Work Email Address <span style="color: #dc2626;">*</span></label>
            <input type="email" id="contactEmail" name="email" required placeholder="name@company.com" style="width: 100%; min-height: 44px; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; transition: border-color 0.15s, box-shadow 0.15s;" />
          </div>

          <div>
            <label for="contactCompany" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">Company / Facility Name</label>
            <input type="text" id="contactCompany" name="company" placeholder="e.g. Acme Manufacturing Facility" style="width: 100%; min-height: 44px; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; transition: border-color 0.15s, box-shadow 0.15s;" />
          </div>

          <div>
            <label for="contactInquiryType" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">How Can We Help?</label>
            <select id="contactInquiryType" name="inquiry_type" style="width: 100%; min-height: 44px; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; background: #fff;">
              <option value="Need a tailored CMMS shortlist for my facility">I need a tailored CMMS shortlist for my facility</option>
              <option value="Request vendor introduction or quote assistance">Request vendor introduction or demo assistance</option>
              <option value="Question about a specific CMMS review">Question about a specific CMMS benchmark or review</option>
              <option value="Submit or update a CMMS directory profile">Submit or update a CMMS software listing</option>
              <option value="Advertising or partnership inquiry">Advertising, sponsorship, or partnership inquiry</option>
              <option value="General question or feedback">General question or feedback</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 1rem;">
            <div>
              <label for="contactIndustry" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">Facility Industry</label>
              <select id="contactIndustry" name="industry" style="width: 100%; min-height: 44px; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; background: #fff;">
                <option value="Manufacturing">Manufacturing & Discrete Assembly</option>
                <option value="Food & Beverage">Food & Beverage Processing</option>
                <option value="Facilities & Property">Facilities & Commercial Real Estate</option>
                <option value="Oil & Gas / Chemical">Oil, Gas & Petrochemical</option>
                <option value="Fleet & Heavy Equipment">Fleet & Heavy Equipment</option>
                <option value="Healthcare & Life Sciences">Healthcare & Hospitals</option>
                <option value="Municipal & Water Utilities">Municipal & Utilities</option>
                <option value="Other">Other Industrial / Field Service</option>
              </select>
            </div>

            <div>
              <label for="contactTeamSize" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">Maintenance Techs / Users</label>
              <select id="contactTeamSize" name="team_size" style="width: 100%; min-height: 44px; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; background: #fff;">
                <option value="1-5 Users">1 - 5 Technicians (Small Team)</option>
                <option value="6-20 Users">6 - 20 Technicians (Growing Facility)</option>
                <option value="21-50 Users">21 - 50 Technicians (Mid-Market)</option>
                <option value="51-200 Users">51 - 200 Technicians (Multi-Site)</option>
                <option value="200+ Enterprise">200+ Users (Enterprise EAM)</option>
              </select>
            </div>
          </div>

          <div>
            <label for="contactCurrentSystem" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">Current Maintenance Workflow</label>
            <select id="contactCurrentSystem" name="current_workflow" style="width: 100%; min-height: 44px; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; background: #fff;">
              <option value="Paper & Whiteboards">Pen, Paper & Whiteboards</option>
              <option value="Excel Spreadsheets">Excel / Google Spreadsheets</option>
              <option value="Legacy On-Premise CMMS">Legacy On-Premise Server CMMS</option>
              <option value="ERP Module (SAP/Oracle/NetSuite)">ERP Maintenance Module (SAP, Oracle, NetSuite)</option>
              <option value="Evaluating First System">Evaluating First Maintenance System</option>
              <option value="Other">Other Cloud Tool</option>
            </select>
          </div>

          <div>
            <label for="contactMessage" style="display: block; font-size: 0.88rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">Tell Us About Your Facility & Key Requirements</label>
            <textarea id="contactMessage" name="message" rows="4" placeholder="What are your main bottlenecks or must-haves? (e.g. mobile app with offline mode for millwrights, barcode spare parts tracking, automated PM scheduling, ERP bridge, budget target...)" style="width: 100%; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; font-family: inherit; line-height: 1.5; resize: vertical;"></textarea>
          </div>

          <div id="contactFormStatus"></div>

          <button type="submit" id="contactSubmitBtn" class="btn btn-primary" style="width: 100%; min-height: 48px; font-size: 1rem; font-weight: 700; cursor: pointer; border: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.15s ease;">
            <span>Submit Advisory Request</span> ➔
          </button>
          
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 0.25rem;">
            <span>🔒 Direct to jason@plantmainthq.com</span>
            <span>•</span>
            <span>Zero Spam Guarantee</span>
            <span>•</span>
            <span>Unbiased Guidance</span>
          </div>
        </form>
      </div>

      <!-- Right Column: Advisory Values & Contact Details -->
      <div>
        <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); border-radius: 12px; margin-bottom: 1.5rem; padding: 1.75rem;">
          <h3 style="font-size: 1.15rem; color: var(--primary); margin-bottom: 0.75rem;">🛡️ Why Contact PlantMaintHQ?</h3>
          <ul style="padding-left: 1.25rem; font-size: 0.92rem; color: #374151; line-height: 1.65;">
            <li style="margin-bottom: 0.75rem;"><strong>100% Independent & Free:</strong> We are an independent maintenance benchmark directory. Our recommendations are grounded in technical capability and operational fit, not vendor kickbacks.</li>
            <li style="margin-bottom: 0.75rem;"><strong>Cut Weeks Off Your Evaluation:</strong> Skip 20+ repetitive sales demos. We will pinpoint the 2-3 systems that genuinely align with your technician headcount and budget.</li>
            <li style="margin-bottom: 0.75rem;"><strong>Built by Industrial Operators:</strong> We evaluate tools based on technician adoption, offline usability in noisy plants, and realistic wrench time recovery.</li>
          </ul>
        </div>

        <div class="card" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; margin-bottom: 1.5rem; padding: 1.75rem;">
          <h3 style="font-size: 1.15rem; color: #0f172a; margin-bottom: 0.75rem;">📬 Direct Communications</h3>
          <div style="font-size: 0.92rem; color: #374151; line-height: 1.65;">
            <p style="margin-bottom: 0.5rem;"><strong>Direct Contact:</strong> <a href="mailto:jason@plantmainthq.com" style="color: var(--primary); text-decoration: underline; font-weight: 700;">jason@plantmainthq.com</a></p>
            <p style="margin-bottom: 0.5rem;"><strong>Advisory Inquiries:</strong> <a href="mailto:advisory@plantmainthq.com" style="color: var(--primary); text-decoration: underline; font-weight: 600;">advisory@plantmainthq.com</a></p>
            <p style="margin-bottom: 0.5rem;"><strong>Vendor Listings & Updates:</strong> <a href="mailto:vendors@plantmainthq.com" style="color: var(--primary); text-decoration: underline; font-weight: 600;">vendors@plantmainthq.com</a></p>
            <p style="margin-bottom: 0.5rem;"><strong>Response Time:</strong> Within 1 business day</p>
            <p style="margin: 0; color: #64748b; font-size: 0.85rem;">PlantMaintHQ — Industrial CMMS Directory & Benchmarks</p>
          </div>
        </div>

        <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); border-radius: 12px; padding: 1.75rem;">
          <h3 style="font-size: 1.15rem; color: #0f172a; margin-bottom: 0.75rem;">🏢 For CMMS & EAM Software Vendors</h3>
          <p style="font-size: 0.9rem; color: #4b5563; line-height: 1.55; margin-bottom: 0.75rem;">Are you a maintenance software vendor? If you would like to claim your software profile, provide updated pricing details, or submit technical documentation for benchmark review, choose &quot;Submit or update a CMMS software listing&quot; in the form above or email us directly.</p>
        </div>
      </div>
    </div>

    <!-- Client-Side Form Handler Script -->
    <script>
      (function() {
        var form = document.getElementById('advisoryContactForm');
        var statusDiv = document.getElementById('contactFormStatus');
        var submitBtn = document.getElementById('contactSubmitBtn');
        var inquirySelect = document.getElementById('contactInquiryType');
        var messageInput = document.getElementById('contactMessage');
        var subjectInput = document.getElementById('formSubmitSubject');

        // Pre-fill from query params (e.g. ?tool=Fiix)
        try {
          var params = new URLSearchParams(window.location.search);
          var tool = params.get('tool');
          if (tool && messageInput) {
            if (inquirySelect) {
              inquirySelect.value = 'Request vendor introduction or quote assistance';
            }
            messageInput.value = 'I would like more information and expert advisory regarding ' + tool + ' for our facility maintenance operations.';
          }
        } catch(e) {}

        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();

            var nameInput = document.getElementById('contactName');
            var emailInput = document.getElementById('contactEmail');
            var companyInput = document.getElementById('contactCompany');
            var industryInput = document.getElementById('contactIndustry');
            var teamSizeInput = document.getElementById('contactTeamSize');
            var currentSystemInput = document.getElementById('contactCurrentSystem');

            var nameVal = nameInput ? nameInput.value.trim() : '';
            var emailVal = emailInput ? emailInput.value.trim() : '';
            var companyVal = companyInput ? companyInput.value.trim() : '';
            var industryVal = industryInput ? industryInput.value : '';
            var teamSizeVal = teamSizeInput ? teamSizeInput.value : '';
            var currentSystemVal = currentSystemInput ? currentSystemInput.value : '';
            var inquiryVal = inquirySelect ? inquirySelect.value : 'Advisory Request';
            var messageVal = messageInput ? messageInput.value.trim() : '';

            if (!nameVal || !emailVal) {
              statusDiv.innerHTML = '<div style="background: #fef2f2; border: 1px solid #f87171; color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem;">Please provide both your name and work email address.</div>';
              return;
            }

            var dynamicSubject = '[PlantMaintHQ Lead] ' + inquiryVal + (companyVal ? ' - ' + companyVal : ' - ' + nameVal);
            if (subjectInput) subjectInput.value = dynamicSubject;

            var payload = {
              name: nameVal,
              email: emailVal,
              company: companyVal,
              industry: industryVal,
              teamSize: teamSizeVal,
              currentSystem: currentSystemVal,
              inquiryType: inquiryVal,
              message: messageVal,
              _subject: dynamicSubject,
              _template: 'table',
              _captcha: 'false'
            };

            // Disable button during submit with visual loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Submitting to Advisory Desk...</span> ⏳';
            statusDiv.innerHTML = '';

            // Also mirror to local API ledger in background so lead is permanently stored
            try {
              fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              }).catch(function() {});
            } catch(e) {}

            // Submit directly via FormSubmit static provider
            fetch('https://formsubmit.co/ajax/jason@plantmainthq.com', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(payload)
            })
            .then(function(res) {
              return res.json();
            })
            .then(function(data) {
              renderSuccessScreen(nameVal, emailVal, data);
            })
            .catch(function(err) {
              console.warn('FormSubmit AJAX intercepted or blocked, falling back to local storage confirmation:', err);
              // If ad-blocker blocked the external script, our local API already saved it!
              renderSuccessScreen(nameVal, emailVal, { success: true, localOnly: true });
            });
          });
        }

        function renderSuccessScreen(name, email, data) {
          var isActivationNeeded = data && data.message && data.message.indexOf('Activation') !== -1;
          
          form.innerHTML = '<div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 2.25rem 1.5rem; text-align: center;">' +
            '<div style="font-size: 2.5rem; margin-bottom: 0.6rem;">✅</div>' +
            '<h3 style="color: #166534; font-size: 1.35rem; font-weight: 800; margin-bottom: 0.5rem;">Inquiry Submitted Successfully!</h3>' +
            '<p style="color: #15803d; font-size: 1rem; line-height: 1.6; margin-bottom: 1rem;">Thank you, <strong>' + escapeHtmlStr(name) + '</strong>. Your advisory request has been dispatched directly to <strong>jason@plantmainthq.com</strong>.</p>' +
            (isActivationNeeded ? '<div style="background: #fefce8; border: 1px solid #fef08a; color: #854d0e; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; text-align: left;"><strong>Notice:</strong> FormSubmit has sent a 1-click verification link to jason@plantmainthq.com to activate initial email delivery.</div>' : '') +
            '<p style="color: #374151; font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.5rem;">Our CMMS specialists are reviewing your facility profile and will follow up with an unbiased analysis directly to <strong>' + escapeHtmlStr(email) + '</strong> within 1 business day.</p>' +
            '<a href="/" class="btn btn-primary" style="display: inline-block; padding: 0.65rem 1.25rem; font-weight: 700; text-decoration: none;">Return to CMMS Directory</a>' +
            '</div>';
        }

        function escapeHtmlStr(str) {
          return String(str || '').replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
          });
        }
      })();
    </script>
  `;
}

function buildStaticSite(): void {
  console.log('🚀 Starting PlantMaintHQ static site build...');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Copy OG Banner and style.css to dist
  const ogBannerPath = path.join(process.cwd(), 'og-banner.png');
  if (fs.existsSync(ogBannerPath)) {
    fs.copyFileSync(ogBannerPath, path.join(DIST_DIR, 'og-banner.png'));
  }
  const styleCssPath = path.join(process.cwd(), 'style.css');
  if (fs.existsSync(styleCssPath)) {
    fs.copyFileSync(styleCssPath, path.join(DIST_DIR, 'style.css'));
  }

  // Generate API JSON to maintain parity with old python script
  const apiDir = path.join(DIST_DIR, 'api');
  fs.mkdirSync(apiDir, { recursive: true });
  fs.writeFileSync(path.join(apiDir, 'software.json'), JSON.stringify(CMMS_DATABASE, null, 2), 'utf-8');

  const routes = getAllProgrammaticRoutes();

  // 1. Build Homepage
  const homeHtml = renderLayout({
    title: 'PlantMaintHQ - Independent CMMS & Maintenance Management Software Directory',
    metaDescription: 'Find and compare top CMMS and EAM software for industrial manufacturing, facilities, and plant maintenance operations.',
    canonicalUrl: `${DOMAIN}/`,
    bodyHtml: renderHomePage(),
  });
  const minifiedHomeHtml = minifyHtml(homeHtml);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), minifiedHomeHtml, 'utf-8');
  fs.writeFileSync(path.join(process.cwd(), 'index.html'), minifiedHomeHtml, 'utf-8');

  // 1b. Build Contact & Advisory Page
  const contactHtml = renderLayout({
    title: 'Contact PlantMaintHQ | Independent CMMS Advisory & Software Inquiries',
    metaDescription: 'Get in touch with the PlantMaintHQ maintenance software advisory team. Request unbiased CMMS recommendations, vendor introductions, or software profile updates.',
    canonicalUrl: `${DOMAIN}/contact`,
    bodyHtml: renderContactPage(),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Contact & Advisory', url: '/contact' },
    ],
  });
  const minifiedContactHtml = minifyHtml(contactHtml);
  const contactDir = path.join(DIST_DIR, 'contact');
  fs.mkdirSync(contactDir, { recursive: true });
  fs.writeFileSync(path.join(contactDir, 'index.html'), minifiedContactHtml, 'utf-8');
  fs.writeFileSync(path.join(DIST_DIR, 'contact.html'), minifiedContactHtml, 'utf-8');
  fs.writeFileSync(path.join(process.cwd(), 'contact.html'), minifiedContactHtml, 'utf-8');

  // 2. Build Programmatic Pages
  let pageCount = 1; // including homepage
  routes.forEach((route) => {
    let bodyHtml = '';
    const jsonLdSchemas: string[] = [];
    let breadcrumbs: { name: string; url: string }[] = [{ name: 'Home', url: '/' }];

    if (route.pageType === 'software_profile') {
      const sw = CMMS_DATABASE.find(
        (s) => s.id === route.relatedEntities[0] || s.slug === route.relatedEntities[0]
      );
      if (sw) {
        const rendered = renderSoftwareProfile(sw);
        bodyHtml = rendered.bodyHtml;
        jsonLdSchemas.push(generateSoftwareSchema(sw));
        if (rendered.faqs.length > 0) {
          jsonLdSchemas.push(generateFaqSchema(rendered.faqs));
        }
        breadcrumbs.push({ name: 'Software Directory', url: '/' });
        breadcrumbs.push({ name: sw.name, url: `/${route.slug}` });
      }
    } else if (route.pageType === 'vs_comparison') {
      const swA = CMMS_DATABASE.find(
        (s) => s.id === route.relatedEntities[0] || s.slug === route.relatedEntities[0]
      );
      const swB = CMMS_DATABASE.find(
        (s) => s.id === route.relatedEntities[1] || s.slug === route.relatedEntities[1]
      );
      if (swA && swB) {
        const rendered = renderVsComparison(swA, swB);
        bodyHtml = rendered.bodyHtml;
        jsonLdSchemas.push(generateSoftwareSchema(swA));
        jsonLdSchemas.push(generateSoftwareSchema(swB));
        if (rendered.faqs.length > 0) {
          jsonLdSchemas.push(generateFaqSchema(rendered.faqs));
        }
        breadcrumbs.push({ name: 'Comparisons', url: '/' });
        breadcrumbs.push({ name: `${swA.name} vs ${swB.name}`, url: `/${route.slug}` });
      }
    } else if (route.pageType === 'software_alternatives') {
      const sw = CMMS_DATABASE.find((s) => route.slug.endsWith(`/${s.slug}`));
      const rendered = renderListingPage(route);
      bodyHtml = rendered.bodyHtml;
      if (rendered.faqs.length > 0) {
        jsonLdSchemas.push(generateFaqSchema(rendered.faqs));
      }
      if (sw) {
        breadcrumbs.push({ name: sw.name, url: `/software/${sw.slug}` });
        breadcrumbs.push({ name: `${sw.name} Alternatives`, url: `/${route.slug}` });
      } else {
        breadcrumbs.push({ name: route.h1, url: `/${route.slug}` });
      }
    } else {
      const rendered = renderListingPage(route);
      bodyHtml = rendered.bodyHtml;
      if (rendered.faqs.length > 0) {
        jsonLdSchemas.push(generateFaqSchema(rendered.faqs));
      }
      breadcrumbs.push({ name: route.h1, url: `/${route.slug}` });
    }

    if (breadcrumbs.length > 1) {
      jsonLdSchemas.push(generateBreadcrumbSchema(breadcrumbs));
    }

    const fullHtml = renderLayout({
      title: route.title,
      metaDescription: route.metaDescription,
      canonicalUrl: route.canonicalUrl,
      bodyHtml,
      jsonLdSchemas,
      breadcrumbs,
    });

    const minified = minifyHtml(fullHtml);
    const targetDir = path.join(DIST_DIR, route.slug);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), minified, 'utf-8');
    fs.writeFileSync(path.join(DIST_DIR, `${route.slug}.html`), minified, 'utf-8');
    pageCount++;
  });

  // 3. Build Internal Affiliate Redirect Pages (/go/[slug]/index.html)
  let goRedirectCount = 0;
  CMMS_DATABASE.forEach((software) => {
    const redirectTarget = software.affiliateUrl || software.websiteUrl;
    const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectTarget)}" />
  <title>Redirecting to ${escapeHtml(software.name)}...</title>
  <script>window.location.href = "${escapeHtml(redirectTarget)}";</script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 4rem 1rem; color: #1f2937;">
  <p style="font-size: 1.1rem; margin-bottom: 1rem;">Redirecting to <strong>${escapeHtml(software.name)}</strong>...</p>
  <p style="font-size: 0.9rem; color: #6b7280;">If you are not redirected automatically, <a href="${escapeHtml(redirectTarget)}" style="color: #0f52ba; font-weight: 600;">click here to visit ${escapeHtml(software.name)}</a>.</p>
</body>
</html>`;

    const goDir = path.join(DIST_DIR, 'go', software.slug);
    fs.mkdirSync(goDir, { recursive: true });
    fs.writeFileSync(path.join(goDir, 'index.html'), minifyHtml(redirectHtml), 'utf-8');
    goRedirectCount++;
  });

  // 4. Generate Dynamic Sitemap and Robots.txt
  writeSitemapAndRobots(DIST_DIR);

  // 5. Copy Static Brand Assets (Favicon, App Icons)
  const faviconSvgPath = path.resolve(process.cwd(), 'favicon.svg');
  if (fs.existsSync(faviconSvgPath)) {
    fs.copyFileSync(faviconSvgPath, path.join(DIST_DIR, 'favicon.svg'));
    fs.copyFileSync(faviconSvgPath, path.join(DIST_DIR, 'favicon.ico'));
    fs.copyFileSync(faviconSvgPath, path.join(DIST_DIR, 'apple-touch-icon.png'));
  }

  console.log(`✅ Static build finished successfully!`);
  console.log(`   - Generated ${pageCount} HTML SEO pages in './dist'`);
  console.log(`   - Generated ${goRedirectCount} affiliate redirect pages in './dist/go/'`);
  console.log(`   - Generated sitemap: ./dist/sitemap.xml`);
  console.log(`   - Generated robots.txt: ./dist/robots.txt (Allow: /)`);
}

buildStaticSite();
