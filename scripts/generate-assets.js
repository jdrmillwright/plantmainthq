const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DIST_DIR = path.resolve(__dirname, '../dist');
const ROOT_DIR = path.resolve(__dirname, '..');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 1. Blue Gear SVG Brand Logo
const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="dropShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Rounded App Icon Background -->
  <rect width="512" height="512" rx="112" fill="url(#pGrad)"/>

  <!-- Subtle Inner Border Highlight -->
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="#60a5fa" stroke-width="4" stroke-opacity="0.3"/>

  <!-- Precision Industrial Gear & Wrench Symbol -->
  <g filter="url(#dropShadow)" transform="translate(256, 256)">
    <!-- Rotating Cog Wheel Outer Teeth -->
    <path d="
      M -34, -188 L 34, -188 L 44, -145 L 88, -135 L 126, -164 L 174, -126 L 145, -88 L 155, -44 L 198, -34 L 198, 34 L 155, 44 L 145, 88 L 174, 126 L 126, 174 L 88, 145 L 44, 155 L 34, 198 L -34, 198 L -44, 155 L -88, 145 L -126, 174 L -174, 126 L -145, 88 L -155, 44 L -198, 34 L -198, -34 L -155, -44 L -145, -88 L -174, -126 L -126, -174 L -88, -145 L -44, -155 Z
    " fill="#ffffff" opacity="0.95"/>

    <!-- Inner Cog Cutout Circle -->
    <circle cx="0" cy="0" r="105" fill="#0f172a"/>

    <!-- Prominent Millwright 'P' Monogram + Reliability Pulse Accent -->
    <path d="M -54, -72 L 0, -72 C 38, -72 65, -52 65, -18 C 65, 16 38, 36 0, 36 L -20, 36 L -20, 75 L -54, 75 Z M -20, 4 L -2, 4 C 18, 4 30, -5 30, -18 C 30, -31 18, -40 -2, -40 L -20, -40 Z" fill="url(#accentGrad)"/>

    <!-- Golden Reliability Metric Indicator Dot -->
    <circle cx="50" cy="52" r="15" fill="#f59e0b"/>
  </g>
