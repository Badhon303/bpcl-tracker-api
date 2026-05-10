import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { RoleResponseDTO } from './dto/role-response.dto';
import { UserRoleResponseDTO } from './dto/user-role-response.dto';
import { CreateUserRoleDTO } from './dto/user-role.dto';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async findById(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with the given ID not found`);
    }
    return role;
  }

  async findAll(): Promise<RoleResponseDTO[]> {
    const roles = await this.roleRepository.find({
      relations: ['roleFeatures', 'roleFeatures.feature'],
    });

    const transformedRoles = roles.map((role) => {
      const { roleFeatures, ...rest } = role;
      return {
        ...rest,
        features: roleFeatures.map((rf) => rf.feature),
      };
    });

    return plainToClass(RoleResponseDTO, transformedRoles);
  }

  async createUserRole(
    createUserRoleDto: CreateUserRoleDTO,
  ): Promise<UserRoleResponseDTO> {
    const userRole = this.userRoleRepository.create(createUserRoleDto);
    const savedUserRole = await this.userRoleRepository.save(userRole);
    const result = await this.userRoleRepository.findOne({
      where: { id: savedUserRole.id },
      relations: [
        'user',
        'user.userRoles',
        'user.userRoles.role',
        'user.userRoles.role.roleFeatures',
        'user.userRoles.role.roleFeatures.feature',
        'user.company',
        'role',
      ],
    });
    if (!result) {
      throw new HttpException(
        'Failed to retrieve created user role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      id: result.id,
      userid: result.userid,
      roleid: result.roleid,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        contact: result.user.contact,
        dateOfBirth: result.user.dateOfBirth,
        gender: result.user.gender,
        address: result.user.address,
        profileImg: result.user.profileImg,
        roles: result.user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          rolename: userRole.role.rolename,
          description: userRole.role.description,
          features:
            userRole.role.roleFeatures?.map((roleFeature) => ({
              id: roleFeature.feature.id,
              featurename: roleFeature.feature.featurename,
              description: roleFeature.feature.description,
              tag: roleFeature.feature.tag,
            })) || [],
        })),
        company: {
          id: result.user.company.id,
          name: result.user.company.name,
          email: result.user.company.email,
          phone: result.user.company.phone,
          website: result.user.company.website,
          logo: result.user.company.logo,
          type: result.user.company.type,
          channelName: result.user.company.channelName,
          chaincodeName: result.user.company.chaincodeName,
          peerName: result.user.company.peerName,
        },
      },
    };
  }
}
