import type { UserRecord } from '../../users/types/user-record.type';

export class AuthSessionUserResponseDto {
  email!: string;
  fullName!: string;
  id!: string;
  role!: string;

  static fromRecord(record: UserRecord): AuthSessionUserResponseDto {
    return {
      email: record.email,
      fullName: record.fullName,
      id: record.id,
      role: record.role,
    };
  }
}

export class AuthSessionResponseDto {
  expiresAt!: string | null;
  provider!: 'EMAIL_PASSWORD' | 'MICROSOFT_SSO';
  user!: AuthSessionUserResponseDto;

  static fromRecord(input: {
    expiresAt: Date | null;
    provider: 'EMAIL_PASSWORD' | 'MICROSOFT_SSO';
    user: UserRecord;
  }): AuthSessionResponseDto {
    return {
      expiresAt: input.expiresAt?.toISOString() ?? null,
      provider: input.provider,
      user: AuthSessionUserResponseDto.fromRecord(input.user),
    };
  }
}
