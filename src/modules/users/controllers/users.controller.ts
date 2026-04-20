import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { ListUsersResponseDto } from '../dto/list-users-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return UserResponseDto.fromRecord(user);
  }

  @Get()
  async findAll(@Query() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    const result = await this.usersService.findAll(query);

    return {
      data: result.rows.map((user) => UserResponseDto.fromRecord(user)),
      meta: {
        limit: Math.min(query.limit, 100),
        page: query.page,
        total: result.total,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return UserResponseDto.fromRecord(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return UserResponseDto.fromRecord(user);
  }
}
