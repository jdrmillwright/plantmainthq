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
const DIST_DIR = path.join(__dirname, '../../dist');
const SOFTWARE_DIR = path.join(DIST_DIR, 'software');
// Ensure directories exist
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}
if (!fs.existsSync(SOFTWARE_DIR)) {
    fs.mkdirSync(SOFTWARE_DIR, { recursive: true });
}
// HTML Template for individual software pages
const generateSoftwarePage = (software) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${software.name} - CMMS Software Review & Details | PlantMaintHQ</title>
    <meta name="description" content="Comprehensive review and details for ${software.name}. ${software.tagline} Discover features, pricing, and pros/cons for industrial maintenance.">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 2rem; }
        header { border-bottom: 2px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
        h1 { color: #1a365d; margin-bottom: 0.5rem; }
        .tagline { font-size: 1.2rem; color: #4a5568; font-style: italic; }
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: #f7fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        .meta-item strong { display: block; color: #2d3748; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .section { margin-bottom: 2rem; }
        h2 { color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
        ul { padding-left: 1.5rem; }
        li { margin-bottom: 0.5rem; }
        .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .pros h3 { color: #38a169; }
        .cons h3 { color: #e53e3e; }
        .btn { display: inline-block; background: #3182ce; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; font-weight: bold; }
        .btn:hover { background: #2b6cb0; }
        .nav { margin-bottom: 2rem; }
        .nav a { color: #3182ce; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="nav">
        <a href="../index.html">&larr; Back to Directory</a>
    </div>
    
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
    </div>

    <div class="section">
        <h2>Overview</h2>
        <p>${software.description}</p>
        <br>
        <a href="${software.website}" target="_blank" rel="noopener noreferrer" class="btn">Visit Official Website</a>
    </div>

    <div class="section">
        <h2>Key Features</h2>
        <ul>
            ${software.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Target Industries</h2>
        <ul>
            ${software.targetIndustries.map(industry => `<li>${industry}</li>`).join('')}
        </ul>
    </div>

    <div class="section pros-cons">
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
    </div>
</body>
</html>
`;
// HTML Template for the index page
const generateIndexPage = (softwareList) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlantMaintHQ - CMMS & EAM Software Directory</title>
    <meta name="description" content="The ultimate programmatic SEO directory for industrial maintenance mechanics, millwrights, and plant operations to find CMMS software.">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 2rem; background-color: #f7fafc; }
        header { text-align: center; margin-bottom: 3rem; }
        h1 { color: #1a365d; font-size: 2.5rem; margin-bottom: 0.5rem; }
        p.subtitle { color: #4a5568; font-size: 1.2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: transform 0.2s; border: 1px solid #e2e8f0; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
        .card h2 { margin-top: 0; color: #2b6cb0; font-size: 1.4rem; }
        .card p { color: #4a5568; font-size: 0.95rem; margin-bottom: 1.5rem; }
        .card a { display: inline-block; background: #3182ce; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 0.9rem; }
        .card a:hover { background: #2b6cb0; }
        .tags { margin-bottom: 1rem; }
        .tag { display: inline-block; background: #edf2f7; color: #4a5568; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; margin-right: 0.5rem; margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <header>
        <h1>PlantMaintHQ</h1>
        <p class="subtitle">The Ultimate CMMS & EAM Software Directory for Industrial Maintenance</p>
    </header>

    <div class="grid">
        ${softwareList.map(software => `
            <div class="card">
                <h2>${software.name}</h2>
                <div class="tags">
                    <span class="tag">${software.pricingModel}</span>
                    <span class="tag">${software.deployment[0]}</span>
                </div>
                <p>${software.tagline}</p>
                <a href="software/${software.slug}.html">View Details &rarr;</a>
            </div>
        `).join('')}
    </div>
</body>
</html>
`;
// Build Process
console.log('Starting PlantMaintHQ build process...');
// 1. Generate individual software pages
software_1.cmmsSoftware.forEach(software => {
    const html = generateSoftwarePage(software);
    const filePath = path.join(SOFTWARE_DIR, `${software.slug}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`Generated page for: ${software.name}`);
});
// 2. Generate index page
const indexHtml = generateIndexPage(software_1.cmmsSoftware);
const indexFilePath = path.join(DIST_DIR, 'index.html');
fs.writeFileSync(indexFilePath, indexHtml);
console.log('Generated index.html');
console.log(`Build complete! Generated ${software_1.cmmsSoftware.length} software pages.`);
