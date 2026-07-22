export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  created_at: string;
}

export interface ServiceSetting {
  key: string;
  label: string;
  description: string;
  configured: boolean;
  maskedValue: string;
  fields: ServiceField[];
}

export interface ServiceField {
  key: string;
  label: string;
  placeholder: string;
  masked: string;
}
