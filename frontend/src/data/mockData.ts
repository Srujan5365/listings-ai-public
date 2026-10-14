import type {
  ListingItem,
  LiveDateItem,
  ActivityItem,
  UserProfile,
  ActivityLogItem,
  DocumentActivityItem,
  StatusChangeActivityItem,
  AgentCommunicationActivityItem,
  SystemActionActivityItem,
  DocumentTypeSetting,
  ValidationRuleSetting,
  UserAccessSetting,
  IntegrationSetting,
  ListingDocumentItem,
  ListingValidationItem,
  ListingActivityItem,
} from '../types/index';

export const currentUser: UserProfile = {
  id: 'usr_1',
  firstName: 'María',
  lastName: 'López',
  role: 'Listings Coordinator',
  initials: 'ML',
};

export const allListings: ListingItem[] = [
  {
    id: 'lst_1',
    address: '123 Main Street',
    city: 'Toronto, ON',
    mls: 'X1234567',
    agent: 'John Smith',
    liveDate: 'Sep 25, 2024',
    isToday: true,
    status: 'Published',
    readiness: 100,
    priority: 'High',
    updated: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'lst_2',
    address: '456 Oak Avenue',
    city: 'Toronto, ON',
    mls: 'X1234568',
    agent: 'Sarah Lee',
    liveDate: 'Sep 26, 2024',
    status: 'Ready for Review',
    readiness: 87,
    priority: 'High',
    updated: '4 hours ago',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'lst_3',
    address: '789 Pine Road',
    city: 'Mississauga, ON',
    mls: 'X1234569',
    agent: 'Michael Chen',
    liveDate: 'Sep 27, 2024',
    status: 'Missing Information',
    readiness: 72,
    priority: 'Medium',
    updated: '1 day ago',
    image: 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'lst_4',
    address: '321 Maple Drive',
    city: 'Toronto, ON',
    mls: 'X1234570',
    agent: 'Emily Wilson',
    liveDate: 'Sep 28, 2024',
    status: 'Processing',
    readiness: 65,
    priority: 'Medium',
    updated: '1 day ago',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'lst_5',
    address: '654 Birch Lane',
    city: 'Vaughan, ON',
    mls: 'X1234571',
    agent: 'David Kim',
    liveDate: 'Oct 1, 2024',
    status: 'Ready for Review',
    readiness: 80,
    priority: 'High',
    updated: '2 days ago',
    image: 'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'lst_6',
    address: '987 Cedar Court',
    city: 'Richmond Hill, ON',
    mls: 'X1234572',
    agent: 'Awaiting Agent',
    liveDate: 'Oct 2, 2024',
    status: 'Awaiting Agent',
    readiness: 58,
    priority: 'Medium',
    updated: '2 days ago',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'lst_7',
    address: '159 Elm Street',
    city: 'Toronto, ON',
    mls: 'X1234573',
    agent: 'David Kim',
    liveDate: 'Oct 3, 2024',
    status: 'Processing',
    readiness: 75,
    priority: 'Low',
    updated: '3 days ago',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'lst_8',
    address: '753 Willow Way',
    city: 'Markham, ON',
    mls: 'X1234574',
    agent: 'Amanda Garcia',
    liveDate: 'Oct 5, 2024',
    status: 'Missing Information',
    readiness: 60,
    priority: 'Medium',
    updated: '3 days ago',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=120&auto=format&fit=crop&q=80'
  }
];

export const mockLiveDates: LiveDateItem[] = [
  { id: '1', month: 'SEP', day: '25', address: '123 Main Street', city: 'Toronto, ON', tag: 'Today', tagColor: 'red' },
  { id: '2', month: 'SEP', day: '25', address: '789 Pine Road', city: 'Mississauga, ON', tag: 'Today', tagColor: 'red' },
  { id: '3', month: 'SEP', day: '26', address: '456 Oak Avenue', city: 'Toronto, ON', tag: 'Tomorrow', tagColor: 'orange' },
  { id: '4', month: 'SEP', day: '27', address: '321 Maple Drive', city: 'Burlington, ON', tag: 'In 2 days', tagColor: 'gray' },
];

