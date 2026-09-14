export type PricingModel = 
  | 'Free' 
  | 'Freemium' 
  | 'Subscription' 
  | 'Enterprise' 
  | 'Custom Quote';

export type DeploymentType = 
  | 'Cloud/SaaS'
  | 'Cloud / SaaS' 
  | 'On-Premise' 
  | 'Hybrid'
  | 'Mobile-First';

export type CompanySize = 'Small (1-50)' | 'Mid-Market (51-500)' | 'Enterprise (500+)';

export type IndustryVertical =
  | 'Manufacturing'
  | 'Food & Beverage'
  | 'Oil & Gas'
  | 'Facilities & Property'
  | 'Fleet & Heavy Equipment'
  | 'Healthcare & Pharmaceuticals'
  | 'Utilities & Energy'
  | 'Packaging & Logistics';

export interface PricingPlan {
  name: string;
  pricePerUserMonth: number | 'Custom' | 'Free';
  billingCycle: 'monthly' | 'annual' | 'contact_sales';
  minUsers?: number;
  highlightedFeatures: string[];
}

export interface FeatureRatings {
  workOrderManagement: number; // 1-10
  preventiveMaintenance: number; // 1-10
  assetTrackingAndHierarchy: number; // 1-10
  mroInventoryManagement: number; // 1-10
  mobileAppUsability: number; // 1-10
  predictiveMaintenanceAndIot: number; // 1-10
  reportingAndAnalytics: number; // 1-10
  vendorAndContractorManagement: number; // 1-10
  complianceAndAuditReadiness: number; // 1-10
}

export interface CoreCapability {
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CMMSSoftware {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  tagline: string;
  websiteUrl: string;
  affiliateUrl?: string;
  yearFounded: number;
  overview: string;
  implementationTime: string;
  customerSupport: string;
  deploymentTypes: DeploymentType[];
  supportedIndustries: (IndustryVertical | string)[];
  targetCompanySizes: (CompanySize | string)[];
  overallRating: number; // e.g. 4.8 / 5.0
  reviewCount: number;
  pricing: {
    hasFreeTrial: boolean;
    hasFreeTier: boolean;
    startingPricePerUserMonth: number | 'Custom' | 'Free';
    plans: PricingPlan[];
  };
  features: FeatureRatings;
  coreCapabilities: CoreCapability[];
  pros: string[];
  cons: string[];
  keyIntegrations: string[];
  bestFor: string;
  editorsVerdict?: string;
  faqs?: FAQItem[];
  pricingTiers?: string[];
  technicianUsabilityScore?: number;
  featureBenchmarks?: Record<string, string>;
}

export type SeoPageType =
  | 'vs_comparison'
  | 'industry_guide'
  | 'software_alternatives'
  | 'software_profile'
  | 'feature_deep_dive'
  | 'size_guide'
  | 'pricing_guide';

export interface GeneratedSeoPage {
  slug: string;
  pageType: SeoPageType;
  title: string;
  metaDescription: string;
  h1: string;
  targetKeywords: string[];
  canonicalUrl: string;
  relatedEntities: string[];
}

export interface CMMSProduct {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  website: string;
  foundedYear: number;
  pricingModel: PricingModel;
  deployment: DeploymentType[];
  features: string[];
  targetIndustries: string[];
  pros: string[];
  cons: string[];
  pricingTiers?: string[];
  technicianUsabilityScore?: number;
  featureBenchmarks?: Record<string, string>;
}

