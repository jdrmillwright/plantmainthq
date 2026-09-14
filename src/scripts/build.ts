import * as fs from 'fs';
import * as path from 'path';
import { CMMS_DATABASE } from '../data/database';
import { EVALUATION_CRITERIA, INDUSTRY_CONFIGURATIONS } from '../data/criteria';
import { getAllProgrammaticRoutes } from '../lib/seo';
import { CMMSSoftware, GeneratedSeoPage, FAQItem } from '../types/cmms';

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
    <div class="card" style="background: #0f172a; color: #ffffff; border: none;">
      <h2 style="color: #ffffff; border-bottom: 1px solid #334155;">🧮 Interactive Maintenance ROI & Downtime Savings Calculator</h2>
      <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem;">Estimate annual cost savings by reducing equipment downtime and streamlining technician wrench time with an industrial CMMS.</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div>
          <label style="font-size: 0.85rem; color: #cbd5e1; display: block; margin-bottom: 0.35rem;">Maintenance Techs / Operators</label>
          <input type="number" id="roiTechs" value="10" min="1" max="500" style="width: 100%; padding: 0.6rem; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #fff; font-size: 1rem;" />
        </div>
        <div>
          <label style="font-size: 0.85rem; color: #cbd5e1; display: block; margin-bottom: 0.35rem;">Hourly Unplanned Downtime Cost ($)</label>
          <input type="number" id="roiDowntimeCost" value="1500" min="100" step="100" style="width: 100%; padding: 0.6rem; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #fff; font-size: 1rem;" />
        </div>
        <div>
          <label style="font-size: 0.85rem; color: #cbd5e1; display: block; margin-bottom: 0.35rem;">Unplanned Downtime Hours / Month</label>
          <input type="number" id="roiDowntimeHours" value="12" min="1" max="200" style="width: 100%; padding: 0.6rem; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #fff; font-size: 1rem;" />
        </div>
      </div>

      <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; text-align: center;">
        <div>
          <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">Est. Annual Downtime Cost Reduction</div>
          <div id="roiDowntimeSavings" style="font-size: 1.5rem; font-weight: 800; color: #34d399; margin-top: 0.25rem;">$129,600</div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">Est. Tech Wrench Time Recovered</div>
          <div id="roiTechSavings" style="font-size: 1.5rem; font-weight: 800; color: #60a5fa; margin-top: 0.25rem;">1,040 hrs/yr</div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">Est. CMMS System ROI</div>
          <div id="roiMultiple" style="font-size: 1.5rem; font-weight: 800; color: #f59e0b; margin-top: 0.25rem;">21.6x Return</div>
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">${jsonLdScripts}
  <style>
    :root {
      --primary: #0f52ba;
      --primary-dark: #0a3880;
      --primary-light: #e8f0fe;
      --accent: #f59e0b;
      --text-main: #1f2937;
      --text-muted: #4b5563;
      --bg-page: #f9fafb;
      --bg-card: #ffffff;
      --border-color: #e5e7eb;
      --success: #10b981;
      --danger: #ef4444;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg-page);
      color: var(--text-main);
      line-height: 1.6;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
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
      gap: 0.5rem;
    }
    .logo span { color: #111827; }
    .nav-links {
      display: flex;
      gap: 1.5rem;
      list-style: none;
    }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      transition: color 0.15s ease;
    }
    .nav-links a:hover { color: var(--primary); }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1.5rem 5rem 1.5rem;
    }
    .breadcrumbs {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .breadcrumbs a {
      color: var(--primary);
      text-decoration: none;
    }
    .breadcrumbs a:hover {
      text-decoration: underline;
    }
    .breadcrumbs span {
      color: var(--text-main);
      font-weight: 500;
    }
    .hero {
      margin-bottom: 2.5rem;
      text-align: center;
    }
    .hero h1 {
      font-size: 2.4rem;
      font-weight: 800;
      color: #111827;
      margin-bottom: 0.75rem;
      line-height: 1.25;
    }
    .hero p {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 780px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--primary-light);
      color: var(--primary-dark);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: var(--shadow-sm);
      margin-bottom: 2rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .card h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1rem;
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
      transition: background 0.15s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: var(--primary);
      color: #ffffff;
    }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }
    .btn-outline:hover { background: #f3f4f6; }
    .btn-dark {
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #334155;
    }
    .btn-dark:hover { background: #1e293b; color: #ffffff; }
    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #fef3c7;
      color: #92400e;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .pill {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 0.8rem;
      margin: 0.2rem 0.2rem 0.2rem 0;
      color: #374151;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      margin: 1.5rem 0;
    }
    table.data-table th, table.data-table td {
      padding: 1rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    table.data-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
    }
    table.data-table tr:last-child td { border-bottom: none; }
    .score-bar-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .score-bar-bg {
      flex: 1;
      height: 8px;
      background: #e5e7eb;
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
    .pro-list li { margin-bottom: 0.5rem; position: relative; padding-left: 1.5rem; }
    .pro-list li::before { content: "✓"; font-weight: 800; color: var(--success); position: absolute; left: 0; }
    .con-list { color: #991b1b; list-style: none; }
    .con-list li { margin-bottom: 0.5rem; position: relative; padding-left: 1.5rem; }
    .con-list li::before { content: "✕"; font-weight: 800; color: var(--danger); position: absolute; left: 0; }
    .capability-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem;
    }
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
      line-height: 1.5;
    }
    .check-yes { color: var(--success); font-weight: 800; font-size: 1.1rem; }
    .check-no { color: var(--danger); font-weight: 800; font-size: 1.1rem; }
    footer {
      background: #111827;
      color: #9ca3af;
      padding: 3rem 1.5rem;
      border-top: 1px solid #1f2937;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 2rem;
    }
    .footer-col h4 {
      color: #ffffff;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .footer-col ul { list-style: none; }
    .footer-col ul li { margin-bottom: 0.5rem; }
    .footer-col a {
      color: #9ca3af;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .footer-col a:hover { color: #ffffff; }
    .footer-bottom {
      max-width: 1200px;
      margin: 2rem auto 0 auto;
      padding-top: 1.5rem;
      border-top: 1px solid #374151;
      text-align: center;
      font-size: 0.85rem;
    }
    @media (max-width: 768px) {
      .hero h1 { font-size: 1.8rem; }
      .pros-cons { grid-template-columns: 1fr; }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav-container">
      <a href="/" class="logo">⚙️ PlantMaint<span>HQ</span></a>
      <ul class="nav-links">
        <li><a href="/pricing/best-free-cmms-software">Free CMMS</a></li>
        <li><a href="/pricing/affordable-cmms-under-50">Pricing Guide</a></li>
        <li><a href="/best-cmms-for-manufacturing">Manufacturing</a></li>
        <li><a href="/best-cmms-for-small-teams">Small Teams</a></li>
        <li><a href="/best-cmms-for-enterprise">Enterprise EAM</a></li>
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
      </div>
      <div class="footer-col">
        <h4>Popular Industries</h4>
        <ul>
          <li><a href="/best-cmms-for-manufacturing">Manufacturing</a></li>
          <li><a href="/best-cmms-for-food-beverage">Food & Beverage</a></li>
          <li><a href="/best-cmms-for-facilities-property">Facilities & Property</a></li>
          <li><a href="/best-cmms-for-oil-gas">Oil & Gas</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Buyer Guides</h4>
        <ul>
          <li><a href="/best-cmms-for-small-teams">Small Business CMMS</a></li>
          <li><a href="/best-cmms-for-enterprise">Enterprise EAM</a></li>
          <li><a href="/pricing/best-free-cmms-software">Free CMMS Software</a></li>
          <li><a href="/pricing/affordable-cmms-under-50">Under $50/mo CMMS</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} PlantMaintHQ.com — Independent Maintenance Software Directory.</p>
    </div>
  </footer>
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
      <div style="margin-top: 1.25rem; display: flex; justify-content: center; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <span class="rating-badge">★ ${software.overallRating} / 5.0 (${software.reviewCount.toLocaleString()} verified ratings)</span>
        <span style="font-size: 0.95rem; font-weight: 600; color: #374151;">Starts at ${priceDisplay}</span>
        <a href="/go/${software.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem;">Official Website ↗</a>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid-4" style="margin-bottom: 2rem;">
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Implementation Speed</div>
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary); margin-top: 0.25rem;">${escapeHtml(software.implementationTime)}</div>
      </div>
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Deployment Types</div>
        <div style="font-size: 1.05rem; font-weight: 700; color: #111827; margin-top: 0.25rem;">${software.deploymentTypes.join(', ')}</div>
      </div>
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Free Trial Available</div>
        <div style="font-size: 1.1rem; font-weight: 700; color: ${software.pricing.hasFreeTrial ? 'var(--success)' : '#6b7280'}; margin-top: 0.25rem;">${software.pricing.hasFreeTrial ? 'Yes (Full Access)' : 'No'}</div>
      </div>
      <div style="background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Founded</div>
        <div style="font-size: 1.1rem; font-weight: 700; color: #111827; margin-top: 0.25rem;">${software.yearFounded}</div>
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
      <div style="margin-top: 2rem; text-align: center;">
        <a href="/go/${software.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-size: 1rem;">Explore ${software.name} Official Plans →</a>
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
        <img src="${escapeHtml(softwareA.logoUrl)}" alt="${escapeHtml(softwareA.name)} logo" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 1rem; border-radius: 6px;" />
        <h2>${escapeHtml(softwareA.name)}</h2>
        <span class="rating-badge">★ ${softwareA.overallRating} / 5.0</span>
        <p style="margin: 0.75rem 0;"><strong>Best for:</strong> ${escapeHtml(softwareA.bestFor)}</p>
        <p><strong>Starting Price:</strong> ${priceA}</p>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Implementation:</strong> ${escapeHtml(softwareA.implementationTime)}</p>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
          <a href="/software/${softwareA.slug}" class="btn btn-outline">Read Full Review</a>
          <a href="/go/${softwareA.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary">Visit Website</a>
        </div>
      </div>
      <div class="card">
        <img src="${escapeHtml(softwareB.logoUrl)}" alt="${escapeHtml(softwareB.name)} logo" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 1rem; border-radius: 6px;" />
        <h2>${escapeHtml(softwareB.name)}</h2>
        <span class="rating-badge">★ ${softwareB.overallRating} / 5.0</span>
        <p style="margin: 0.75rem 0;"><strong>Best for:</strong> ${escapeHtml(softwareB.bestFor)}</p>
        <p><strong>Starting Price:</strong> ${priceB}</p>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);"><strong>Implementation:</strong> ${escapeHtml(softwareB.implementationTime)}</p>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
          <a href="/software/${softwareB.slug}" class="btn btn-outline">Read Full Review</a>
          <a href="/go/${softwareB.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary">Visit Website</a>
        </div>
      </div>
    </div>

    <!-- Visual Feature Matrix Table -->
    <div class="card">
      <h2>Visual Feature Matrix</h2>
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

    <div class="card">
      <h2>Side-by-Side Dimension Scores</h2>
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
            <div style="border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <img src="${escapeHtml(sw.logoUrl)}" alt="${escapeHtml(sw.name)} logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 6px; border: 1px solid var(--border-color);" />
                  <div>
                    <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;"><a href="/software/${sw.slug}" style="color: var(--primary); text-decoration: none;">${escapeHtml(sw.name)}</a></h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem;">${escapeHtml(sw.tagline)}</p>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span class="rating-badge">★ ${sw.overallRating} / 5.0</span>
                  <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem; color: #374151;">From ${priceDisplay}</div>
                </div>
              </div>
              <p style="font-size: 0.92rem; margin: 0.75rem 0; color: #374151;">${escapeHtml(sw.overview.substring(0, 240))}...</p>
              <p style="font-size: 0.9rem; margin-bottom: 0.75rem;"><strong>Best For:</strong> ${escapeHtml(sw.bestFor)}</p>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;">
                <a href="/software/${sw.slug}" class="btn btn-outline" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Read Full Review</a>
                <a href="/go/${sw.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn btn-primary" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Visit Website</a>
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

    <!-- Live Client-Side Search and Filtering Toolbar -->
    <div class="card" style="background: #f8fafc; border: 1px solid #cbd5e1;">
      <h3 style="font-size: 1.1rem; color: #0f172a; margin-bottom: 0.75rem;">🔍 Search & Filter Software Directory</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: center;">
        <input
          type="text"
          id="searchInput"
          placeholder="Search by name or feature..."
          style="padding: 0.6rem 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.95rem; width: 100%;"
        />
        <select id="industryFilter" style="padding: 0.6rem 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.95rem; background: #fff; width: 100%;">
          <option value="all">All Industries</option>
          ${industryOptions}
        </select>
        <select id="deploymentFilter" style="padding: 0.6rem 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.95rem; background: #fff; width: 100%;">
          <option value="all">All Deployment Types</option>
          <option value="Cloud/SaaS">Cloud/SaaS</option>
          <option value="Mobile-First">Mobile-First</option>
          <option value="On-Premise">On-Premise</option>
          <option value="Hybrid">Hybrid</option>
        </select>
        <select id="sizeFilter" style="padding: 0.6rem 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.95rem; background: #fff; width: 100%;">
          <option value="all">All Company Sizes</option>
          <option value="Small (1-50)">Small Teams (1-50)</option>
          <option value="Mid-Market (51-500)">Mid-Market (51-500)</option>
          <option value="Enterprise (500+)">Enterprise (500+)</option>
        </select>
      </div>
      <div id="resultsCounter" style="margin-top: 0.75rem; font-size: 0.88rem; color: var(--text-muted); font-weight: 500;">
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

    <!-- Interactive CMMS ROI Calculator -->
    ${renderRoiCalculator()}

    <div class="card">
      <h2>All Indexed CMMS Systems (${CMMS_DATABASE.length})</h2>
      <div id="softwareGrid" class="grid-2" style="margin-top: 1rem;">
        ${CMMS_DATABASE.map(
          (s) => `
          <div
            class="software-card"
            data-name="${escapeHtml(s.name.toLowerCase())}"
            data-tagline="${escapeHtml(s.tagline.toLowerCase())}"
            data-industries="${escapeHtml(s.supportedIndustries.join(','))}"
            data-deployment="${escapeHtml(s.deploymentTypes.join(','))}"
            data-sizes="${escapeHtml(s.targetCompanySizes.join(','))}"
            style="border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px; background: #ffffff;"
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <img src="${escapeHtml(s.logoUrl)}" alt="${escapeHtml(s.name)} logo" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px;" />
                <h4><a href="/software/${s.slug}" style="color: var(--primary); text-decoration: none;">${escapeHtml(s.name)}</a></h4>
              </div>
              <span class="rating-badge">★ ${s.overallRating} / 5.0</span>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin: 0.6rem 0 0.4rem 0;">${escapeHtml(s.tagline)}</p>
            <p style="font-size: 0.85rem; color: #374151;"><strong>Implementation:</strong> ${escapeHtml(s.implementationTime)}</p>
            <div style="margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
              <a href="/software/${s.slug}" style="font-size: 0.85rem; color: var(--primary); font-weight: 600; text-decoration: none;">Read In-Depth Review →</a>
              <a href="/go/${s.slug}" target="_blank" rel="nofollow sponsored noopener" style="font-size: 0.8rem; color: var(--text-muted); text-decoration: underline;">Visit Site ↗</a>
            </div>
          </div>`
        ).join('')}
      </div>
    </div>

    <!-- Client-Side Filter Script -->
    <script>
      (function() {
        const searchInput = document.getElementById('searchInput');
        const industryFilter = document.getElementById('industryFilter');
        const deploymentFilter = document.getElementById('deploymentFilter');
        const sizeFilter = document.getElementById('sizeFilter');
        const softwareCards = document.querySelectorAll('.software-card');
        const resultsCounter = document.getElementById('resultsCounter');

        function filterCards() {
          const query = searchInput.value.toLowerCase().trim();
          const selectedIndustry = industryFilter.value;
          const selectedDeployment = deploymentFilter.value;
          const selectedSize = sizeFilter.value;

          let visibleCount = 0;

          softwareCards.forEach(card => {
            const name = card.getAttribute('data-name') || '';
            const tagline = card.getAttribute('data-tagline') || '';
            const industries = card.getAttribute('data-industries') || '';
            const deployment = card.getAttribute('data-deployment') || '';
            const sizes = card.getAttribute('data-sizes') || '';

            const matchesQuery = !query || name.includes(query) || tagline.includes(query);
            const matchesIndustry = selectedIndustry === 'all' || industries.includes(selectedIndustry);
            const matchesDeployment = selectedDeployment === 'all' || deployment.includes(selectedDeployment);
            const matchesSize = selectedSize === 'all' || sizes.includes(selectedSize);

            if (matchesQuery && matchesIndustry && matchesDeployment && matchesSize) {
              card.style.display = 'block';
              visibleCount++;
            } else {
              card.style.display = 'none';
            }
          });

          resultsCounter.textContent = 'Showing ' + visibleCount + ' of ' + softwareCards.length + ' maintenance management systems';
        }

        searchInput.addEventListener('input', filterCards);
        industryFilter.addEventListener('change', filterCards);
        deploymentFilter.addEventListener('change', filterCards);
        sizeFilter.addEventListener('change', filterCards);
      })();
    </script>
  `;
}

function generateSitemap(routes: GeneratedSeoPage[]): string {
  const urls: string[] = [
    `  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
  ];

  routes.forEach((route) => {
    let priority = '0.7';
    if (route.pageType === 'software_profile') priority = '0.9';
    if (route.pageType === 'vs_comparison') priority = '0.8';
    if (route.pageType === 'industry_guide') priority = '0.8';

    urls.push(`  <url>
    <loc>${DOMAIN}/${route.slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
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
        if (rendered.faqs.length > 0) {
          jsonLdSchemas.push(generateFaqSchema(rendered.faqs));
        }
        breadcrumbs.push({ name: 'Comparisons', url: '/' });
        breadcrumbs.push({ name: `${swA.name} vs ${swB.name}`, url: `/${route.slug}` });
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

  // 4. Generate Sitemap and Robots.txt
  const sitemapXml = generateSitemap(routes);
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');

  const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /go/\n\nSitemap: ${DOMAIN}/sitemap.xml\n`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf-8');

  console.log(`✅ Static build finished successfully!`);
  console.log(`   - Generated ${pageCount} HTML SEO pages in './dist'`);
  console.log(`   - Generated ${goRedirectCount} affiliate redirect pages in './dist/go/'`);
  console.log(`   - Generated sitemap: ./dist/sitemap.xml`);
  console.log(`   - Generated robots.txt: ./dist/robots.txt (Disallow: /go/)`);
}

buildStaticSite();