export const mockActivities: ActivityItem[] = [
  { id: '1', type: 'approved', title: 'Listing approved', detail: '654 Birch Lane — Published to FUB', time: '1 hour ago' },
  { id: '2', type: 'fub', title: 'FUB updated', detail: '321 Maple Drive — Status changed to Active', time: '2 hours ago' },
  { id: '3', type: 'missing', title: 'Missing info identified', detail: '456 Oak Avenue — Sent request to agent', time: '3 hours ago' },
  { id: '4', type: 'docs', title: 'New documents received', detail: '789 Pine Road — 3 documents processed', time: '5 hours ago' },
];

// 1. All Activity & Filtered View (Screenshots 1 & 6)
export const mockAllActivityLogs: ActivityLogItem[] = [
  {
    id: 'act_1',
    date: 'Sep 26, 2024',
    time: '10:14 AM',
    address: '123 Main Street',
    mls: 'X1234567',
    activity: 'Document received',
    details: 'Floor plan uploaded by agent.',
    user: { name: 'John Smith', initials: 'JS', bgColor: 'bg-slate-500' },
    type: 'Document',
    statusFilterTag: 'Ready for Review'
  },
  {
    id: 'act_2',
    date: 'Sep 26, 2024',
    time: '9:02 AM',
    address: '456 Oak Avenue',
    mls: 'X1234568',
    activity: 'Validation updated',
    details: '12 of 14 fields validated (87% confidence).',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' },
    type: 'Validation',
    statusFilterTag: 'Ready for Review'
  },
  {
    id: 'act_3',
    date: 'Sep 25, 2024',
    time: '4:36 PM',
    address: '789 Pine Road',
    mls: 'X1234569',
    activity: 'Status changed',
    details: 'Moved to Ready for Review.',
    user: { name: 'María López', initials: 'ML', bgColor: 'bg-blue-600' },
    type: 'Status',
    statusFilterTag: 'Ready for Review'
  },
  {
    id: 'act_4',
    date: 'Sep 24, 2024',
    time: '10:15 AM',
    address: '987 Cedar Court',
    mls: 'X1234572',
    activity: 'Document processed',
    details: '8 documents extracted and analyzed.',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' },
    type: 'Document',
    statusFilterTag: 'Ready for Review'
  },
  {
    id: 'act_5',
    date: 'Sep 23, 2024',
    time: '3:22 PM',
    address: '753 Willow Way',
    mls: 'X1234574',
    activity: 'Agent reply received',
    details: 'All required documents provided.',
    user: { name: 'Robert Taylor', initials: 'RT', bgColor: 'bg-indigo-600' },
    type: 'Communication',
    statusFilterTag: 'Ready for Review'
  },
  {
    id: 'act_6',
    date: 'Sep 22, 2024',
    time: '11:05 AM',
    address: '159 Elm Street',
    mls: 'X1234573',
    activity: 'Listing updated',
    details: 'Live date confirmed.',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' },
    type: 'System',
    statusFilterTag: 'Ready for Review'
  }
];

