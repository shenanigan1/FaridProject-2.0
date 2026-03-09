export interface CandidateAccount {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface PositionApi {
  id: number;
  company: number;
  title: string;
  description: string;
  department: string;
  contract_type: string;
  location: string;
  salary: string;
  is_active: boolean;
}

export interface CandidateApi {
  id: number;
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface JobApplicationApi {
  id: number;
  candidate: number;
  position: number;
  status: 'submitted' | 'in_review' | 'interview' | 'closed';
  created_at: string;
}

export interface JobOffer {
  id: number;
  title: string;
  location: string;
  contractType: string;
  salaryRange: string;
  description: string;
  requirements: string[];
}

export type ApplicationStatus = 'submitted' | 'in_review' | 'interview' | 'closed';

export interface CandidateApplication {
  id: number;
  offerId: number;
  offerTitle: string;
  candidateEmail: string;
  motivation: string;
  status: ApplicationStatus;
  createdAt: string;
}
