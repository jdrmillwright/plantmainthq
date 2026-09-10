"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVsComparisonRoutes = generateVsComparisonRoutes;
exports.generateIndustryRoutes = generateIndustryRoutes;
exports.generateAlternativeRoutes = generateAlternativeRoutes;
exports.generateSoftwareProfileRoutes = generateSoftwareProfileRoutes;
exports.generateFeatureDeepDiveRoutes = generateFeatureDeepDiveRoutes;
exports.generateCompanySizeRoutes = generateCompanySizeRoutes;
exports.generatePricingRoutes = generatePricingRoutes;
exports.getAllProgrammaticRoutes = getAllProgrammaticRoutes;
const software_1 = require("../data/software");
const criteria_1 = require("../data/criteria");
const DOMAIN = 'https://plantmainthq.com';
/**
 * Generates Head-to-Head Comparison Programmatic Pages (e.g. /compare/limble-cmms-vs-maintainx)
 */
function generateVsComparisonRoutes() {
    const pages = [];
    const softwareList = software_1.CMMS_DATABASE;
    for (let i = 0; i < softwareList.length; i++) {
        for (let j = i + 1; j < softwareList.length; j++) {
            const a = softwareList[i];
            const b = softwareList[j];
            const slug = `compare/${a.slug}-vs-${b.slug}`;
            const title = `${a.name} vs ${b.name} Comparison (2025 Review & Pricing) | PlantMaintHQ`;
            const metaDescription = `Comparing ${a.name} vs ${b.name}? Discover feature differences, pricing models, mobile usability, and find which CMMS fits your plant best.`;
            const h1 = `${a.name} vs ${b.name}: In-Depth CMMS Software Comparison`;
            pages.push({
                slug,
                pageType: 'vs_comparison',
                title,
                metaDescription,
                h1,
                targetKeywords: [
                    `${a.name.toLowerCase()} vs ${b.name.toLowerCase()}`,
                    `${b.name.toLowerCase()} vs ${a.name.toLowerCase()}`,
                    `${a.name.toLowerCase()} alternative`,
                    `${b.name.toLowerCase()} comparison`,
                ],
                canonicalUrl: `${DOMAIN}/${slug}`,
                relatedEntities: [a.id, b.id],
            });
        }
    }
    return pages;
}
/**
 * Generates Industry-Specific Buyer Guide Programmatic Pages (e.g. /best-cmms-for-manufacturing)
 */
function generateIndustryRoutes() {
    const pages = [];
    const industries = Object.keys(criteria_1.INDUSTRY_CONFIGURATIONS);
    for (const industry of industries) {
        const slugKey = industry.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const slug = `best-cmms-for-${slugKey}`;
        const config = criteria_1.INDUSTRY_CONFIGURATIONS[industry];
        const matchingSoftware = software_1.CMMS_DATABASE.filter((s) => s.supportedIndustries.includes(industry));
        const title = `Top ${matchingSoftware.length} CMMS Software for ${industry} in 2025 | PlantMaintHQ`;
        const metaDescription = `Compare the best CMMS and maintenance management software for ${industry}. Evaluated on ${config.primaryKpi}.`;
        const h1 = `Best ${matchingSoftware.length} CMMS Software for ${industry} Operations`;
        pages.push({
            slug,
            pageType: 'industry_guide',
            title,
            metaDescription,
            h1,
            targetKeywords: config.focusKeywords,
            canonicalUrl: `${DOMAIN}/${slug}`,
            relatedEntities: matchingSoftware.map((s) => s.id),
        });
    }
    return pages;
}
/**
 * Generates Alternatives & Competitors Programmatic Pages (e.g. /alternatives/ibm-maximo)
 */
function generateAlternativeRoutes() {
    return software_1.CMMS_DATABASE.map((software) => {
        const alternatives = software_1.CMMS_DATABASE.filter((s) => s.id !== software.id).map((s) => s.id);
        const slug = `alternatives/${software.slug}`;
        const title = `Top ${alternatives.length} ${software.name} Alternatives & Competitors (2025) | PlantMaintHQ`;
        const metaDescription = `Looking for alternatives to ${software.name}? Compare top-rated CMMS competitors, pricing, ease-of-use ratings, and feature breakdowns.`;
        const h1 = `Top ${alternatives.length} ${software.name} Competitors & Alternatives`;
        return {
            slug,
            pageType: 'software_alternatives',
            title,
            metaDescription,
            h1,
            targetKeywords: [
                `${software.name.toLowerCase()} alternatives`,
                `competitors to ${software.name.toLowerCase()}`,
                `software like ${software.name.toLowerCase()}`,
            ],
            canonicalUrl: `${DOMAIN}/${slug}`,
            relatedEntities: alternatives,
        };
    });
}
/**
 * Generates Individual Software Profile & Review Pages (e.g. /software/limble-cmms)
 */
function generateSoftwareProfileRoutes() {
    return software_1.CMMS_DATABASE.map((software) => {
        const slug = `software/${software.slug}`;
        const title = `${software.name} Review & Pricing Guide (2025) | PlantMaintHQ`;
        const metaDescription = `Independent review of ${software.name}. Explore features, starting pricing ($${software.pricing.startingPricePerUserMonth}/mo), technician usability ratings, and pros & cons.`;
        const h1 = `${software.name}: 2025 Comprehensive CMMS Review`;
        return {
            slug,
            pageType: 'software_profile',
            title,
            metaDescription,
            h1,
            targetKeywords: [
                `${software.name.toLowerCase()} review`,
                `${software.name.toLowerCase()} pricing`,
                `${software.name.toLowerCase()} cmms`,
                `how much does ${software.name.toLowerCase()} cost`,
            ],
            canonicalUrl: `${DOMAIN}/${slug}`,
            relatedEntities: [software.id],
        };
    });
}
/**
 * Generates Feature Deep-Dive Pages (e.g. /best-cmms-for-mro-inventory-management)
 */