// 2. Documents Tab (Screenshot 2)
export const mockDocumentActivityLogs: DocumentActivityItem[] = [
  {
    id: 'doc_1',
    date: 'Sep 26, 2024',
    time: '10:14 AM',
    address: '123 Main Street',
    mls: 'X1234567',
    documentType: 'Floor Plans',
    fileName: 'FloorPlans.pdf',
    action: 'Uploaded',
    user: { name: 'John Smith', initials: 'JS', bgColor: 'bg-slate-500' }
  },
  {
    id: 'doc_2',
    date: 'Sep 26, 2024',
    time: '9:02 AM',
    address: '456 Oak Avenue',
    mls: 'X1234568',
    documentType: 'Property Survey',
    fileName: 'Survey.pdf',
    action: 'Uploaded',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' }
  },
  {
    id: 'doc_3',
    date: 'Sep 25, 2024',
    time: '4:36 PM',
    address: '321 Maple Drive',
    mls: 'X1234570',
    documentType: 'Property Tax Bill',
    fileName: 'TaxBill.pdf',
    action: 'Uploaded',
    user: { name: 'Michael Kim', initials: 'MK', bgColor: 'bg-indigo-600' }
  },
  {
    id: 'doc_4',
    date: 'Sep 24, 2024',
    time: '11:08 AM',
    address: '654 Birch Lane',
    mls: 'X1234571',
    documentType: 'Condo Management Info',
    fileName: 'CondoInfo.pdf',
    action: 'Uploaded',
    user: { name: 'John Smith', initials: 'JS', bgColor: 'bg-slate-500' }
  },
  {
    id: 'doc_5',
    date: 'Sep 24, 2024',
    time: '10:15 AM',
    address: '987 Cedar Court',
    mls: 'X1234572',
    documentType: 'MLS Input Form',
    fileName: 'MLS_Input_Form.pdf',
    action: 'Uploaded',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' }
  }
];

// 3. Status Changes Tab (Screenshot 3)
export const mockStatusChangeLogs: StatusChangeActivityItem[] = [
  {
    id: 'st_1',
    date: 'Sep 26, 2024',
    time: '9:02 AM',
    address: '456 Oak Avenue',
    mls: 'X1234568',
    fromStatus: 'Missing Information',
    toStatus: 'In Review',
    details: 'All required documents received.',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' }
  },
  {
    id: 'st_2',
    date: 'Sep 25, 2024',
    time: '4:35 PM',
    address: '789 Pine Road',
    mls: 'X1234569',
    fromStatus: 'In Review',
    toStatus: 'Ready for Review',
    details: 'Validation completed.',
    user: { name: 'María López', initials: 'ML', bgColor: 'bg-blue-600' }
  },
  {
    id: 'st_3',
    date: 'Sep 25, 2024',
    time: '2:15 PM',
    address: '321 Maple Drive',
    mls: 'X1234570',
    fromStatus: 'Awaiting Agent',
    toStatus: 'In Review',
    details: 'Missing documents received.',
    user: { name: 'Michael Kim', initials: 'MK', bgColor: 'bg-indigo-600' }
  },
  {
    id: 'st_4',
    date: 'Sep 24, 2024',
    time: '11:08 AM',
    address: '654 Birch Lane',
    mls: 'X1234571',
    fromStatus: 'New',
    toStatus: 'Awaiting Agent',
    details: 'Listing created.',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' }
  },
  {
    id: 'st_5',
    date: 'Sep 24, 2024',
    time: '10:15 AM',
    address: '654 Cedar Court',
    mls: 'X1234572',
    fromStatus: 'Processing',
    toStatus: 'Ready for Review',
    details: 'Documents processed.',
    user: { name: 'System', initials: 'SY', bgColor: 'bg-slate-400' }
  }
];

// 4. Agent Communication Tab (Screenshot 4)
export const mockAgentCommunicationLogs: AgentCommunicationActivityItem[] = [
  {
    id: 'com_1',
    date: 'Sep 26, 2024',
    time: '10:14 AM',
    address: '123 Main Street',
    mls: 'X1234567',
    sender: 'John Smith (Agent)',
    initials: 'JS',
    bgColor: 'bg-slate-500',
    subject: 'Re: Floor plan',
    details: 'Attached updated floor plan.',
    type: 'Email'
  },
  {
    id: 'com_2',
    date: 'Sep 25, 2024',
    time: '4:36 PM',
    address: '321 Maple Drive',
    mls: 'X1234570',
    sender: 'Michael Kim (Agent)',
    initials: 'MK',
    bgColor: 'bg-indigo-600',
    subject: 'Additional photos',
    details: 'Please find 3 more photos.',
    type: 'Email'
  },
  {
    id: 'com_3',
    date: 'Sep 24, 2024',
    time: '11:08 AM',
    address: '654 Birch Lane',
    mls: 'X1234571',
    sender: 'Sarah Wilson (Agent)',
    initials: 'SW',
    bgColor: 'bg-slate-500',
    subject: 'Legal description',
    details: 'Attached legal description document.',
    type: 'Email'
  },
  {
    id: 'com_4',
    date: 'Sep 24, 2024',
    time: '10:15 AM',
    address: '987 Cedar Court',
    mls: 'X1234572',
    sender: 'Robert Taylor (Agent)',
    initials: 'RT',
    bgColor: 'bg-slate-500',
    subject: 'Condo documents',
    details: 'Please confirm condo fees.',
    type: 'Email'
  },
  {
    id: 'com_5',
    date: 'Sep 23, 2024',
    time: '3:22 PM',
    address: '159 Elm Street',
    mls: 'X1234573',
    sender: 'John Smith (Agent)',
    initials: 'JS',
    bgColor: 'bg-slate-500',
    subject: 'Listing details',
    details: 'Can you confirm the live date?',
    type: 'Email'
  }
];

