export interface CandidateUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface CandidateAuthPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}
