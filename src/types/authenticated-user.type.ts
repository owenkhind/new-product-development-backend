import type { UserRole } from '../enums/user-role.enum';

export type AuthenticatedUser = {
  actingAsUserId?: string | null;
  id: string;
  isAdminSupportOverride?: boolean;
  role: UserRole;
};