// 5. System Actions Tab (Screenshot 5)
export const mockSystemActionLogs: SystemActionActivityItem[] = [
  {
    id: 'sys_1',
    date: 'Sep 26, 2024',
    time: '9:02 AM',
    address: '456 Oak Avenue',
    mls: 'X1234568',
    action: 'Validation run',
    iconType: 'validation',
    details: '12 of 14 fields validated (87% confidence).'
  },
  {
    id: 'sys_2',
    date: 'Sep 25, 2024',
    time: '4:36 PM',
    address: '789 Pine Road',
    mls: 'X1234569',
    action: 'Document processed',
    iconType: 'document',
    details: 'Extracted data from 8 documents.'
  },
  {
    id: 'sys_3',
    date: 'Sep 24, 2024',
    time: '11:08 AM',
    address: '654 Birch Lane',
    mls: 'X1234571',
    action: 'AI data extraction',
    iconType: 'ai',
    details: 'Listing details extracted from email.'
  },
  {
    id: 'sys_4',
    date: 'Sep 24, 2024',
    time: '10:15 AM',
    address: '987 Cedar Court',
    mls: 'X1234572',
    action: 'Duplicate check',
    iconType: 'duplicate',
    details: 'No duplicates found.'
  },
  {
    id: 'sys_5',
    date: 'Sep 23, 2024',
    time: '3:22 PM',
    address: '753 Willow Way',
    mls: 'X1234574',
    action: 'Notification sent',
    iconType: 'notification',
    details: 'Missing documents email sent to agent.'
  }
];


export const mockIntegrations: IntegrationSetting[] = [
  { id: 'int_1', name: 'TREB', iconTag: 'TREB', status: 'Connected', lastSync: 'Sep 26, 2024, 09:02 AM' },
  { id: 'int_2', name: 'FUB', iconTag: 'FD', status: 'Connected', lastSync: 'Sep 26, 2024, 09:00 AM' },
  { id: 'int_3', name: 'Google Drive', iconTag: 'Drive', status: 'Connected', lastSync: 'Sep 26, 2024, 09:01 AM' },
  { id: 'int_4', name: 'Website', iconTag: 'Website', status: 'Not connected' },
  { id: 'int_5', name: 'Asana', iconTag: 'Asana', status: 'Connected', lastSync: 'Sep 26, 2024, 08:45 AM' },
];

export const mockDocumentTypes: DocumentTypeSetting[] = [
  { id: 'dt_1', name: 'Listing Agreement', required: 'Yes', appliesTo: 'All Listings', status: 'Active' },
  { id: 'dt_2', name: 'Property Survey', required: 'Yes', appliesTo: 'All Listings', status: 'Active' },
  { id: 'dt_3', name: 'Floor Plans', required: 'Yes', appliesTo: 'All Listings', status: 'Active' },
  { id: 'dt_4', name: 'Property Tax Bill', required: 'Yes', appliesTo: 'All Listings', status: 'Active' },
  { id: 'dt_5', name: 'Condo Management Info', required: 'Conditional', appliesTo: 'Condos Only', status: 'Active' },
  { id: 'dt_6', name: 'MLS Input Form', required: 'Yes', appliesTo: 'All Listings', status: 'Active' },
  { id: 'dt_7', name: 'Photos', required: 'Yes', appliesTo: 'All Listings', status: 'Active' },
  { id: 'dt_8', name: 'Feature Sheet', required: 'No', appliesTo: 'All Listings', status: 'Active' },
];

