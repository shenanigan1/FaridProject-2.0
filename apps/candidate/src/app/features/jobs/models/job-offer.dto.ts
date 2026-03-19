export interface PublicJobOfferDto {
  id: number;
  title: string;
  location: string;
  contract_type: string;
  description: string;
  department: string;
  salary: number;
  created_at: string;
}

export interface PaginatedResponseDto<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