</svg>`;

// Write public/favicon.svg
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), svgLogo.trim(), 'utf-8');
fs.writeFileSync(path.join(ROOT_DIR, 'favicon.svg'), svgLogo.trim(), 'utf-8');
console.log('✅ Generated public/favicon.svg');

// 2. Generate PNG Icons (180x180, 192x192, 512x512, 16x16, 32x32, 48x48)
async function generateIcons() {
  const svgBuffer = Buffer.from(svgLogo);

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
  console.log('✅ Generated public/icon-512.png (512x512)');

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  console.log('✅ Generated public/icon-192.png (192x192)');

  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✅ Generated public/apple-touch-icon.png (180x180)');

  // Temporary PNGs for ICO generation
  const p16 = path.join(PUBLIC_DIR, 'icon-16.png');
  const p32 = path.join(PUBLIC_DIR, 'icon-32.png');
  const p48 = path.join(PUBLIC_DIR, 'icon-48.png');

  await sharp(svgBuffer).resize(16, 16).png().toFile(p16);
  await sharp(svgBuffer).resize(32, 32).png().toFile(p32);
  await sharp(svgBuffer).resize(48, 48).png().toFile(p48);

  // Use ImageMagick to create a standard multi-resolution ICO file
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  try {
    execSync(`convert "${p16}" "${p32}" "${p48}" "${icoPath}"`);
    console.log('✅ Generated public/favicon.ico (Multi-resolution: 16x16, 32x32, 48x48)');
  } catch (err) {
    console.warn('Falling back to 32x32 ICO:', err.message);
    execSync(`convert "${p32}" "${icoPath}"`);
  }

  // Cleanup temporary icon sizes
  if (fs.existsSync(p16)) fs.unlinkSync(p16);
  if (fs.existsSync(p32)) fs.unlinkSync(p32);
  if (fs.existsSync(p48)) fs.unlinkSync(p48);

  // 3. Web App Manifest
  const webManifest = {
    name: 'PlantMaintHQ',
    short_name: 'PlantMaint',
    start_url: '/',
    theme_color: '#1e3a8a',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };

  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'site.webmanifest'),
    JSON.stringify(webManifest, null, 2),
    'utf-8'
  );
  console.log('✅ Generated public/site.webmanifest');

  // 4. Social Sharing 1200x630 Open Graph / Twitter Banner (public/og-image.png)
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091326"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.75" stroke-opacity="0.3"/>
    </pattern>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Deep Industrial Canvas -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Ambient Glow Behind Gear -->
  <circle cx="210" cy="315" r="180" fill="#2563eb" opacity="0.2" filter="url(#glow)"/>

  <!-- Main Showcase Container Border -->
  <rect x="40" y="40" width="1120" height="550" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5"/>

  <!-- Brand Badge (Top Right) -->
  <rect x="880" y="70" width="240" height="38" rx="19" fill="#1e3a8a" stroke="#60a5fa" stroke-width="1"/>
  <text x="1000" y="94" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#93c5fd" text-anchor="middle" letter-spacing="1.5">VERIFIED DIRECTORY</text>

  <!-- Blue Gear Logo Badge (Left Side: 210, 315) -->
  <g transform="translate(200, 315)">
    <!-- Rounded Outer Badge -->
    <rect x="-110" y="-110" width="220" height="220" rx="48" fill="#0f172a" stroke="#3b82f6" stroke-width="3"/>

    <!-- Gear Teeth & Structure -->
    <g transform="scale(0.48)">
      <path d="
        M -34, -188 L 34, -188 L 44, -145 L 88, -135 L 126, -164 L 174, -126 L 145, -88 L 155, -44 L 198, -34 L 198, 34 L 155, 44 L 145, 88 L 174, 126 L 126, 174 L 88, 145 L 44, 155 L 34, 198 L -34, 198 L -44, 155 L -88, 145 L -126, 174 L -174, 126 L -145, 88 L -155, 44 L -198, 34 L -198, -34 L -155, -44 L -145, -88 L -174, -126 L -126, -174 L -88, -145 L -44, -155 Z
      " fill="#ffffff" opacity="0.95"/>
      <circle cx="0" cy="0" r="105" fill="#0f172a"/>
      <path d="M -54, -72 L 0, -72 C 38, -72 65, -52 65, -18 C 65, 16 38, 36 0, 36 L -20, 36 L -20, 75 L -54, 75 Z M -20, 4 L -2, 4 C 18, 4 30, -5 30, -18 C 30, -31 18, -40 -2, -40 L -20, -40 Z" fill="url(#gearGrad)"/>
      <circle cx="50" cy="52" r="16" fill="#f59e0b"/>
    </g>
  </g>

  <!-- Typography & Text Content (Right Side) -->
  <g transform="translate(370, 0)">
    <!-- Eyebrow / Category -->
    <text x="0" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#38bdf8" letter-spacing="2">INDUSTRIAL MAINTENANCE &amp; RELIABILITY</text>

    <!-- Main Title -->
    <text x="0" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="58" font-weight="800" fill="#ffffff" letter-spacing="-1">PlantMaint<tspan fill="#60a5fa">HQ</tspan></text>

    <!-- Tagline (Exact user requirement) -->
    <text x="0" y="305" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="600" fill="#f1f5f9">The Industrial CMMS Directory - Compare 106 Systems</text>

    <!-- Descriptive Subtext -->
    <text x="0" y="355" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">Unbiased side-by-side technical benchmarks, pricing models, &amp; technician usability scores.</text>

    <!-- 3 Key Metric Badges -->
    <g transform="translate(0, 415)">
      <!-- Badge 1: 106 Systems -->
      <rect x="0" y="0" width="220" height="52" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="24" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#34d399">✓ 106 CMMS Systems</text>

      <!-- Badge 2: Pricing Transparency -->
      <rect x="235" y="0" width="230" height="52" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="255" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#60a5fa">✓ Transparent Pricing</text>

      <!-- Badge 3: 5,800 Comparisons -->
      <rect x="480" y="0" width="240" height="52" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="500" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#f59e0b">✓ 5,800+ Comparisons</text>
    </g>

    <!-- Domain Footer -->
    <text x="0" y="525" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#64748b">https://plantmainthq.com</text>
  </g>
</svg>`;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'og-image.png'));
  console.log('✅ Generated public/og-image.png (1200x630 high-res Open Graph banner)');

  // Duplicate key assets into ROOT and DIST for direct resolution
  const assetsToSync = [
    'favicon.svg',
    'favicon.ico',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
    'og-image.png',
    'site.webmanifest'
  ];

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  for (const file of assetsToSync) {
    const src = path.join(PUBLIC_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, file));
      fs.copyFileSync(src, path.join(ROOT_DIR, file));
    }
  }
  console.log('✅ Synchronized all assets into dist/ and workspace root');
}

generateIcons().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