export const mockValidationRules: ValidationRuleSetting[] = [
  { id: 'vr_1', field: 'MLS Number', rule: 'Required and unique format', severity: 'High', status: 'Active' },
  { id: 'vr_2', field: 'Property Address', rule: 'Required', severity: 'High', status: 'Active' },
  { id: 'vr_3', field: 'Listing Price', rule: 'Must be greater than 0', severity: 'High', status: 'Active' },
  { id: 'vr_4', field: 'Bedrooms', rule: 'Must be a number', severity: 'Medium', status: 'Active' },
  { id: 'vr_5', field: 'Bathrooms', rule: 'Must be a number', severity: 'Medium', status: 'Active' },
  { id: 'vr_6', field: 'Square Footage', rule: 'Must be a number', severity: 'Medium', status: 'Active' },
  { id: 'vr_7', field: 'Live Date', rule: 'Must be a future date', severity: 'Medium', status: 'Active' },
  { id: 'vr_8', field: 'Property Type', rule: 'Must match allowed values', severity: 'Low', status: 'Active' },
];

export const mockUserAccessList: UserAccessSetting[] = [
  { id: 'usr_1', name: 'María López', email: 'maria.lopez@rema.ca', role: 'Listings Coordinator', status: 'Active', initials: 'ML', bgColor: 'bg-blue-600' },
  { id: 'usr_2', name: 'John Smith', email: 'john.smith@rema.ca', role: 'Agent', status: 'Active', initials: 'JS', bgColor: 'bg-slate-500' },
  { id: 'usr_3', name: 'Robert Taylor', email: 'robert.taylor@rema.ca', role: 'Team Lead', status: 'Active', initials: 'RT', bgColor: 'bg-slate-500' },
  { id: 'usr_4', name: 'Sarah Wilson', email: 'sarah.wilson@rema.ca', role: 'Reviewer', status: 'Active', initials: 'SW', bgColor: 'bg-slate-500' },
  { id: 'usr_5', name: 'Michael Kim', email: 'michael.kim@rema.ca', role: 'Admin', status: 'Active', initials: 'MK', bgColor: 'bg-indigo-600' },
];


export const mockListingDetailDocs: ListingDocumentItem[] = [
  { id: 'd1', name: 'Listing Agreement', status: 'Received', fileName: 'Listing_Agreement.pdf', dateReceived: 'Sep 20, 2024' },
  { id: 'd2', name: 'Property Survey', status: 'Received', fileName: 'Survey.pdf', dateReceived: 'Sep 20, 2024' },
  { id: 'd3', name: 'Floor Plans', status: 'Received', fileName: 'FloorPlans.pdf', dateReceived: 'Sep 21, 2024' },
  { id: 'd4', name: 'Property Tax Bill', status: 'Received', fileName: 'TaxBill.pdf', dateReceived: 'Sep 21, 2024' },
  { id: 'd5', name: 'Condo Management Info', status: 'Missing' },
  { id: 'd6', name: 'Condo Fees Statement', status: 'Missing' },
  { id: 'd7', name: 'MLS Input Form', status: 'Received', fileName: 'MLS_Input_Form.pdf', dateReceived: 'Sep 20, 2024' },
  { id: 'd8', name: 'Photos', status: 'Received', fileName: 'Photos.zip', dateReceived: 'Sep 20, 2024' },
  { id: 'd9', name: 'Feature Sheet', status: 'Received', fileName: 'Feature_Sheet.pdf', dateReceived: 'Sep 21, 2024' },
  { id: 'd10', name: 'Other Documents', status: 'Received', fileName: 'Other_Documents.pdf', dateReceived: 'Sep 21, 2024' },
];

