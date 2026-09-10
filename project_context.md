# PlantMaintHQ

## Project Overview
PlantMaintHQ is a programmatic SEO website and comprehensive software directory specifically designed for industrial maintenance mechanics, millwrights, and plant operations professionals. The platform serves as the ultimate resource for discovering, comparing, and selecting Computerized Maintenance Management System (CMMS) and Enterprise Asset Management (EAM) software.

## Architecture
The project is built using a static site generation (SSG) approach to maximize SEO performance, page load speed, and reliability. 

- **Data Layer:** A centralized TypeScript database (`src/data/software.ts`) containing exhaustive details on CMMS platforms.
- **Type System:** Strict TypeScript interfaces (`src/types/cmms.ts`) ensure data consistency across the directory.
- **Build System:** A custom Node.js build script (`src/scripts/build.ts`) that iterates through the database and programmatically generates highly optimized, static HTML pages for every software product, alongside a master directory index.

## Target Audience
- Maintenance Managers
- Reliability Engineers
- Millwrights
- Plant Managers
- Industrial Mechanics
- Facilities Directors

## SEO Strategy
The programmatic SEO strategy relies on generating dedicated, content-rich pages for every CMMS product. Each page includes targeted meta tags, semantic HTML structuring (H1, H2, lists), and keyword-rich descriptions tailored to industrial maintenance search intents.
