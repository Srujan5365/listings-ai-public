export type ListingStatus = 
  | 'Ready for Review' 
  | 'Awaiting Agent' 
  | 'In Review' 
  | 'Processing' 
  | 'Completed' 
  | 'Exception'
  | 'Published'
  | 'Missing Information';

export type Priority = 'High' | 'Medium' | 'Low';

export interface ListingItem {
  id: string;
  status: ListingStatus;
  priority: Priority;
  address: string;
  city: string;
  mls: string;
  type?: string;
  liveDate: string;
  days?: number;
  agent: string;
  updated: string;
  image?: string;
  readiness?: number;
  isToday?: boolean;
}

export interface LiveDateItem {
  id: string;
  month: string;
  day: string;
  address: string;
  city: string;
  tag: string;
  tagColor: 'red' | 'orange' | 'gray';
}

export interface ActivityItem {
  id: string;
  type: 'approved' | 'fub' | 'missing' | 'docs';
  title: string;
  detail: string;
  time: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  initials: string;
}

export type ActivityLogCategory = 'Document' | 'Validation' | 'Status' | 'Communication' | 'System';

export interface ActivityUser {
  name: string;
  initials: string;
  bgColor?: string;
}

export interface ActivityLogItem {
  id: string;
  date: string;
  time: string;
  address: string;
  mls: string;
  activity: string;
  details: string;
  user: ActivityUser;
  type: ActivityLogCategory;
  statusFilterTag?: string;
}

export interface DocumentActivityItem {
  id: string;
  date: string;
  time: string;
  address: string;
  mls: string;
  documentType: string;
  fileName: string;
  action: 'Uploaded' | 'Processed';
  user: ActivityUser;
}

export interface StatusChangeActivityItem {
  id: string;
  date: string;
  time: string;
  address: string;
  mls: string;
  fromStatus: string;
  toStatus: string;
  details: string;
  user: ActivityUser;
}

export interface AgentCommunicationActivityItem {
  id: string;
  date: string;
  time: string;
  address: string;
  mls: string;
  sender: string;
  initials: string;
  bgColor?: string;
  subject: string;
  details: string;
  type: 'Email' | 'SMS' | 'Call';
}

export interface SystemActionActivityItem {
  id: string;
  date: string;
  time: string;
  address: string;
  mls: string;
  action: string;
  iconType: 'validation' | 'document' | 'ai' | 'duplicate' | 'notification';
  details: string;
}

// --- SETTINGS TYPES ---
export interface DocumentTypeSetting {
  id: string;
  name: string;
  required: 'Yes' | 'No' | 'Conditional';
  appliesTo: string;
  status: 'Active' | 'Inactive';
}

export interface ValidationRuleSetting {
  id: string;
  field: string;
  rule: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Inactive';
}

export interface UserAccessSetting {
  id: string;
  name: string;
  email: string;
  role: 'Listings Coordinator' | 'Agent' | 'Team Lead' | 'Reviewer' | 'Admin';
  status: 'Active' | 'Inactive';
  initials: string;
  bgColor: string;
}

export interface IntegrationSetting {
  id: string;
  name: string;
  iconTag: 'TREB' | 'FD' | 'Drive' | 'Website' | 'Asana';
  status: 'Connected' | 'Not connected';
  lastSync?: string;
}

export interface ListingDocumentItem {
  id: string;
  name: string;
  status: 'Received' | 'Missing';
  fileName?: string;
  dateReceived?: string;
}

export interface ListingValidationItem {
  id: string;
  field: string;
  extractedValue: string;
  sourceDoc: string;
  confidence: number;
  status: 'Confirmed' | 'Review' | 'Missing' | 'Conflict';
}

export interface ListingActivityItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  user: string;
  type: 'approved' | 'completed' | 'agent' | 'request' | 'upload' | 'created';
}