export const mockListingValidations: ListingValidationItem[] = [
  { id: 'v1', field: 'Property Address', extractedValue: '123 Main Street, Toronto, ON', sourceDoc: 'Agreement (p.1)', confidence: 98, status: 'Confirmed' },
  { id: 'v2', field: 'Purchase Price', extractedValue: '$1,249,000', sourceDoc: 'Agreement (p.1)', confidence: 96, status: 'Confirmed' },
  { id: 'v3', field: 'Deposit Amount', extractedValue: '$50,000', sourceDoc: 'Agreement (p.1)', confidence: 95, status: 'Confirmed' },
  { id: 'v4', field: 'Closing Date', extractedValue: 'October 25, 2024', sourceDoc: 'Agreement (p.1)', confidence: 97, status: 'Confirmed' },
  { id: 'v5', field: 'Property Type', extractedValue: 'Residential', sourceDoc: 'MLS Input Form (p.1)', confidence: 94, status: 'Confirmed' },
  { id: 'v6', field: 'Legal Description', extractedValue: 'PLAN 1234 LOT 56', sourceDoc: 'Property Survey (p.3)', confidence: 92, status: 'Confirmed' },
  { id: 'v7', field: 'Bedrooms', extractedValue: '3', sourceDoc: 'MLS Input Form (p.1)', confidence: 90, status: 'Confirmed' },
  { id: 'v8', field: 'Bathrooms', extractedValue: '2', sourceDoc: 'MLS Input Form (p.1)', confidence: 90, status: 'Confirmed' },
  { id: 'v9', field: 'Square Footage', extractedValue: '1,650', sourceDoc: 'Floor Plans (p.2)', confidence: 68, status: 'Review' },
  { id: 'v10', field: 'Year Built', extractedValue: '2010', sourceDoc: 'MLS Input Form (p.1)', confidence: 72, status: 'Review' },
  { id: 'v11', field: 'Condo Fees', extractedValue: '$699.00', sourceDoc: 'Status Certificate (p.5)', confidence: 60, status: 'Conflict' },
  { id: 'v12', field: 'Parking Spaces', extractedValue: '1', sourceDoc: 'MLS Input Form (p.1)', confidence: 95, status: 'Confirmed' },
  { id: 'v13', field: 'Included Items', extractedValue: 'Fridge, Stove, Dishwasher...', sourceDoc: 'Agreement (p.2)', confidence: 93, status: 'Confirmed' },
  { id: 'v14', field: 'Property Tax (Annual)', extractedValue: '$4,320', sourceDoc: 'Property Tax Bill (p.1)', confidence: 91, status: 'Confirmed' },
];

export const mockListingActivities: ListingActivityItem[] = [
  { id: 'a1', date: 'Sep 24, 2024', time: '4:12 PM', title: 'Listing approved', description: 'Ready for publication. All information validated.', user: 'María López', type: 'approved' },
  { id: 'a2', date: 'Sep 24, 2024', time: '4:10 PM', title: 'All items completed', description: 'Documents, validation and missing information completed.', user: 'System', type: 'completed' },
  { id: 'a3', date: 'Sep 24, 2024', time: '2:30 PM', title: 'Agent provided missing information', description: 'Provided condo management info and condo fees statement.', user: 'John Smith', type: 'agent' },
  { id: 'a4', date: 'Sep 24, 2024', time: '10:15 AM', title: 'Missing info request sent', description: 'Requested condo management information and condo fees.', user: 'María López', type: 'request' },
  { id: 'a5', date: 'Sep 22, 2024', time: '11:23 AM', title: 'Documents uploaded', description: '8 of 10 documents received.', user: 'John Smith', type: 'upload' },
  { id: 'a6', date: 'Sep 21, 2024', time: '3:45 PM', title: 'Listing created', description: 'Listing intake completed.', user: 'María López', type: 'created' },
];