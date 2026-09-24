import * as fs from 'fs';
import * as path from 'path';
import { cmmsSoftware } from '../data/software';

const DIST_DIR = path.join(__dirname, '../../dist');
const SOFTWARE_DIR = path.join(DIST_DIR, 'software');
const ALTERNATIVES_DIR = path.join(DIST_DIR, 'alternatives');
const COMPARE_DIR = path.join(DIST_DIR, 'compare');
const BASE_URL = 'https://plantmainthq.com';

// Define Categories for Programmatic SEO
const categories = [
  // Industries
  { slug: 'best-cmms-for-manufacturing', title: 'Best CMMS for Manufacturing', desc: 'Top CMMS software tailored for manufacturing plants and industrial facilities.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Manufacturing')) },
  { slug: 'best-cmms-for-food-beverage', title: 'Best CMMS for Food & Beverage', desc: 'Top CMMS software for food processing, beverage, and packaging plants.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Food & Beverage')) },
  { slug: 'best-cmms-for-oil-gas', title: 'Best CMMS for Oil & Gas', desc: 'Enterprise asset management software for the oil, gas, and energy sectors.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Oil & Gas') || i.includes('Energy')) },
  { slug: 'best-cmms-for-facilities-property', title: 'Best CMMS for Facilities & Property', desc: 'Top facility management and property maintenance software.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Facilities') || i.includes('Property') || i.includes('Real Estate')) },
  { slug: 'best-cmms-for-fleet-heavy-equipment', title: 'Best CMMS for Fleet & Heavy Equipment', desc: 'Maintenance software for fleet, transit, and heavy construction equipment.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Fleet') || i.includes('Transit') || i.includes('Construction')) },
  { slug: 'best-cmms-for-healthcare-pharmaceuticals', title: 'Best CMMS for Healthcare & Pharmaceuticals', desc: 'Maintenance and compliance software for hospitals and life sciences.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Healthcare') || i.includes('Life Sciences')) },
  { slug: 'best-cmms-for-utilities-energy', title: 'Best CMMS for Utilities & Energy', desc: 'EAM software for public utilities, power generation, and energy grids.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Utilities') || i.includes('Energy') || i.includes('Power')) },
  { slug: 'best-cmms-for-packaging-logistics', title: 'Best CMMS for Packaging & Logistics', desc: 'Maintenance software for packaging lines, warehousing, and logistics.', filter: (s: typeof cmmsSoftware[0]) => s.targetIndustries.some(i => i.includes('Packaging') || i.includes('Logistics') || i.includes('Warehousing')) },
  
  // Features
  { slug: 'best-cmms-for-work-order-management', title: 'Best CMMS for Work Order Management', desc: 'Top software for streamlining work requests, approvals, and work order execution.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('work order')) },
  { slug: 'best-cmms-for-preventive-maintenance', title: 'Best CMMS for Preventive Maintenance', desc: 'Top software for scheduling and automating preventive maintenance tasks.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('preventive')) },
  { slug: 'best-cmms-for-asset-tracking-and-hierarchy', title: 'Best CMMS for Asset Tracking & Hierarchy', desc: 'Top software for managing complex asset trees, tracking history, and lifecycle management.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('asset')) },
  { slug: 'best-cmms-for-mro-inventory-management', title: 'Best CMMS for MRO Inventory Management', desc: 'Top software for tracking spare parts, managing MRO inventory, and procurement.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('inventory') || f.toLowerCase().includes('mro') || f.toLowerCase().includes('purchasing')) },
  { slug: 'best-cmms-for-mobile-app-usability', title: 'Best CMMS for Mobile App Usability', desc: 'Top mobile-first CMMS apps designed for technicians on the shop floor.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('mobile')) || (s.technicianUsabilityScore && s.technicianUsabilityScore >= 8.5) },
  { slug: 'best-cmms-for-predictive-maintenance-and-iot', title: 'Best CMMS for Predictive Maintenance & IoT', desc: 'Advanced EAM software with IoT sensor integration and AI predictive analytics.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('predictive') || f.toLowerCase().includes('iot') || f.toLowerCase().includes('ai')) },
  { slug: 'best-cmms-for-reporting-and-analytics', title: 'Best CMMS for Reporting & Analytics', desc: 'Top software for maintenance KPIs, dashboards, and custom reporting.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('report') || f.toLowerCase().includes('analytic') || f.toLowerCase().includes('dashboard')) },
  { slug: 'best-cmms-for-compliance-and-audit-readiness', title: 'Best CMMS for Compliance & Audit Readiness', desc: 'Top software for maintaining OSHA, FDA, and ISO compliance records.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('compliance') || f.toLowerCase().includes('audit') || f.toLowerCase().includes('safety') || f.toLowerCase().includes('regulatory')) },
  { slug: 'best-cmms-for-vendor-and-contractor-management', title: 'Best CMMS for Vendor & Contractor Management', desc: 'Top software for managing external contractors, SLAs, and vendor portals.', filter: (s: typeof cmmsSoftware[0]) => s.features.some(f => f.toLowerCase().includes('vendor') || f.toLowerCase().includes('contractor') || f.toLowerCase().includes('sla')) },
  
  // Size
  { slug: 'best-cmms-for-small-teams', title: 'Best CMMS for Small Teams', desc: 'Affordable, easy-to-use CMMS software for small maintenance teams.', filter: (s: typeof cmmsSoftware[0]) => s.pricingModel === 'Freemium' || s.pricingModel === 'Subscription' },
  { slug: 'best-cmms-for-mid-market-plants', title: 'Best CMMS for Mid-Market Plants', desc: 'Scalable CMMS software for growing mid-sized manufacturing plants.', filter: (s: typeof cmmsSoftware[0]) => s.pricingModel === 'Subscription' || s.pricingModel === 'Custom Quote' },
  { slug: 'best-cmms-for-enterprise', title: 'Best CMMS for Enterprise', desc: 'Robust Enterprise Asset Management (EAM) software for global, multi-site operations.', filter: (s: typeof cmmsSoftware[0]) => s.pricingModel === 'Enterprise' || s.pricingModel === 'Custom Quote' },
  
  // Pricing (Nested in /pricing/)
  { slug: 'pricing/best-free-cmms-software', title: 'Best Free CMMS Software', desc: 'Top free and freemium CMMS software options for maintenance teams on a budget.', filter: (s: typeof cmmsSoftware[0]) => s.pricingModel === 'Free' || s.pricingModel === 'Freemium' || (s.pricingTiers && s.pricingTiers.some(t => t.toLowerCase().includes('free'))) },
  { slug: 'pricing/affordable-cmms-under-50', title: 'Affordable CMMS Under $50/mo', desc: 'Cost-effective CMMS software with starting plans under $50 per user/month.', filter: (s: typeof cmmsSoftware[0]) => s.pricingModel === 'Freemium' || (s.pricingTiers && s.pricingTiers.some(t => t.includes('$0') || t.includes('$1') || t.includes('$2') || t.includes('$3') || t.includes('$4'))) }
];

// Ensure directories exist safely
function ensureDirectories() {
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
  if (!fs.existsSync(SOFTWARE_DIR)) fs.mkdirSync(SOFTWARE_DIR, { recursive: true });
  if (!fs.existsSync(ALTERNATIVES_DIR)) fs.mkdirSync(ALTERNATIVES_DIR, { recursive: true });
  if (!fs.existsSync(COMPARE_DIR)) fs.mkdirSync(COMPARE_DIR, { recursive: true });
}

// HTML Template for individual software pages
const generateSoftwarePage = (software: typeof cmmsSoftware[0], allSoftware: typeof cmmsSoftware) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${software.name} - CMMS Software Review & Details | PlantMaintHQ</title>
    <meta name="description" content="Comprehensive review and details for ${software.name}. ${software.tagline} Discover features, pricing, and pros/cons for industrial maintenance.">
    <link rel="canonical" href="${BASE_URL}/software/${software.slug}">
    <meta property="og:title" content="${software.name} - CMMS Software Review & Details | PlantMaintHQ">
    <meta property="og:description" content="Comprehensive review and details for ${software.name}. ${software.tagline} Discover features, pricing, and pros/cons for industrial maintenance.">
    <meta property="og:url" content="${BASE_URL}/software/${software.slug}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; min-height: 100vh; }
        main { flex: 1; }
        header { border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
        h1 { color: #1a365d; margin-bottom: 0.5rem; }
        .tagline { font-size: 1.2rem; color: #4a5568; font-style: italic; }
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: #f7fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        .meta-item strong { display: block; color: #2d3748; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .section { margin-bottom: 2rem; }
        h2 { color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        ul { padding-left: 1.5rem; }
        li { margin-bottom: 0.5rem; }
        .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        @media (max-width: 600px) { .pros-cons { grid-template-columns: 1fr; gap: 1rem; } }
        .pros h3 { color: #38a169; }
        .cons h3 { color: #e53e3e; }
        .btn { display: inline-block; background: #3182ce; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; font-weight: bold; transition: background 0.2s; }
        .btn:hover { background: #2b6cb0; }
        .btn-outline { background: transparent; color: #3182ce; border: 2px solid #3182ce; }
        .btn-outline:hover { background: #ebf8ff; }
        .nav { margin-bottom: 2rem; }
        .nav a { color: #3182ce; text-decoration: none; font-weight: 500; }
        .nav a:hover { text-decoration: underline; }
        .internal-links { background: #fff; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; margin-top: 2rem; }
        .internal-links a { color: #2b6cb0; text-decoration: none; font-weight: 500; }
        .internal-links a:hover { text-decoration: underline; }
        footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; text-align: center; color: #718096; font-size: 0.9rem; }
    </style>
</head>
<body>
    <nav class="nav">
        <a href="../index.html">&larr; Back to Directory</a>
    </nav>
    
    <main>
        <header>
            <h1>${software.name}</h1>
            <p class="tagline">${software.tagline}</p>
        </header>

        <div class="meta-grid">
            <div class="meta-item">
                <strong>Founded</strong>
                <span>${software.foundedYear}</span>
            </div>
            <div class="meta-item">
                <strong>Pricing Model</strong>
                <span>${software.pricingModel}</span>
            </div>
            <div class="meta-item">
                <strong>Deployment</strong>
                <span>${software.deployment.join(', ')}</span>
            </div>
            ${software.technicianUsabilityScore ? `
            <div class="meta-item">
                <strong>Usability Score</strong>
                <span>${software.technicianUsabilityScore} / 10</span>
            </div>
            ` : ''}
        </div>

        <section class="section">
            <h2>Overview</h2>
            <p>${software.description}</p>
            <br>
            <a href="${software.website}" target="_blank" rel="noopener noreferrer" class="btn">Visit Official Website</a>
        </section>

        ${software.pricingTiers ? `
        <section class="section">
            <h2>Pricing Tiers</h2>
            <ul>
                ${software.pricingTiers.map(tier => `<li>${tier}</li>`).join('')}
            </ul>
        </section>
        ` : ''}

        <section class="section">
            <h2>Key Features</h2>
            <ul>
                ${software.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </section>

        ${software.featureBenchmarks ? `
        <section class="section">
            <h2>Feature Benchmarks</h2>
            <ul>
                ${Object.entries(software.featureBenchmarks).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
            </ul>
        </section>
        ` : ''}

        <section class="section">
            <h2>Target Industries</h2>
            <ul>
                ${software.targetIndustries.map(industry => `<li>${industry}</li>`).join('')}
            </ul>
        </section>

        <section class="section pros-cons">
            <div class="pros">
                <h3>Pros</h3>
                <ul>
                    ${software.pros.map(pro => `<li>${pro}</li>`).join('')}
                </ul>
            </div>
            <div class="cons">
                <h3>Cons</h3>
                <ul>
                    ${software.cons.map(con => `<li>${con}</li>`).join('')}
                </ul>
            </div>
        </section>

        <section class="section internal-links">
            <h2>Alternatives & Comparisons</h2>
            <p style="margin-bottom: 1rem;">Looking for other options? Explore the <a href="../alternatives/${software.slug}.html">best ${software.name} alternatives</a>.</p>
            
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">Compare ${software.name} against top competitors:</h3>
            <ul style="list-style-type: none; padding-left: 0;">
                ${allSoftware.filter(s => s.id !== software.id).slice(0, 5).map(alt => `
                    <li style="margin-bottom: 0.5rem;">
                        &rarr; <a href="../compare/${software.slug}-vs-${alt.slug}.html">${software.name} vs ${alt.name}</a>
                    </li>
                `).join('')}
            </ul>
        </section>
    </main>

    <footer>
        <p>&copy; ${new Date().getFullYear()} PlantMaintHQ. All rights reserved.</p>
    </footer>
</body>
</html>
`;

// HTML Template for the index page
const generateIndexPage = (softwareList: typeof cmmsSoftware, categoriesList: typeof categories) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlantMaintHQ - CMMS & EAM Software Directory</title>
    <meta name="description" content="The ultimate programmatic SEO directory for industrial maintenance mechanics, millwrights, and plant operations to find CMMS software.">
    <link rel="canonical" href="${BASE_URL}/">
    <meta property="og:title" content="PlantMaintHQ - CMMS & EAM Software Directory">
    <meta property="og:description" content="The ultimate programmatic SEO directory for industrial maintenance mechanics, millwrights, and plant operations to find CMMS software.">
    <meta property="og:url" content="${BASE_URL}/">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 2rem; background-color: #f7fafc; display: flex; flex-direction: column; min-height: 100vh; }
        main { flex: 1; }
        header { text-align: center; margin-bottom: 3rem; }
        h1 { color: #1a365d; font-size: 2.5rem; margin-bottom: 0.5rem; }
        p.subtitle { color: #4a5568; font-size: 1.2rem; }
        .section-title { color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1.5rem; margin-top: 3rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px rgba(0,0,0,0.1); }
        .card h2 { margin-top: 0; color: #2b6cb0; font-size: 1.4rem; margin-bottom: 0.75rem; }
        .card p { color: #4a5568; font-size: 0.95rem; margin-bottom: 1.5rem; flex: 1; }
        .card-footer { margin-top: auto; }
        .card a { display: inline-block; background: #3182ce; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 0.9rem; transition: background 0.2s; }
        .card a:hover { background: #2b6cb0; }
        .card.category-card a { background: #edf2f7; color: #2b6cb0; border: 1px solid #cbd5e0; }
        .card.category-card a:hover { background: #e2e8f0; }
        .tags { margin-bottom: 1rem; }
        .tag { display: inline-block; background: #edf2f7; color: #4a5568; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.025em; }
        footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9rem; }
    </style>
</head>
<body>
    <header>
        <h1>PlantMaintHQ</h1>
        <p class="subtitle">The Ultimate CMMS & EAM Software Directory for Industrial Maintenance</p>
    </header>

    <main>
        <section>
            <h2 class="section-title">Browse by Category</h2>
            <div class="grid">
                ${categoriesList.map(cat => `
                    <article class="card category-card">
                        <h2>${cat.title}</h2>
                        <p>${cat.desc}</p>
                        <div class="card-footer">
                            <a href="${cat.slug}.html">View Category &rarr;</a>
                        </div>
                    </article>
                `).join('')}
            </div>
        </section>

        <section>
            <h2 class="section-title">All CMMS Software</h2>
            <div class="grid">
                ${softwareList.map(software => `
                    <article class="card">
                        <h2>${software.name}</h2>
                        <div class="tags">
                            <span class="tag">${software.pricingModel}</span>
                            <span class="tag">${software.deployment[0]}</span>
                        </div>
                        <p>${software.tagline}</p>
                        <div class="card-footer">
                            <a href="software/${software.slug}.html">View Details &rarr;</a>
                        </div>
                    </article>
                `).join('')}
            </div>
        </section>
    </main>

    <footer>
        <p>&copy; ${new Date().getFullYear()} PlantMaintHQ. All rights reserved.</p>
    </footer>
</body>
</html>
`;

// HTML Template for Alternatives pages
const generateAlternativesPage = (software: typeof cmmsSoftware[0], allSoftware: typeof cmmsSoftware) => {
  const alternatives = allSoftware.filter(s => s.id !== software.id).slice(0, 12);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Top ${software.name} Alternatives & Competitors | PlantMaintHQ</title>
    <meta name="description" content="Looking for alternatives to ${software.name}? Compare the best CMMS and EAM software options for industrial maintenance.">
    <link rel="canonical" href="${BASE_URL}/alternatives/${software.slug}">
    <meta property="og:title" content="Top ${software.name} Alternatives & Competitors | PlantMaintHQ">
    <meta property="og:description" content="Looking for alternatives to ${software.name}? Compare the best CMMS and EAM software options for industrial maintenance.">
    <meta property="og:url" content="${BASE_URL}/alternatives/${software.slug}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 2rem; background-color: #f7fafc; display: flex; flex-direction: column; min-height: 100vh; }
        main { flex: 1; }
        header { text-align: center; margin-bottom: 3rem; }
        h1 { color: #1a365d; font-size: 2.5rem; margin-bottom: 0.5rem; }
        p.subtitle { color: #4a5568; font-size: 1.2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card h2 { margin-top: 0; color: #2b6cb0; font-size: 1.4rem; margin-bottom: 0.75rem; }
        .card p { color: #4a5568; font-size: 0.95rem; margin-bottom: 1.5rem; flex: 1; }
        .card-footer { margin-top: auto; display: flex; gap: 0.5rem; }
        .btn { display: inline-block; background: #3182ce; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 0.9rem; transition: background 0.2s; }
        .btn:hover { background: #2b6cb0; }
        .btn-secondary { background: #4a5568; }
        .btn-secondary:hover { background: #2d3748; }
        .nav { margin-bottom: 2rem; }
        .nav a { color: #3182ce; text-decoration: none; font-weight: 500; }
        .nav a:hover { text-decoration: underline; }
        footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9rem; }
    </style>
</head>
<body>
    <nav class="nav">
        <a href="../software/${software.slug}.html">&larr; Back to ${software.name}</a>
    </nav>
    
    <header>
        <h1>Best Alternatives to ${software.name}</h1>
        <p class="subtitle">Explore top competitors and similar CMMS platforms for your plant.</p>
    </header>

    <main>
        <div class="grid">
            ${alternatives.map(alt => `
                <article class="card">
                    <h2>${alt.name}</h2>
                    <p>${alt.tagline}</p>
                    <div class="card-footer">
                        <a href="../software/${alt.slug}.html" class="btn">Read Review</a>
                        <a href="../compare/${software.slug}-vs-${alt.slug}.html" class="btn btn-secondary">Compare</a>
                    </div>
                </article>
            `).join('')}
        </div>
    </main>

    <footer>
        <p>&copy; ${new Date().getFullYear()} PlantMaintHQ. All rights reserved.</p>
    </footer>
</body>
</html>
`;
};

// HTML Template for Comparison pages
const generateComparisonPage = (softwareA: typeof cmmsSoftware[0], softwareB: typeof cmmsSoftware[0]) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${softwareA.name} vs ${softwareB.name} - CMMS Comparison | PlantMaintHQ</title>
    <meta name="description" content="Compare ${softwareA.name} vs ${softwareB.name}. See features, pricing, pros, and cons to choose the best CMMS for your plant.">
    <link rel="canonical" href="${BASE_URL}/compare/${softwareA.slug}-vs-${softwareB.slug}">
    <meta property="og:title" content="${softwareA.name} vs ${softwareB.name} - CMMS Comparison | PlantMaintHQ">
    <meta property="og:description" content="Compare ${softwareA.name} vs ${softwareB.name}. See features, pricing, pros, and cons to choose the best CMMS for your plant.">
    <meta property="og:url" content="${BASE_URL}/compare/${softwareA.slug}-vs-${softwareB.slug}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 2rem; display: flex; flex-direction: column; min-height: 100vh; }
        main { flex: 1; }
        header { text-align: center; margin-bottom: 3rem; }
        h1 { color: #1a365d; font-size: 2.5rem; margin-bottom: 0.5rem; }
        p.subtitle { color: #4a5568; font-size: 1.2rem; }
        .comparison-table { width: 100%; border-collapse: collapse; margin-top: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .comparison-table th, .comparison-table td { border: 1px solid #e2e8f0; padding: 1.5rem; text-align: left; vertical-align: top; }
        .comparison-table th { background: #edf2f7; font-size: 1.1rem; color: #2d3748; }
        .comparison-table th:first-child { width: 20%; background: #f7fafc; }
        .comparison-table td { background: white; width: 40%; }
        ul { padding-left: 1.2rem; margin: 0; }
        li { margin-bottom: 0.5rem; }
        .nav { margin-bottom: 2rem; }
        .nav a { color: #3182ce; text-decoration: none; font-weight: 500; }
        .nav a:hover { text-decoration: underline; }
        footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9rem; }
    </style>
</head>
<body>
    <nav class="nav">
        <a href="../index.html">&larr; Back to Directory</a>
    </nav>
    
    <header>
        <h1>${softwareA.name} vs ${softwareB.name}</h1>
        <p class="subtitle">In-depth CMMS Software Comparison</p>
    </header>

    <main>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Feature / Metric</th>
                    <th><a href="../software/${softwareA.slug}.html" style="color: inherit; text-decoration: none;">${softwareA.name}</a></th>
                    <th><a href="../software/${softwareB.slug}.html" style="color: inherit; text-decoration: none;">${softwareB.name}</a></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Pricing Model</strong></td>
                    <td>${softwareA.pricingModel}</td>
                    <td>${softwareB.pricingModel}</td>
                </tr>
                <tr>
                    <td><strong>Deployment</strong></td>
                    <td>${softwareA.deployment.join(', ')}</td>
                    <td>${softwareB.deployment.join(', ')}</td>
                </tr>
                <tr>
                    <td><strong>Target Industries</strong></td>
                    <td>${softwareA.targetIndustries.join(', ')}</td>
                    <td>${softwareB.targetIndustries.join(', ')}</td>
                </tr>
                <tr>
                    <td><strong>Key Features</strong></td>
                    <td><ul>${softwareA.features.map(f => `<li>${f}</li>`).join('')}</ul></td>
                    <td><ul>${softwareB.features.map(f => `<li>${f}</li>`).join('')}</ul></td>
                </tr>
                <tr>
                    <td><strong>Pros</strong></td>
                    <td><ul>${softwareA.pros.map(p => `<li>${p}</li>`).join('')}</ul></td>
                    <td><ul>${softwareB.pros.map(p => `<li>${p}</li>`).join('')}</ul></td>
                </tr>
                <tr>
                    <td><strong>Cons</strong></td>
                    <td><ul>${softwareA.cons.map(c => `<li>${c}</li>`).join('')}</ul></td>
                    <td><ul>${softwareB.cons.map(c => `<li>${c}</li>`).join('')}</ul></td>
                </tr>
            </tbody>
        </table>
    </main>

    <footer>
        <p>&copy; ${new Date().getFullYear()} PlantMaintHQ. All rights reserved.</p>
    </footer>
</body>
</html>
`;

// HTML Template for Category/Industry/Pricing pages
const generateCategoryPage = (title: string, description: string, softwareList: typeof cmmsSoftware, backLink: string, softwarePathPrefix: string, categorySlug: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | PlantMaintHQ</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${BASE_URL}/${categorySlug}">
    <meta property="og:title" content="${title} | PlantMaintHQ">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${BASE_URL}/${categorySlug}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 2rem; background-color: #f7fafc; display: flex; flex-direction: column; min-height: 100vh; }
        main { flex: 1; }
        header { text-align: center; margin-bottom: 3rem; }
        h1 { color: #1a365d; font-size: 2.5rem; margin-bottom: 0.5rem; }
        p.subtitle { color: #4a5568; font-size: 1.2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px rgba(0,0,0,0.1); }
        .card h2 { margin-top: 0; color: #2b6cb0; font-size: 1.4rem; margin-bottom: 0.75rem; }
        .card p { color: #4a5568; font-size: 0.95rem; margin-bottom: 1.5rem; flex: 1; }
        .card-footer { margin-top: auto; }
        .card a { display: inline-block; background: #3182ce; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 0.9rem; transition: background 0.2s; }
        .card a:hover { background: #2b6cb0; }
        .tags { margin-bottom: 1rem; }
        .tag { display: inline-block; background: #edf2f7; color: #4a5568; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.025em; }
        .nav { margin-bottom: 2rem; }
        .nav a { color: #3182ce; text-decoration: none; font-weight: 500; }
        .nav a:hover { text-decoration: underline; }
        footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 0.9rem; }
    </style>
</head>
<body>
    <nav class="nav">
        <a href="${backLink}">&larr; Back to Directory</a>
    </nav>
    
    <header>
        <h1>${title}</h1>
        <p class="subtitle">${description}</p>
    </header>

    <main>
        <div class="grid">
            ${softwareList.length > 0 ? softwareList.map(software => `
                <article class="card">
                    <h2>${software.name}</h2>
                    <div class="tags">
                        <span class="tag">${software.pricingModel}</span>
                        <span class="tag">${software.deployment[0]}</span>
                    </div>
                    <p>${software.tagline}</p>
                    <div class="card-footer">
                        <a href="${softwarePathPrefix}${software.slug}.html">View Details &rarr;</a>
                    </div>
                </article>
            `).join('') : '<p>No software found for this category.</p>'}
        </div>
    </main>

    <footer>
        <p>&copy; ${new Date().getFullYear()} PlantMaintHQ. All rights reserved.</p>
    </footer>
</body>
</html>
`;

// Safely update the existing sitemap.xml with new URLs
function updateSitemap(newUrls: string[]) {
  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  
  if (!fs.existsSync(sitemapPath)) {
    console.warn('sitemap.xml not found in dist/. Skipping sitemap update.');
    return;
  }

  let sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
  let addedCount = 0;
  const today = new Date().toISOString().split('T')[0];

  newUrls.forEach(url => {
    // Check if the URL already exists in the sitemap
    if (!sitemapContent.includes(`<loc>${url}</loc>`)) {
      const newEntry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      
      // Insert the new entry right before the closing </urlset> tag
      sitemapContent = sitemapContent.replace('</urlset>', `${newEntry}</urlset>`);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    fs.writeFileSync(sitemapPath, sitemapContent);
    console.log(`Added ${addedCount} new URLs to sitemap.xml.`);
  } else {
    console.log('sitemap.xml is already up to date.');
  }
}

// Build Process
function build() {
  console.log('Starting PlantMaintHQ build process...');
  
  try {
    ensureDirectories();
    const generatedUrls: string[] = [];

    // 1. Generate individual software pages
    cmmsSoftware.forEach(software => {
      const html = generateSoftwarePage(software, cmmsSoftware);
      fs.writeFileSync(path.join(SOFTWARE_DIR, `${software.slug}.html`), html);
      generatedUrls.push(`${BASE_URL}/software/${software.slug}`);
    });
    console.log(`Generated ${cmmsSoftware.length} software detail pages.`);

    // 2. Generate index page
    const indexHtml = generateIndexPage(cmmsSoftware, categories);
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
    console.log('Generated index.html directory page.');

    // 3. Generate Alternatives pages
    cmmsSoftware.forEach(software => {
      const html = generateAlternativesPage(software, cmmsSoftware);
      fs.writeFileSync(path.join(ALTERNATIVES_DIR, `${software.slug}.html`), html);
      generatedUrls.push(`${BASE_URL}/alternatives/${software.slug}`);
    });
    console.log(`Generated ${cmmsSoftware.length} alternatives pages.`);

    // 4. Generate Comparison pages (All combinations)
    let compareCount = 0;
    for (let i = 0; i < cmmsSoftware.length; i++) {
      for (let j = 0; j < cmmsSoftware.length; j++) {
        if (i === j) continue; // Don't compare a software to itself
        
        const softwareA = cmmsSoftware[i];
        const softwareB = cmmsSoftware[j];
        
        const html = generateComparisonPage(softwareA, softwareB);
        fs.writeFileSync(path.join(COMPARE_DIR, `${softwareA.slug}-vs-${softwareB.slug}.html`), html);
        generatedUrls.push(`${BASE_URL}/compare/${softwareA.slug}-vs-${softwareB.slug}`);
        compareCount++;
      }
    }
    console.log(`Generated ${compareCount} comparison pages.`);

    // 5. Generate Category & Pricing Pages
    categories.forEach(category => {
      const filteredSoftware = cmmsSoftware.filter(category.filter);
      const isNested = category.slug.includes('/');
      const backLink = isNested ? '../index.html' : 'index.html';
      const softwarePathPrefix = isNested ? '../software/' : 'software/';
      
      const html = generateCategoryPage(category.title, category.desc, filteredSoftware, backLink, softwarePathPrefix, category.slug);
      
      const filePath = path.join(DIST_DIR, `${category.slug}.html`);
      
      // Ensure nested directories exist (e.g., dist/pricing/)
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(filePath, html);
      generatedUrls.push(`${BASE_URL}/${category.slug}`);
    });
    console.log(`Generated ${categories.length} category and pricing pages.`);

    // 6. Update sitemap.xml
    updateSitemap(generatedUrls);

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed with error:', error);
    process.exit(1); // Ensure CI/CD pipelines fail if the build crashes
  }
}

build();
