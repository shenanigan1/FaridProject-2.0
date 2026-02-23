export type LoginProfile = 'driver' | 'manager' | 'hr';

export interface LoginRequest {
  profile: LoginProfile;
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: any;
}

export type MeResponse = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: string | null;
};
