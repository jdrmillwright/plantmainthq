"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const software_1 = require("./data/software");
const criteria_1 = require("./data/criteria");
const seo_1 = require("./lib/seo");
function main() {
    console.log('=====================================================');
    console.log('  PlantMaintHQ.com - Programmatic CMMS Directory Engine');
    console.log('=====================================================\n');
    console.log(`[+] Seed Software Indexed: ${software_1.CMMS_DATABASE.length} systems`);
    software_1.CMMS_DATABASE.forEach((sw) => {
        const priceDisplay = typeof sw.pricing.startingPricePerUserMonth === 'number'
            ? `$${sw.pricing.startingPricePerUserMonth}/user/mo`
            : sw.pricing.startingPricePerUserMonth;
        console.log(`  - ${sw.name} (Rating: ${sw.overallRating}/5.0, Starts at: ${priceDisplay})`);
    });
    console.log(`\n[+] Evaluation Criteria Loaded: ${criteria_1.EVALUATION_CRITERIA.length} dimensions`);
    console.log(`[+] Industry Verticals Configured: ${Object.keys(criteria_1.INDUSTRY_CONFIGURATIONS).length} industries\n`);
    const routes = (0, seo_1.getAllProgrammaticRoutes)();
    console.log(`[+] Programmatic SEO Route Matrix Generated: ${routes.length} pages total`);
    // Breakdown by page type
    const typeCounts = routes.reduce((acc, route) => {
        acc[route.pageType] = (acc[route.pageType] || 0) + 1;
        return acc;
    }, {});
    console.log('\n--- Route Matrix Distribution ---');
    Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  - [${type}]: ${count} pages`);
    });
    console.log('\n--- Sample Programmatic Landing Pages ---');
    routes.slice(0, 10).forEach((route, index) => {
        console.log(`\n${index + 1}. URL: /${route.slug}`);
        console.log(`   Type: [${route.pageType}]`);
        console.log(`   Title: "${route.title}"`);
        console.log(`   Target Keywords: ${route.targetKeywords.slice(0, 2).join(', ')}`);
    });
    console.log('\n=====================================================');
    console.log(`  Directory ready. Build with 'npm run build'`);
    console.log('=====================================================');
}
main();
