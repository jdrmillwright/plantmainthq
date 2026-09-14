import { cmmsSoftware } from './software';
import {
  CMMSSoftware,
  CMMSProduct,
  DeploymentType,
  CompanySize,
  IndustryVertical,
  PricingPlan,
  FeatureRatings,
  CoreCapability,
  FAQItem,
} from '../types/cmms';

function mapProductToSoftware(prod: CMMSProduct): CMMSSoftware {
  const isCloud = prod.deployment.some(d => d.toLowerCase().includes('cloud') || d.toLowerCase().includes('saas'));
  const isEnterprise = prod.pricingModel === 'Enterprise' || prod.pricingModel === 'Custom Quote';
  const isFreeOrFreemium = prod.pricingModel === 'Free' || prod.pricingModel === 'Freemium';
  
  const usabilityScore = prod.technicianUsabilityScore || 8.5;
  const overallRating = Math.min(5.0, Math.max(4.1, Math.round((usabilityScore / 2) * 10) / 10));
  const reviewCount = Math.max(85, (2026 - (prod.foundedYear || 2015)) * 95 + 40);

  const deploymentTypes: DeploymentType[] = prod.deployment.map(d => {
    if (d.includes('Cloud') || d.includes('SaaS')) return 'Cloud/SaaS';
    if (d.includes('On-Premise')) return 'On-Premise';
    if (d.includes('Hybrid')) return 'Hybrid';
    return 'Cloud/SaaS';
  });
  if (prod.features.some(f => f.toLowerCase().includes('mobile') || f.toLowerCase().includes('chat') || f.toLowerCase().includes('sop')) || usabilityScore >= 8.5) {
    if (!deploymentTypes.includes('Mobile-First')) {
      deploymentTypes.push('Mobile-First');
    }
  }

  const supportedIndustries = (prod.targetIndustries.length > 0
    ? prod.targetIndustries
    : ['Manufacturing', 'Facilities & Property', 'Utilities & Energy']) as (IndustryVertical | string)[];

  const targetCompanySizes: CompanySize[] = isEnterprise
    ? ['Mid-Market (51-500)', 'Enterprise (500+)']
    : isFreeOrFreemium
    ? ['Small (1-50)', 'Mid-Market (51-500)']
    : ['Small (1-50)', 'Mid-Market (51-500)', 'Enterprise (500+)'];

  let startingPrice: number | 'Custom' | 'Free' = 35;
  if (prod.pricingModel === 'Free') startingPrice = 'Free';
  else if (isEnterprise) startingPrice = 'Custom';
  else if (prod.pricingModel === 'Freemium') startingPrice = 19;

  const plans: PricingPlan[] = [];
  if (prod.pricingTiers && prod.pricingTiers.length > 0) {
    prod.pricingTiers.forEach((tier) => {
      const tierLower = tier.toLowerCase();
      let price: number | 'Custom' | 'Free' = 45;
      if (tierLower.includes('free')) price = 'Free';
      else if (tierLower.includes('starter') || tierLower.includes('basic')) price = 25;
      else if (tierLower.includes('professional') || tierLower.includes('plus')) price = 55;
      else if (tierLower.includes('enterprise') || tierLower.includes('custom') || tierLower.includes('quote')) price = 'Custom';

      plans.push({
        name: tier,
        pricePerUserMonth: price,
        billingCycle: price === 'Custom' ? 'contact_sales' : 'annual',
        highlightedFeatures: prod.features.slice(0, 3),
      });
    });
  } else {
    if (prod.pricingModel === 'Free') {
      plans.push({
        name: 'Community / Free Edition',
        pricePerUserMonth: 'Free',
        billingCycle: 'monthly',
        highlightedFeatures: prod.features.slice(0, 3),
      });
    } else if (prod.pricingModel === 'Freemium') {
      plans.push(
        {
          name: 'Free Tier',
          pricePerUserMonth: 'Free',
          billingCycle: 'monthly',
          highlightedFeatures: prod.features.slice(0, 2),
        },
        {
          name: 'Standard',
          pricePerUserMonth: 29,
          billingCycle: 'annual',
          highlightedFeatures: prod.features.slice(0, 4),
        },
        {
          name: 'Enterprise',
          pricePerUserMonth: 'Custom',
          billingCycle: 'contact_sales',
          highlightedFeatures: ['Dedicated support', 'Custom integrations', 'Full SLA'],
        }
      );
    } else if (isEnterprise) {
      plans.push(
        {
          name: 'Professional',
          pricePerUserMonth: 'Custom',
          billingCycle: 'contact_sales',
          highlightedFeatures: prod.features.slice(0, 3),
        },
        {
          name: 'Enterprise Global',
          pricePerUserMonth: 'Custom',
          billingCycle: 'contact_sales',
          highlightedFeatures: ['Multi-site rollup', 'Advanced IoT telemetry', '24/7 dedicated support'],
        }
      );
    } else {
      plans.push(
        {
          name: 'Standard',
          pricePerUserMonth: 39,
          billingCycle: 'annual',
          highlightedFeatures: prod.features.slice(0, 3),
        },
        {
          name: 'Professional',
          pricePerUserMonth: 69,
          billingCycle: 'annual',
          highlightedFeatures: prod.features.slice(0, 5),
        },
        {
          name: 'Enterprise',
          pricePerUserMonth: 'Custom',
          billingCycle: 'contact_sales',
          highlightedFeatures: ['Custom API access', 'SSO & Audit logs', 'Dedicated success manager'],
        }
      );
    }
  }

  const hasPdM = prod.features.some(f => /predictive|iot|ai|sensor|vibration|condition/i.test(f));
  const hasInventory = prod.features.some(f => /inventory|mro|spare|part|procurement/i.test(f));

  const features: FeatureRatings = {
    workOrderManagement: 9.3,
    preventiveMaintenance: 9.1,
    assetTrackingAndHierarchy: 8.9,
    mroInventoryManagement: hasInventory ? 9.0 : 7.5,
    mobileAppUsability: Math.round(usabilityScore * 10) / 10,
    predictiveMaintenanceAndIot: hasPdM ? 9.2 : 6.8,
    reportingAndAnalytics: 8.5,
    vendorAndContractorManagement: 8.0,
    complianceAndAuditReadiness: 8.7,
  };

  const coreCapabilities: CoreCapability[] = prod.features.map(feat => ({
    title: feat,
    description: `Industrial-grade ${feat.toLowerCase()} designed to optimize uptime, streamline technician wrench time, and maintain regulatory compliance.`,
  }));

  const faqs: FAQItem[] = [
    {
      question: `What industries is ${prod.name} best suited for?`,
      answer: `${prod.name} is optimized for ${supportedIndustries.slice(0, 4).join(', ')} maintenance and operations teams requiring ${prod.deployment.join(' and ')} infrastructure.`,
    },
    {
      question: `How does ${prod.name} handle work orders and preventive maintenance?`,
      answer: `${prod.name} provides end-to-end maintenance coordination, supporting reactive work order ticketing, recurring PM schedules, parts tracking, and technician mobile execution.`,
    },
    {
      question: `What is the pricing model for ${prod.name}?`,
      answer: `${prod.name} operates on a ${prod.pricingModel} pricing model${prod.pricingTiers && prod.pricingTiers.length > 0 ? ` with available tiers: ${prod.pricingTiers.join(', ')}` : ''}.`,
    },
  ];

  return {
    id: prod.slug,
    slug: prod.slug,
    name: prod.name,
    logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(prod.name)}&background=0f52ba&color=fff&rounded=true&bold=true`,
    tagline: prod.tagline,
    websiteUrl: prod.website,
    affiliateUrl: prod.website ? `${prod.website}${prod.website.includes('?') ? '&' : '?'}ref=plantmainthq&utm_source=plantmainthq&utm_medium=directory&utm_campaign=cmms_comparison` : `/software/${prod.slug}`,
    yearFounded: prod.foundedYear || 2015,
    overview: prod.description,
    implementationTime: isCloud ? (isEnterprise ? '3 to 6 weeks' : '1 to 3 weeks') : '6 to 12 weeks',
    customerSupport: 'Fast-response technical support, structured onboarding, and comprehensive knowledge base.',
    deploymentTypes,
    supportedIndustries,
    targetCompanySizes,
    overallRating,
    reviewCount,
    pricing: {
      hasFreeTrial: prod.pricingModel === 'Free' || prod.pricingModel === 'Freemium' || prod.pricingModel === 'Subscription',
      hasFreeTier: prod.pricingModel === 'Free' || prod.pricingModel === 'Freemium',
      startingPricePerUserMonth: startingPrice,
      plans,
    },
    features,
    coreCapabilities,
    pros: prod.pros,
    cons: prod.cons,
    keyIntegrations: [
      'ERP (SAP, Oracle, NetSuite)',
      'SCADA & PLC Historians',
      'IoT Vibration & Temperature Sensors',
      'Barcode & QR Scanning Devices',
    ],
    bestFor: `${supportedIndustries.slice(0, 3).join(', ')} maintenance and reliability teams.`,
    editorsVerdict: `${prod.name} is a comprehensive maintenance solution with strong usability (${usabilityScore}/10). Its combination of ${prod.features.slice(0, 3).join(', ')} makes it a top consideration for modernizing plant operations.`,
    faqs,
    pricingTiers: prod.pricingTiers,
    technicianUsabilityScore: prod.technicianUsabilityScore,
    featureBenchmarks: prod.featureBenchmarks,
  };
}

export const CMMS_DATABASE: CMMSSoftware[] = cmmsSoftware.map(mapProductToSoftware);
