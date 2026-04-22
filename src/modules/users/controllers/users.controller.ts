import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { ListUsersResponseDto } from '../dto/list-users-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
@UseGuards(PoliciesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Authorize(PolicyResource.USERS, StageAction.CREATE)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return UserResponseDto.fromRecord(user);
  }

  @Get()
  @Authorize(PolicyResource.USERS, StageAction.VIEW)
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
  @Authorize(PolicyResource.USERS, StageAction.VIEW)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return UserResponseDto.fromRecord(user);
  }

  @Patch(':id')
  @Authorize(PolicyResource.USERS, StageAction.EDIT)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return UserResponseDto.fromRecord(user);
  }
}
