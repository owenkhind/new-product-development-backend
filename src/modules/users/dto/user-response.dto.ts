import type { UserRecord } from '../types/user-record.type';

export class UserResponseDto {
  createdAt!: Date;
  email!: string;
  fullName!: string;
  id!: string;
  isActive!: boolean;
  lastLoginAt!: Date | null;
  role!: string;
  updatedAt!: Date;

  static fromRecord(record: UserRecord): UserResponseDto {
    return {
      createdAt: record.createdAt,
      email: record.email,
      fullName: record.fullName,
      id: record.id,
      isActive: record.isActive,
      lastLoginAt: record.lastLoginAt,
      role: record.role,
      updatedAt: record.updatedAt,
    };
  }
}
