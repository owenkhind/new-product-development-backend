import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { UserRole } from '../../../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsEnum(UserRole)
  role!: UserRole;
}
