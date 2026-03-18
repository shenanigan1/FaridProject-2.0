export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';
export type JobStatus = 'active' | 'closed' | 'draft';

export interface JobOffer {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  contractType: string;
  category?: string;
  priority: JobPriority;
  status: JobStatus;
  shortDescription?: string;
  applicantsCount?: number;
  postedAt?: string;
  closingDate?: string;
  companyName?: string;
}

export interface JobOfferFilters {
  search: string;
  location: string;
  employmentType: string;
  priority: string;
  page: number;
}
