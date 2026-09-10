"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDUSTRY_CONFIGURATIONS = exports.EVALUATION_CRITERIA = void 0;
exports.EVALUATION_CRITERIA = [
    {
        id: 'workOrderManagement',
        name: 'Work Order Management & Scheduling',
        category: 'core',
        description: 'Creation, assignment, tracking, and sign-off speed of reactive and planned maintenance tasks.',
        weight: 0.2,
    },
    {
        id: 'preventiveMaintenance',
        name: 'Preventive & Recurring Maintenance',
        category: 'core',
        description: 'Calendar-based and meter-based automated PM triggers and checklists.',
        weight: 0.2,
    },
    {
        id: 'assetTrackingAndHierarchy',
        name: 'Asset Hierarchy & Equipment History',
        category: 'core',
        description: 'Parent-child asset relationships, downtime logging, MTBF, and MTTR tracking.',
        weight: 0.15,
    },
    {
        id: 'mroInventoryManagement',
        name: 'MRO Spare Parts & Inventory Management',
        category: 'operational',
        description: 'Barcode scanning, min/max thresholds, automated reorder triggers, and parts-to-asset linking.',
        weight: 0.15,
    },
    {
        id: 'mobileAppUsability',
        name: 'Mobile App & Offline Technician Experience',
        category: 'operational',
        description: 'Offline capability, native iOS/Android apps, QR code scanning, and ease of use on plant floors.',
        weight: 0.1,
    },
    {
        id: 'predictiveMaintenanceAndIot',
        name: 'Predictive Maintenance (PdM) & IoT Integration',
        category: 'advanced',
        description: 'Vibration, temperature, and SCADA/PLC sensor connectivity for condition-based monitoring.',
        weight: 0.05,
    },
    {
        id: 'reportingAndAnalytics',
        name: 'Analytics, OEE & Executive Dashboards',
        category: 'advanced',
        description: 'Custom KPI reporting, technician wrench-time tracking, and maintenance cost analysis.',
        weight: 0.05,
    },
    {
        id: 'complianceAndAuditReadiness',
        name: 'Compliance, Safety & Audit Readiness',
        category: 'operational',
        description: 'OSHA, FDA 21 CFR Part 11, ISO 55001, and digital signature audit trails.',
        weight: 0.05,
    },
    {
        id: 'vendorAndContractorManagement',
        name: 'Vendor & Contractor Portal',
        category: 'commercial',
        description: 'External contractor dispatching, insurance verification, and work verification.',
        weight: 0.05,
    },
];
exports.INDUSTRY_CONFIGURATIONS = {
    Manufacturing: {
        focusKeywords: ['manufacturing CMMS', 'plant maintenance software', 'OEE optimization software'],
        primaryKpi: 'Overall Equipment Effectiveness (OEE) and unplanned downtime reduction',
    },
    'Food & Beverage': {
        focusKeywords: ['food plant CMMS', 'SQF compliant maintenance software', 'HACCP maintenance tracking'],
        primaryKpi: 'Audit readiness and sanitation PM compliance',
    },
    'Oil & Gas': {
        focusKeywords: ['oil and gas CMMS', 'hazardous area maintenance software', 'API 580 inspection CMMS'],
        primaryKpi: 'Asset integrity and environmental safety incident prevention',
    },
    'Facilities & Property': {
        focusKeywords: ['facility maintenance software', 'commercial property CMMS', 'HVAC maintenance tracker'],
        primaryKpi: 'Tenant work order resolution time and HVAC efficiency',
    },
    'Fleet & Heavy Equipment': {
        focusKeywords: ['heavy equipment maintenance software', 'fleet CMMS', 'DOT inspection maintenance software'],
        primaryKpi: 'Telematics integration and scheduled servicing intervals',
    },
    'Healthcare & Pharmaceuticals': {
        focusKeywords: ['biotech CMMS', 'FDA 21 CFR Part 11 maintenance software', 'hospital clinical engineering CMMS'],
        primaryKpi: 'Calibration records, validation compliance, and digital signature validation',
    },
    'Utilities & Energy': {
        focusKeywords: ['power plant CMMS', 'substation maintenance management', 'renewable energy CMMS'],
        primaryKpi: 'High-voltage grid reliability and regulatory compliance',
    },
    'Packaging & Logistics': {
        focusKeywords: ['warehouse conveyor maintenance software', 'distribution center CMMS', 'packaging line PM tracker'],
        primaryKpi: 'Conveyor line uptime and high-throughput sorting reliability',
    },
};
