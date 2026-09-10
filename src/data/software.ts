import { CMMSProduct } from '../types/cmms';

export const cmmsSoftware: CMMSProduct[] = [
  {
    id: "cmms-001",
    name: "IBM Maximo",
    slug: "ibm-maximo",
    tagline: "World-class Enterprise Asset Management (EAM) for complex industries.",
    description: "IBM Maximo is a comprehensive enterprise asset management solution designed to manage the lifecycle of complex physical assets. It leverages AI, IoT data, and advanced analytics to optimize asset performance, extend asset lifespans, and reduce operational downtime. Maximo is highly customizable and suited for massive, multi-site industrial operations.",
    website: "https://www.ibm.com/products/maximo",
    foundedYear: 1968,
    pricingModel: "Enterprise",
    deployment: ["Cloud / SaaS", "On-Premise", "Hybrid"],
    features: [
      "Predictive Maintenance",
      "AI-powered Asset Monitoring",
      "Work Order Management",
      "Inventory and Procurement",
      "Mobile Execution",
      "Spatial Asset Management (GIS)"
    ],
    targetIndustries: ["Oil & Gas", "Manufacturing", "Utilities", "Transportation"],
    pros: [
      "Unmatched scalability for global enterprises",
      "Deep integration with IoT and AI",
      "Highly customizable workflows"
    ],
    cons: [
      "Steep learning curve",
      "High implementation and licensing costs",
      "Requires dedicated IT support"
    ]
  },
  {
    id: "cmms-002",
    name: "MaintainX",
    slug: "maintainx",
    tagline: "Mobile-first work order and procedure digitization software.",
    description: "MaintainX is a mobile-first CMMS that focuses on frontline worker usability. It allows maintenance teams to digitize paper procedures, manage work orders, track inventory, and communicate in real-time via built-in chat. Its intuitive interface ensures high adoption rates among mechanics and technicians on the shop floor.",
    website: "https://www.getmaintainx.com",
    foundedYear: 2018,
    pricingModel: "Freemium",
    deployment: ["Cloud / SaaS"],
    features: [
      "Real-time Team Chat",
      "Digital Standard Operating Procedures (SOPs)",
      "Preventive Maintenance Scheduling",
      "Asset Management",
      "Parts Inventory Tracking",
      "Reporting and Analytics"
    ],
    targetIndustries: ["Manufacturing", "Food & Beverage", "Hospitality", "Education"],
    pros: [
      "Extremely user-friendly mobile app",
      "Built-in communication tools",
      "Fast implementation time"
    ],
    cons: [
      "May lack deep enterprise ERP integrations out-of-the-box",
      "Reporting features are still evolving compared to legacy systems"
    ]
  },
  {
    id: "cmms-003",
    name: "UpKeep",
    slug: "upkeep",
    tagline: "Asset Operations Management for modern maintenance teams.",
    description: "UpKeep is a modern, cloud-based CMMS designed to give maintenance teams the tools they need to manage work orders, track assets, and monitor inventory from anywhere. It bridges the gap between maintenance, operations, and reliability teams, providing a unified view of asset health and team productivity.",
    website: "https://www.upkeep.com",
    foundedYear: 2014,
    pricingModel: "Subscription",
    deployment: ["Cloud / SaaS"],
    features: [
      "Mobile Work Order Management",
      "Preventive Maintenance",
      "IoT Sensor Integration",
      "Inventory Management",
      "Purchase Order Management",
      "Analytics Dashboard"
    ],
    targetIndustries: ["Manufacturing", "Facilities Management", "Warehousing", "Agriculture"],
    pros: [
      "Strong mobile application",
      "Easy to set up and use",
      "Good integration ecosystem (Zapier, ERPs)"
    ],
    cons: [
      "Pricing can scale up quickly for large teams",
      "Some advanced reporting requires higher-tier plans"
    ]
  },
  {
    id: "cmms-004",
    name: "Fiix",
    slug: "fiix",
    tagline: "AI-powered CMMS to organize, track, and optimize maintenance.",
    description: "Fiix, a Rockwell Automation company, provides a cloud-based CMMS that helps maintenance teams schedule, organize, and track equipment maintenance. It features an AI-powered analytics engine that helps predict equipment failures and optimize maintenance schedules, making it a strong choice for data-driven manufacturing plants.",
    website: "https://www.fiixsoftware.com",
    foundedYear: 2008,
    pricingModel: "Subscription",
    deployment: ["Cloud / SaaS"],
    features: [
      "AI-driven Insights (Fiix Foresight)",
      "Work Order Management",
      "Asset Management",
      "Inventory Management",
      "Multi-site Management",
      "Customizable Dashboards"
    ],
    targetIndustries: ["Manufacturing", "Food & Beverage", "Plastics", "Automotive"],
    pros: [
      "Backed by Rockwell Automation",
      "Strong AI and predictive capabilities",
      "Open API for custom integrations"
    ],
    cons: [
      "Interface can feel cluttered for basic users",
      "Mobile app lacks some desktop functionalities"
    ]
  },
  {
    id: "cmms-005",
    name: "Limble CMMS",
    slug: "limble-cmms",
    tagline: "Modern, easy-to-use CMMS software built by maintenance professionals.",
    description: "Limble CMMS is designed to be highly intuitive and easy to deploy. It focuses on reducing equipment downtime and organizing maintenance operations through a streamlined mobile and web interface. Limble is known for its excellent customer support and rapid feature development based on user feedback.",
    website: "https://limblecmms.com",
    foundedYear: 2015,
    pricingModel: "Subscription",
    deployment: ["Cloud / SaaS"],
    features: [
      "Mobile Maintenance App",
      "Preventive Maintenance",
      "Work Requests Portal",
      "Enterprise Asset Management",
      "Parts and Inventory Management",
      "Custom Dashboards and Reporting"
    ],
    targetIndustries: ["Manufacturing", "Facilities", "Gyms", "Schools"],
    pros: [
      "Exceptional user interface and experience",
      "Outstanding customer support",
      "Easy work request portal for non-maintenance staff"
    ],
    cons: [
      "Customization options can be overwhelming initially",
      "Higher starting price point for small teams"
    ]
  },
  {
    id: "cmms-006",
    name: "Eptura",
    slug: "eptura",
    tagline: "Worktech software connecting workplaces, people, and assets.",
    description: "Eptura (formed by the merger of iOFFICE, SpaceIQ, ManagerPlus, and others) offers a comprehensive suite of asset and workplace management tools. Its asset management module is robust, handling complex preventive maintenance, compliance tracking, and inventory management for heavy asset industries and large facilities.",
    website: "https://eptura.com",
    foundedYear: 2022,
    pricingModel: "Custom Quote",
    deployment: ["Cloud / SaaS"],
    features: [
      "Enterprise Asset Management",
      "Workplace Management",
      "Preventive Maintenance",
      "Visitor Management",
      "Space Planning",
      "Fleet Management"
    ],
    targetIndustries: ["Corporate Real Estate", "Manufacturing", "Fleet", "Healthcare"],
    pros: [
      "Combines facility and asset management in one ecosystem",
      "Highly scalable for global enterprises",
      "Strong compliance and audit tracking"
    ],
    cons: [
      "Complex pricing and packaging",
      "Implementation can be lengthy due to system breadth"
    ]
  },
  {
    id: "cmms-007",
    name: "eMaint",
    slug: "emaint",
    tagline: "Fluke Reliability's award-winning CMMS software.",
    description: "eMaint, a Fluke Reliability company, is a highly configurable CMMS that helps organizations manage work orders, preventive maintenance, and parts inventory. It integrates seamlessly with Fluke's condition monitoring tools, making it an excellent choice for teams transitioning from preventive to predictive maintenance.",
    website: "https://www.emaint.com",
    foundedYear: 1986,
    pricingModel: "Subscription",
    deployment: ["Cloud / SaaS"],
    features: [
      "Work Order Management",
      "Preventive Maintenance Scheduling",
      "Condition Monitoring Integration",
      "Inventory Management",
      "Interactive Image Mapping",
      "Regulatory Compliance Tracking"
    ],
    targetIndustries: ["Manufacturing", "Oil & Gas", "Food & Beverage", "Warehousing"],
    pros: [
      "Deep integration with Fluke hardware and sensors",
      "Highly customizable interface and workflows",
      "Strong legacy and industry reputation"
    ],
    cons: [
      "UI feels slightly dated compared to newer startups",
      "Customization requires significant initial setup time"
    ]
  },
  {
    id: "cmms-008",
    name: "Asset Essentials",
    slug: "asset-essentials",
    tagline: "Next-generation work and asset management platform by Dude Solutions (Brightly).",
    description: "Asset Essentials by Brightly (formerly Dude Solutions) is a cloud-based CMMS designed to help operations leaders manage maintenance, assets, and inventory. It is particularly strong in the public sector, education, and government, offering robust reporting and capital forecasting tools.",
    website: "https://www.brightlysoftware.com",
    foundedYear: 1999,
    pricingModel: "Custom Quote",
    deployment: ["Cloud / SaaS"],
    features: [
      "Work Order Management",
      "Asset Tracking",
      "Preventive Maintenance",
      "Capital Forecasting",
      "GIS Integration",
      "Mobile App"
    ],
    targetIndustries: ["Education", "Government", "Healthcare", "Manufacturing"],
    pros: [
      "Excellent capital planning and forecasting tools",
      "Strong presence and support in the public sector",
      "Robust GIS mapping capabilities"
    ],
    cons: [
      "Can be expensive for smaller municipalities or schools",
      "Interface is functional but not the most modern"
    ]
  },
  {
    id: "cmms-009",
    name: "FMX",
    slug: "fmx",
    tagline: "Facilities management software that empowers your team.",
    description: "FMX is a highly configurable facilities management and CMMS platform. It features a unique calendar-based interface that makes scheduling maintenance, managing facility events, and handling work requests incredibly intuitive for both maintenance staff and general users.",
    website: "https://www.gofmx.com",
    foundedYear: 2012,
    pricingModel: "Subscription",
    deployment: ["Cloud / SaaS"],
    features: [
      "Calendar-based Scheduling",
      "Work Order Management",
      "Preventive Maintenance",
      "Event Scheduling",
      "Equipment Maintenance",
      "Inventory Management"
    ],
    targetIndustries: ["Education", "Property Management", "Manufacturing", "Religious Organizations"],
    pros: [
      "Intuitive calendar view is universally understood",
      "Unlimited users on most pricing tiers",
      "Excellent customer support"
    ],
    cons: [
      "Less focused on heavy industrial/predictive maintenance",
      "Reporting can be rigid"
    ]
  },
  {
    id: "cmms-010",
    name: "Hippo CMMS",
    slug: "hippo-cmms",
    tagline: "Powerful, affordable, and user-friendly CMMS software.",
    description: "Hippo CMMS (now part of iOFFICE + SpaceIQ / Eptura) is known for its graphical interface, allowing users to navigate their facilities using floor plans and equipment maps. It is designed to be simple to use while providing all the essential tools needed for effective maintenance management.",
    website: "https://www.hippocmms.com",
    foundedYear: 2004,
    pricingModel: "Subscription",
    deployment: ["Cloud / SaaS"],
    features: [
      "Advanced Dashboards (Graphical Views)",
      "Work Order Management",
      "Preventive Maintenance",
      "Equipment Management",
      "Inventory Management",
      "Vendor Management"
    ],
    targetIndustries: ["Manufacturing", "Healthcare", "Hospitality", "Education"],
    pros: [
      "Visual floor plan navigation is highly intuitive",
      "Affordable pricing structure",
      "Quick implementation process"
    ],
    cons: [
      "Mobile app is not as robust as the desktop version",
      "Limited advanced predictive maintenance features"
    ]
  }
];
