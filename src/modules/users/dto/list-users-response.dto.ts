import type { UserResponseDto } from './user-response.dto';

export class ListUsersResponseDto {
  data!: UserResponseDto[];
  meta!: {
    limit: number;
    page: number;
    total: number;
  };
}
