// types/profile.ts
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  metadata: any;
  children_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  name: string;
  dob: string;
  gender: string;
  metadata: any;
  created_at: string;
  created_by: string;
}

export interface EditableProfile {
  full_name: string;
  email: string;
  metadata: {
    phone?: string;
    address?: string;
    emergency_contact?: string;
    medical_notes?: string;
    preferences?: any;
  };
}

export interface UserSearchResult {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated' | 'no_profile';
export type AssignmentRole = 'kid' | 'healthcare_provider' | 'principal' | 'caregiver' | 'external_educator' | 'class_teacher' | 'teacher';