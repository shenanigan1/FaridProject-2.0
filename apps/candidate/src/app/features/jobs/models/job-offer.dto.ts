export interface PublicJobOfferDto {
  id: string;
  title: string;
  location: string;
  employment_type: string;
  contract_type: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'closed' | 'draft';
  short_description?: string;
  applicants_count?: number;
  posted_at?: string;
  closing_date?: string;
  company_name?: string;
}

export interface PaginatedResponseDto<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
