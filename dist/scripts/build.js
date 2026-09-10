"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const software_1 = require("../data/software");
const criteria_1 = require("../data/criteria");
const seo_1 = require("../lib/seo");
const DOMAIN = 'https://plantmainthq.com';
const DIST_DIR = path.resolve(process.cwd(), 'dist');
// Helper to escape HTML characters safely
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
// Basic HTML Minifier
function minifyHtml(html) {
    return html
        .replace(/\n/g, ' ')
        .replace(/\s\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/<!--[^>]*-->/g, '')
        .trim();
}
// Generate JSON-LD SoftwareApplication schema markup
function generateSoftwareSchema(software) {
    const schema = {
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
function generateBreadcrumbSchema(breadcrumbs) {
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
function generateFaqSchema(faqs) {
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
// Global Layout Wrapper (Clean, Modern, Minimalist)
function renderLayout(page) {
    const jsonLdScripts = (page.jsonLdSchemas || [])
        .map((schema) => `\n  <script type="application/ld+json">\n${schema}\n  </script>`)
        .join('');
    const breadcrumbsHtml = page.breadcrumbs && page.breadcrumbs.length > 0
        ? `<nav class="breadcrumbs" aria-label="Breadcrumb">
        ${page.breadcrumbs
            .map((crumb, idx) => idx === page.breadcrumbs.length - 1
            ? `<span>${escapeHtml(crumb.name)}</span>`
            : `<a href="${crumb.url}">${escapeHtml(crumb.name)}</a> <span class="separator">/</span> `)
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

  <style>
    /* Minimalist Modern CSS Architecture */
    :root {
      --bg: #ffffff;
      --fg: #171717;
      --muted: #737373;
      --border: #e5e5e5;
      --accent: #000000;
      --radius: 6px;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 3rem;
    }
    
    .logo {
      font-weight: 600;
      font-size: 1.25rem;
      text-decoration: none;
      color: var(--fg);
      letter-spacing: -0.02em;
    }
    
    nav.main-nav a {
      color: var(--muted);
      text-decoration: none;
      margin-left: 1.5rem;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }
    
    nav.main-nav a:hover { color: var(--fg); }
    
    .breadcrumbs {
      font-size: 0.875rem;
      color: var(--muted);
      margin-bottom: 2rem;
    }
    
    .breadcrumbs a { color: var(--muted); text-decoration: none; }
    .breadcrumbs a:hover { color: var(--fg); }
    .breadcrumbs .separator { margin: 0 0.5rem; color: var(--border); }
    .breadcrumbs span { color: var(--fg); }
    
    h1, h2, h3, h4 {
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
      font-weight: 600;
      color: var(--fg);
    }
    
    h1 { font-size: 2.25rem; line-height: 1.2; margin-bottom: 1.5rem; }
    h2 { font-size: 1.5rem; margin-top: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    h3 { font-size: 1.125rem; margin-top: 2rem; }
    
    p { margin-bottom: 1.5rem; color: var(--muted); }
    
    a { color: var(--fg); text-decoration: underline; text-underline-offset: 4px; }
    a:hover { color: var(--muted); }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--accent);
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: var(--radius);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: opacity 0.2s ease;
      border: 1px solid var(--accent);
      cursor: pointer;
    }
    
    .btn:hover { opacity: 0.8; color: #ffffff; text-decoration: none; }
    
    .btn-outline {
      background: transparent;
      color: var(--fg);
      border: 1px solid var(--border);
    }
    
    .btn-outline:hover {
      background: #f9f9f9;
      color: var(--fg);
    }
    
    .card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      background: #ffffff;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: #f5f5f5;
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--muted);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .flex-between {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-box {
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    
    .stat-label {
      font-size: 0.75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .stat-value {
      font-size: 1.125rem;
      font-weight: 500;
      margin-top: 0.25rem;
      color: var(--fg);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }
    
    th, td {
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
      text-align: left;
      font-size: 0.875rem;
    }
    
    th { color: var(--muted); font-weight: 500; }
    
    ul.clean-list {
      list-style: none;
      padding: 0;
    }
    
    ul.clean-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
      color: var(--muted);
    }
    
    ul.clean-list li:last-child { border-bottom: none; }
    
    footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--muted);
      font-size: 0.875rem;
    }
    
    @media (max-width: 600px) {
      nav.main-nav { display: none; }
      h1 { font-size: 1.75rem; }
    }
  </style>
  ${jsonLdScripts}
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="logo">PlantMaintHQ</a>
      <nav class="main-nav">
        <a href="/best-cmms-for-manufacturing">Manufacturing</a>
        <a href="/best-cmms-for-small-teams">Small Teams</a>
        <a href="/pricing/best-free-cmms-software">Free CMMS</a>
      </nav>
    </header>
    
    <main>
      ${breadcrumbsHtml}
      ${page.bodyHtml}
    </main>
    
    <footer>
      <p>© ${new Date().getFullYear()} PlantMaintHQ. Independent Maintenance Software Directory.</p>
    </footer>
  </div>
</body>
</html>`;
}
// Helper to construct FAQs for software profile pages
function buildSoftwareFaqs(software) {
    if (software.faqs && software.faqs.length > 0)
        return software.faqs;
    const startingPrice = typeof software.pricing.startingPricePerUserMonth === 'number'
        ? `$${software.pricing.startingPricePerUserMonth} per user per month`
        : 'custom pricing based on your requirements';
    return [
        {
            question: `How much does ${software.name} cost?`,
            answer: `${software.name} starting plans begin at ${startingPrice}. ${software.pricing.hasFreeTrial ? 'A free trial is available to evaluate features before committing.' : 'Contact sales for custom enterprise tier quotes.'}`,
        },
        {
            question: `How long does it take to implement ${software.name}?`,
            answer: `Typical onboarding and deployment for ${software.name} takes approximately ${software.implementationTime}, depending on team scale and data migration needs.`,
        },
    ];
}
// Renderers for different page types
function renderSoftwareProfile(software) {
    const priceDisplay = typeof software.pricing.startingPricePerUserMonth === 'number'
        ? `$${software.pricing.startingPricePerUserMonth} / user / mo`
        : software.pricing.startingPricePerUserMonth;
    const faqs = buildSoftwareFaqs(software);
    let capabilitiesHtml = '';
    if (software.coreCapabilities && software.coreCapabilities.length > 0) {
        capabilitiesHtml = `
      <h2>Core Capabilities</h2>
      <div class="grid" style="margin-bottom: 2rem;">
        ${software.coreCapabilities.map(cap => `
          <div class="card">
            <h3 style="margin-top: 0; font-size: 1.125rem;">${escapeHtml(cap.title)}</h3>
            <p style="margin-bottom: 0; font-size: 0.875rem;">${escapeHtml(cap.description)}</p>
          </div>
        `).join('')}
      </div>
    `;
    }
    let pricingHtml = '';
    if (software.pricing.plans && software.pricing.plans.length > 0) {
        pricingHtml = `
      <h2>Pricing Plans</h2>
      <div class="grid" style="margin-bottom: 2rem;">
        ${software.pricing.plans.map(plan => {
            const planPrice = typeof plan.pricePerUserMonth === 'number' ? `$${plan.pricePerUserMonth}/mo` : plan.pricePerUserMonth;
            return `
          <div class="card">
            <h3 style="margin-top: 0; font-size: 1.125rem;">${escapeHtml(plan.name)}</h3>
            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: var(--fg);">${planPrice} <span style="font-size: 0.75rem; font-weight: 400; color: var(--muted);">(${plan.billingCycle})</span></div>
            <ul class="clean-list">
              ${plan.highlightedFeatures.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
            </ul>
          </div>
          `;
        }).join('')}
      </div>
    `;
    }
    const bodyHtml = `
    <div style="margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem;">
      <img src="${escapeHtml(software.logoUrl)}" alt="${escapeHtml(software.name)} logo" style="width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border);" />
      <div>
        <h1 style="margin: 0; font-size: 2rem; border: none; padding: 0;">${escapeHtml(software.name)}</h1>
        <div style="font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem;">★ ${software.overallRating} · ${software.reviewCount.toLocaleString()} reviews</div>
      </div>
    </div>

    <p style="font-size: 1.125rem; color: var(--fg);">${escapeHtml(software.tagline)}</p>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-label">Starting Price</div>
        <div class="stat-value">${priceDisplay}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Implementation</div>
        <div class="stat-value">${escapeHtml(software.implementationTime)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Deployment</div>
        <div class="stat-value">${escapeHtml(software.deploymentTypes.join(', '))}</div>
      </div>
    </div>

    ${software.editorsVerdict ? `
    <div class="card" style="background: #f9fafb; border-left: 4px solid var(--accent);">
      <h3 style="margin-top: 0;">Editor's Verdict</h3>
      <p style="margin-bottom: 0; color: var(--fg);">${escapeHtml(software.editorsVerdict)}</p>
    </div>
    ` : ''}

    <h2>Overview</h2>
    <p>${escapeHtml(software.overview)}</p>
    <p><strong>Best For:</strong> ${escapeHtml(software.bestFor)}</p>

    ${capabilitiesHtml}

    <div class="grid" style="margin-top: 2rem;">
      <div class="card">
        <h3 style="margin-top: 0;">Pros</h3>
        <ul class="clean-list">
          ${software.pros.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <h3 style="margin-top: 0;">Cons</h3>
        <ul class="clean-list">
          ${software.cons.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </div>
    </div>

    ${pricingHtml}

    <h2>Technical Evaluation</h2>
    <table>
      <tbody>
        ${criteria_1.EVALUATION_CRITERIA.map((criterion) => `
          <tr>
            <td>${escapeHtml(criterion.name)}</td>
            <td style="text-align: right; color: var(--fg); font-weight: 500;">${software.features[criterion.id].toFixed(1)} / 10</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Frequently Asked Questions</h2>
    <div style="margin-bottom: 3rem;">
      ${faqs.map(faq => `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="margin-bottom: 0.25rem;">${escapeHtml(faq.question)}</h4>
          <p style="margin: 0; font-size: 0.875rem;">${escapeHtml(faq.answer)}</p>
        </div>
      `).join('')}
    </div>

    <div style="text-align: center; padding: 2rem 0; border-top: 1px solid var(--border);">
      <a href="/go/${software.slug}" target="_blank" rel="nofollow sponsored noopener" class="btn">Visit Official Website</a>
    </div>
  `;
    return { bodyHtml, faqs };
}
function renderVsComparison(softwareA, softwareB) {
    const priceA = typeof softwareA.pricing.startingPricePerUserMonth === 'number' ? `$${softwareA.pricing.startingPricePerUserMonth}/mo` : softwareA.pricing.startingPricePerUserMonth;
    const priceB = typeof softwareB.pricing.startingPricePerUserMonth === 'number' ? `$${softwareB.pricing.startingPricePerUserMonth}/mo` : softwareB.pricing.startingPricePerUserMonth;
    const faqs = [
        {
            question: `Which is better between ${softwareA.name} and ${softwareB.name}?`,
            answer: `${softwareA.name} scores ${softwareA.overallRating}/5.0, while ${softwareB.name} scores ${softwareB.overallRating}/5.0. Choose based on your primary facility workflow priorities.`,
        }
    ];
    const bodyHtml = `
    <span class="badge">Comparison</span>
    <h1>${escapeHtml(softwareA.name)} vs ${escapeHtml(softwareB.name)}</h1>
    <p>A side-by-side technical evaluation of two leading maintenance platforms.</p>

    <div class="grid" style="margin-top: 2rem; margin-bottom: 3rem;">
      <div class="card" style="text-align: center;">
        <img src="${escapeHtml(softwareA.logoUrl)}" alt="Logo" style="width: 48px; height: 48px; border-radius: 8px; margin-bottom: 1rem;" />
        <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(softwareA.name)}</h3>
        <div style="font-size: 0.875rem; color: var(--muted); margin-bottom: 1rem;">★ ${softwareA.overallRating}</div>
        <a href="/software/${softwareA.slug}" class="btn btn-outline" style="width: 100%;">Read Review</a>
      </div>
      <div class="card" style="text-align: center;">
        <img src="${escapeHtml(softwareB.logoUrl)}" alt="Logo" style="width: 48px; height: 48px; border-radius: 8px; margin-bottom: 1rem;" />
        <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(softwareB.name)}</h3>
        <div style="font-size: 0.875rem; color: var(--muted); margin-bottom: 1rem;">★ ${softwareB.overallRating}</div>
        <a href="/software/${softwareB.slug}" class="btn btn-outline" style="width: 100%;">Read Review</a>
      </div>
    </div>

    <h2>Feature Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>${escapeHtml(softwareA.name)}</th>
          <th>${escapeHtml(softwareB.name)}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Starting Price</td>
          <td>${priceA}</td>
          <td>${priceB}</td>
        </tr>
        <tr>
          <td>Implementation</td>
          <td>${escapeHtml(softwareA.implementationTime)}</td>
          <td>${escapeHtml(softwareB.implementationTime)}</td>
        </tr>
        ${criteria_1.EVALUATION_CRITERIA.map((criterion) => `
          <tr>
            <td>${escapeHtml(criterion.name)}</td>
            <td>${softwareA.features[criterion.id].toFixed(1)}</td>
            <td>${softwareB.features[criterion.id].toFixed(1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
    return { bodyHtml, faqs };
}
function renderListingPage(page) {
    const matchingSoftware = software_1.CMMS_DATABASE.filter((s) => page.relatedEntities.includes(s.id) || page.relatedEntities.includes(s.slug));
    const faqs = [];
    if (matchingSoftware.length > 0) {
        faqs.push({
            question: `What are the top recommended platforms in this guide?`,
            answer: `Our top evaluated platforms include ${matchingSoftware.slice(0, 3).map((s) => s.name).join(', ')}.`,
        });
    }
    const bodyHtml = `
    <span class="badge">${page.pageType.replace(/_/g, ' ')}</span>
    <h1>${escapeHtml(page.h1)}</h1>
    <p>${escapeHtml(page.metaDescription)}</p>

    <div style="margin-top: 3rem;">
      ${matchingSoftware.map((sw) => {
        const priceDisplay = typeof sw.pricing.startingPricePerUserMonth === 'number' ? `$${sw.pricing.startingPricePerUserMonth}/mo` : sw.pricing.startingPricePerUserMonth;
        return `
        <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
          <div class="flex-between">
            <h3 style="margin: 0; font-size: 1.25rem;"><a href="/software/${sw.slug}" style="text-decoration: none;">${escapeHtml(sw.name)}</a></h3>
            <span style="font-size: 0.875rem; color: var(--muted);">★ ${sw.overallRating}</span>
          </div>
          <p style="margin: 0; font-size: 0.875rem;">${escapeHtml(sw.tagline)}</p>
          <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">
            Starts at ${priceDisplay} · ${escapeHtml(sw.implementationTime)} Setup
          </div>
          <div style="margin-top: 0.5rem;">
            <a href="/software/${sw.slug}" class="btn btn-outline" style="font-size: 0.75rem; padding: 0.4rem 0.75rem;">Read Review</a>
          </div>
        </div>`;
    }).join('')}
    </div>
  `;
    return { bodyHtml, faqs };
}
function renderHomePage() {
    return `
    <span class="badge">Directory</span>
    <h1>Industrial CMMS Directory</h1>
    <p>A clean, unbiased index of top maintenance management software. Compare technical benchmarks, pricing, and usability scores.</p>

    <div class="grid" style="margin-top: 3rem;">
      ${software_1.CMMS_DATABASE.map((s) => `
        <div class="card">
          <div class="flex-between" style="margin-bottom: 0.5rem;">
            <h3 style="margin: 0; font-size: 1.125rem;"><a href="/software/${s.slug}" style="text-decoration: none;">${escapeHtml(s.name)}</a></h3>
            <span style="font-size: 0.875rem; color: var(--muted);">★ ${s.overallRating}</span>
          </div>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem; min-height: 2.6rem;">${escapeHtml(s.tagline)}</p>
          <a href="/software/${s.slug}" class="btn btn-outline" style="width: 100%; text-align: center;">View Profile</a>
        </div>
      `).join('')}
    </div>
  `;
}
function generateSitemap(routes) {
    const urls = [
        `  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ];
    routes.forEach((route) => {
        let priority = '0.7';
        if (route.pageType === 'software_profile')
            priority = '0.9';
        if (route.pageType === 'vs_comparison')
            priority = '0.8';
        if (route.pageType === 'industry_guide')
            priority = '0.8';
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
function buildStaticSite() {
    console.log('🚀 Starting PlantMaintHQ static site build (Minimalist Edition)...');
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }
    // Copy OG Banner to dist
    const ogBannerPath = path.join(process.cwd(), 'og-banner.png');
    if (fs.existsSync(ogBannerPath)) {
        fs.copyFileSync(ogBannerPath, path.join(DIST_DIR, 'og-banner.png'));
    }
    // Generate API JSON
    const apiDir = path.join(DIST_DIR, 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, 'software.json'), JSON.stringify(software_1.CMMS_DATABASE, null, 2), 'utf-8');
    const routes = (0, seo_1.getAllProgrammaticRoutes)();
    // 1. Build Homepage
    const homeHtml = renderLayout({
        title: 'PlantMaintHQ - Independent CMMS Directory',
        metaDescription: 'Find and compare top CMMS and EAM software for industrial manufacturing, facilities, and plant maintenance operations.',
        canonicalUrl: `${DOMAIN}/`,
        bodyHtml: renderHomePage(),
    });
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), minifyHtml(homeHtml), 'utf-8');
    // 2. Build Programmatic Pages
    let pageCount = 1;
    routes.forEach((route) => {
        let bodyHtml = '';
        const jsonLdSchemas = [];
        let breadcrumbs = [{ name: 'Home', url: '/' }];
        if (route.pageType === 'software_profile') {
            const sw = software_1.CMMS_DATABASE.find((s) => s.id === route.relatedEntities[0] || s.slug === route.relatedEntities[0]);
            if (sw) {
                const rendered = renderSoftwareProfile(sw);
                bodyHtml = rendered.bodyHtml;
                jsonLdSchemas.push(generateSoftwareSchema(sw));
                if (rendered.faqs.length > 0) {
                    jsonLdSchemas.push(generateFaqSchema(rendered.faqs));
                }
                breadcrumbs.push({ name: 'Directory', url: '/' });
                breadcrumbs.push({ name: sw.name, url: `/${route.slug}` });
            }
        }
        else if (route.pageType === 'vs_comparison') {
            const swA = software_1.CMMS_DATABASE.find((s) => s.id === route.relatedEntities[0] || s.slug === route.relatedEntities[0]);
            const swB = software_1.CMMS_DATABASE.find((s) => s.id === route.relatedEntities[1] || s.slug === route.relatedEntities[1]);
            if (swA && swB) {
                const rendered = renderVsComparison(swA, swB);
                bodyHtml = rendered.bodyHtml;
                if (rendered.faqs.length > 0) {
                    jsonLdSchemas.push(generateFaqSchema(rendered.faqs));
                }
                breadcrumbs.push({ name: 'Comparisons', url: '/' });
                breadcrumbs.push({ name: `${swA.name} vs ${swB.name}`, url: `/${route.slug}` });
            }
        }
        else {
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
        const targetDir = path.join(DIST_DIR, route.slug);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, 'index.html'), minifyHtml(fullHtml), 'utf-8');
        pageCount++;
    });
    // 3. Build Internal Affiliate Redirect Pages
    let goRedirectCount = 0;
    software_1.CMMS_DATABASE.forEach((software) => {
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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 4rem 1rem; color: #171717;">
  <p style="font-size: 1.1rem; margin-bottom: 1rem;">Redirecting to <strong>${escapeHtml(software.name)}</strong>...</p>
  <p style="font-size: 0.875rem; color: #737373;">If you are not redirected automatically, <a href="${escapeHtml(redirectTarget)}" style="color: #000; font-weight: 500;">click here</a>.</p>
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
}
buildStaticSite();
