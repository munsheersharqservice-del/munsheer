import { SheetTable } from '../types';
import { convertRawRowsToSheetTable } from '../services/googleSheets';

const inventoryRows = [
  ['SKU', 'Product Name', 'Category', 'Stock Level', 'Unit Cost', 'Retail Price', 'Supplier', 'Status'],
  ['SKU-1001', 'Ultra-Slim Mechanical Keyboard', 'Hardware', '142', '$45.00', '$99.99', 'Apex Tech', 'In Stock'],
  ['SKU-1002', '4K Ultra-Wide Curved Monitor 34"', 'Electronics', '18', '$290.00', '$499.00', 'Vision Corp', 'Low Stock'],
  ['SKU-1003', 'Ergonomic Mesh Executive Chair', 'Furniture', '64', '$110.00', '$229.50', 'ErgoComfort', 'In Stock'],
  ['SKU-1004', 'Noise-Canceling Wireless Headset', 'Audio', '0', '$62.50', '$149.00', 'Sonic Wave', 'Out of Stock'],
  ['SKU-1005', 'Thunderbolt 4 Multi-Port Dock', 'Hardware', '85', '$78.00', '$169.99', 'Apex Tech', 'In Stock'],
  ['SKU-1006', 'Smart Standing Desk 60x30', 'Furniture', '7', '$240.00', '$450.00', 'ErgoComfort', 'Low Stock'],
  ['SKU-1007', 'Studio Condenser USB Microphone', 'Audio', '53', '$38.00', '$89.00', 'Sonic Wave', 'In Stock'],
  ['SKU-1008', 'Precision Laser Gaming Mouse', 'Hardware', '210', '$18.50', '$59.95', 'Apex Tech', 'In Stock'],
  ['SKU-1009', 'High-Speed MagSafe Charging Pad', 'Accessories', '125', '$12.00', '$34.99', 'Apex Tech', 'In Stock'],
  ['SKU-1010', 'Aluminum Laptop Riser Stand', 'Accessories', '92', '$14.20', '$39.00', 'Vision Corp', 'In Stock'],
  ['SKU-1011', 'Dual Monitor Arm Desk Mount', 'Furniture', '0', '$35.00', '$79.99', 'ErgoComfort', 'Backordered'],
  ['SKU-1012', 'HD 1080p Autofocus Webcam', 'Electronics', '41', '$25.00', '$64.99', 'Vision Corp', 'In Stock'],
];

const crmRows = [
  ['Deal ID', 'Account Name', 'Contact Person', 'Email', 'Deal Value', 'Stage', 'Close Date', 'Priority'],
  ['DL-501', 'Acme Logistics Global', 'Sarah Jenkins', 's.jenkins@acmelog.com', '$48,000', 'Proposal Sent', '2026-10-15', 'High'],
  ['DL-502', 'Starlight Media Network', 'Marcus Vance', 'mvance@starlightmedia.io', '$125,000', 'Negotiation', '2026-10-01', 'Critical'],
  ['DL-503', 'Apex Cloud Solutions', 'Elena Rostova', 'elena@apexcloud.org', '$32,500', 'Won', '2026-09-18', 'Medium'],
  ['DL-504', 'Nexus BioTech Labs', 'Dr. David Cho', 'dcho@nexusbio.com', '$86,000', 'Qualified', '2026-11-20', 'High'],
  ['DL-505', 'Horizon Retail Group', 'Clara Hughes', 'clara@horizonretail.com', '$19,400', 'Lost', '2026-09-10', 'Low'],
  ['DL-506', 'Vanguard Fintech Partners', 'Liam O\'Connor', 'liam@vanguardfin.io', '$210,000', 'Negotiation', '2026-10-30', 'Critical'],
  ['DL-507', 'GreenLeaf Renewable Energy', 'Amara Patel', 'amara@greenleaf.energy', '$64,000', 'Proposal Sent', '2026-10-22', 'High'],
  ['DL-508', 'Beacon Health Systems', 'Robert Sterling', 'rsterling@beaconhealth.org', '$95,000', 'Qualified', '2026-11-05', 'Medium'],
];

const hrRows = [
  ['Emp ID', 'Full Name', 'Department', 'Job Title', 'Email', 'Salary', 'Start Date', 'Status'],
  ['EMP-081', 'Alexander Wright', 'Engineering', 'Senior Staff Architect', 'a.wright@company.internal', '$165,000', '2022-03-15', 'Active'],
  ['EMP-082', 'Maya Lin-Torres', 'Product Design', 'Lead UX Researcher', 'm.lin@company.internal', '$138,000', '2023-01-10', 'Active'],
  ['EMP-083', 'Julian Kowalski', 'Marketing', 'Growth Campaign Manager', 'j.kowalski@company.internal', '$105,000', '2023-08-01', 'Active'],
  ['EMP-084', 'Zainab Al-Mansoor', 'Engineering', 'Backend Distributed Dev', 'z.mansoor@company.internal', '$148,000', '2021-11-12', 'Remote'],
  ['EMP-085', 'Chloe Dubois', 'Finance', 'Financial Controller', 'c.dubois@company.internal', '$120,000', '2024-02-01', 'On Leave'],
  ['EMP-086', 'Devon Washington', 'Operations', 'Supply Chain Director', 'd.washington@company.internal', '$155,000', '2020-06-20', 'Active'],
  ['EMP-087', 'Samantha Reed', 'Customer Success', 'Enterprise Client Executive', 's.reed@company.internal', '$92,000', '2024-05-15', 'Active'],
];

export const sampleDatabases: SheetTable[] = [
  convertRawRowsToSheetTable('sample_inventory', 'Inventory & Products', inventoryRows),
  convertRawRowsToSheetTable('sample_crm', 'Sales CRM & Deals', crmRows),
  convertRawRowsToSheetTable('sample_hr', 'Staff Directory', hrRows),
];
