import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  BpclRequestLogInterceptor,
  SwaggerResponseType,
  TransformInterceptor,
} from 'bpcl/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleResponseDTO } from './dto/role-response.dto';
import { UserRoleResponseDTO } from './dto/user-role-response.dto';
import { CreateUserRoleDTO } from './dto/user-role.dto';
import { RoleService } from './role.service';

@Controller('role')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('get-all')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiOkResponse({
    description: 'Get all the roles.',
    type: () => SwaggerResponseType(RoleResponseDTO, true),
  })
  async findAll(): Promise<RoleResponseDTO[]> {
    return this.roleService.findAll();
  }

  @Post('user-role')
  @ApiOperation({ summary: 'Assign a new role to a user' })
  @ApiCreatedResponse({
    description: 'Assign a new role to a user.',
    type: () => SwaggerResponseType(UserRoleResponseDTO),
  })
  async create(
    @Body() createUserRoleDto: CreateUserRoleDTO,
  ): Promise<UserRoleResponseDTO> {
    return await this.roleService.createUserRole(createUserRoleDto);
  }
}
