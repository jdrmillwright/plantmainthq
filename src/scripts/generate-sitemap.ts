/**
 * generate-sitemap.ts
 * 
 * Dynamically generates a sitemap.xml file containing the homepage and the distinct URLs
 * for all 106 CMMS products in src/data/software.ts, and generates a robots.txt file
 * that allows all crawling and points to https://plantmainthq.com/sitemap.xml.
 */

import * as fs from 'fs';
import * as path from 'path';
import { cmmsSoftware } from '../data/software';

export const BASE_URL = 'https://plantmainthq.com';
export const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
export const DIST_DIR = path.resolve(process.cwd(), 'dist');

/**
 * Generates the XML content for sitemap.xml
 */
export function generateSitemapXml(baseUrl: string = BASE_URL): { xml: string; urlsCount: number } {
  const today = new Date().toISOString().split('T')[0];
  const urlEntries: string[] = [];

  // 1. Homepage
  urlEntries.push(`  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  // 2. Distinct URLs for all 106 CMMS products in software.ts
  // Ensure unique slugs
  const seenSlugs = new Set<string>();
  for (const product of cmmsSoftware) {
    if (!product.slug || seenSlugs.has(product.slug)) {
      continue;
    }
    seenSlugs.add(product.slug);

    urlEntries.push(`  <url>
    <loc>${baseUrl}/software/${product.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

  return { xml, urlsCount: urlEntries.length };
}

/**
 * Generates the robots.txt content allowing all crawling and pointing to sitemap.xml
 */
export function generateRobotsTxt(sitemapUrl: string = SITEMAP_URL): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}

/**
 * Writes sitemap.xml and robots.txt to the specified output directory
 */
export function writeSitemapAndRobots(outputDir: string = DIST_DIR): {
  sitemapPath: string;
  robotsPath: string;
  totalUrls: number;
} {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const { xml: sitemapXml, urlsCount } = generateSitemapXml(BASE_URL);
  const robotsTxt = generateRobotsTxt(SITEMAP_URL);

  const sitemapPath = path.join(outputDir, 'sitemap.xml');
  const robotsPath = path.join(outputDir, 'robots.txt');

  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');

  console.log(`🗺️  Dynamic Sitemap generated successfully:`);
  console.log(`   - Output: ${sitemapPath}`);
  console.log(`   - Total URLs: ${urlsCount} (Homepage + ${urlsCount - 1} distinct CMMS products)`);
  console.log(`🤖 Robots.txt generated successfully:`);
  console.log(`   - Output: ${robotsPath}`);
  console.log(`   - Crawling policy: Allow all ('Allow: /')`);
  console.log(`   - Sitemap reference: ${SITEMAP_URL}`);

  return { sitemapPath, robotsPath, totalUrls: urlsCount };
}

// Auto-run if executed directly
if (require.main === module) {
  writeSitemapAndRobots(DIST_DIR);
}
