export type LoginProfile = 'driver' | 'manager' | 'hr';

export interface LoginRequest {
  profile: LoginProfile;
  email: string;
  password: string;
}

export interface MeResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: AllowedRole  | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: MeResponse | null;
}

export type AllowedRole = 'admin' | 'hr' | 'director' | 'manager' | 'employee' | 'candidate';