function generateFeatureDeepDiveRoutes() {
    return criteria_1.EVALUATION_CRITERIA.map((criterion) => {
        const slugKey = criterion.id.replace(/([A-Z])/g, '-$1').toLowerCase();
        const slug = `best-cmms-for-${slugKey}`;
        // Sort software by highest rating in this specific criterion
        const sorted = [...software_1.CMMS_DATABASE].sort((a, b) => {
            const scoreA = a.features[criterion.id] ?? 0;
            const scoreB = b.features[criterion.id] ?? 0;
            return scoreB - scoreA;
        });
        const title = `Top ${sorted.length} CMMS for ${criterion.name} in 2025 | PlantMaintHQ`;
        const metaDescription = `Rankings and evaluation of maintenance software with the highest scores in ${criterion.name}. ${criterion.description}`;
        const h1 = `Top ${sorted.length} CMMS Platforms Ranked for ${criterion.name}`;
        return {
            slug,
            pageType: 'feature_deep_dive',
            title,
            metaDescription,
            h1,
            targetKeywords: [
                `best cmms for ${criterion.name.toLowerCase()}`,
                `${criterion.name.toLowerCase()} software`,
                `maintenance software ${criterion.id.toLowerCase()}`,
            ],
            canonicalUrl: `${DOMAIN}/${slug}`,
            relatedEntities: sorted.map((s) => s.id),
        };
    });
}
/**
 * Generates Company Size Buyer Guides (e.g. /best-cmms-for-small-business)
 */
function generateCompanySizeRoutes() {
    const sizes = [
        { size: 'Small (1-50)', slugKey: 'small-teams', label: 'Small Maintenance Teams & Plants (1-50 Users)' },
        { size: 'Mid-Market (51-500)', slugKey: 'mid-market-plants', label: 'Mid-Market Plants & Multi-Facility Operations' },
        { size: 'Enterprise (500+)', slugKey: 'enterprise', label: 'Large Enterprise & Global Industrial Facilities' },
    ];
    return sizes.map(({ size, slugKey, label }) => {
        const slug = `best-cmms-for-${slugKey}`;
        const matching = software_1.CMMS_DATABASE.filter((s) => s.targetCompanySizes.includes(size));
        const title = `Top ${matching.length} Best CMMS for ${label} (2025) | PlantMaintHQ`;
        const metaDescription = `Discover the top maintenance management systems tailored for ${label}. Compare pricing tiers, implementation speeds, and scalability.`;
        const h1 = `Best ${matching.length} CMMS Platforms for ${label}`;
        return {
            slug,
            pageType: 'size_guide',
            title,
            metaDescription,
            h1,
            targetKeywords: [
                `cmms for ${slugKey.replace('-', ' ')}`,
                `maintenance software for ${slugKey.replace('-', ' ')}`,
                `best cmms ${slugKey.replace('-', ' ')}`,
            ],
            canonicalUrl: `${DOMAIN}/${slug}`,
            relatedEntities: matching.map((s) => s.id),
        };
    });
}
/**
 * Generates Pricing & Budget Focused Guides (e.g. /pricing/free-cmms-software)
 */
function generatePricingRoutes() {
    const freeTierVendors = software_1.CMMS_DATABASE.filter((s) => s.pricing.hasFreeTier);
    const budgetVendors = software_1.CMMS_DATABASE.filter((s) => typeof s.pricing.startingPricePerUserMonth === 'number' && s.pricing.startingPricePerUserMonth <= 45);
    return [
        {
            slug: 'pricing/best-free-cmms-software',
            pageType: 'pricing_guide',
            title: `Top ${freeTierVendors.length} Free CMMS Software Options in 2025 | PlantMaintHQ`,
            metaDescription: 'Explore the top completely free CMMS platforms and free tiers for maintenance operations. No credit card required.',
            h1: `Best ${freeTierVendors.length} 100% Free CMMS Software Tools for Maintenance Teams`,
            targetKeywords: ['free cmms software', 'free maintenance management software', 'open source cmms', 'best free cmms'],
            canonicalUrl: `${DOMAIN}/pricing/best-free-cmms-software`,
            relatedEntities: freeTierVendors.map((s) => s.id),
        },
        {
            slug: 'pricing/affordable-cmms-under-50',
            pageType: 'pricing_guide',
            title: `Top ${budgetVendors.length} Affordable CMMS Under $50/User/Month (2025) | PlantMaintHQ`,
            metaDescription: 'Budget-friendly CMMS software systems starting at or under $50 per user per month. Compare features without overspending.',
            h1: `Top ${budgetVendors.length} Affordable CMMS Software Under $50/User/Mo`,
            targetKeywords: ['cheap cmms', 'affordable cmms software', 'low cost maintenance software', 'cmms pricing comparison'],
            canonicalUrl: `${DOMAIN}/pricing/affordable-cmms-under-50`,
            relatedEntities: budgetVendors.map((s) => s.id),
        },
    ];
}
/**
 * Compiles all programmatic SEO routes across the entire directory
 */
function getAllProgrammaticRoutes() {
    return [
        ...generateSoftwareProfileRoutes(),
        ...generateVsComparisonRoutes(),
        ...generateIndustryRoutes(),
        ...generateAlternativeRoutes(),
        ...generateFeatureDeepDiveRoutes(),
        ...generateCompanySizeRoutes(),
        ...generatePricingRoutes(),
    ];
}
