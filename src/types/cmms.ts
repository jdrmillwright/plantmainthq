export type PricingModel = 
  | 'Free' 
  | 'Freemium' 
  | 'Subscription' 
  | 'Enterprise' 
  | 'Custom Quote';

export type DeploymentType = 
  | 'Cloud / SaaS' 
  | 'On-Premise' 
  | 'Hybrid';

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
}
