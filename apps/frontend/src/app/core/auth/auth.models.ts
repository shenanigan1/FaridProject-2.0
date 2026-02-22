export type LoginProfile = 'driver' | 'manager' | 'hr';

export interface LoginRequest {
  profile: LoginProfile;
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh?: string;
  user?: any;
}
