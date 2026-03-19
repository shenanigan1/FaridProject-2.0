export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';
export type JobStatus = 'active' | 'closed' | 'draft';

export interface JobOffer {
  id: number;
  title: string;
  location: string;
  contractType: string;
  description: string;
  department: string;
  salary: number;
  createdAt: string;
}


export interface JobOfferFilters {
  search: string;
  location: string;
  employmentType: string;
  priority: string;
  page: number;
}
