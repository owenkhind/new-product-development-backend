import type { UserRole } from '../../../enums/user-role.enum';

export type UserRecord = {
  createdAt: Date;
  email: string;
  fullName: string;
  id: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  role: UserRole;
  updatedAt: Date;
};
