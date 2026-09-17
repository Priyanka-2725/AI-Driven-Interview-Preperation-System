export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'candidate' | 'admin';
  targetRole?: string | null;
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior';
  lastLoginAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}
