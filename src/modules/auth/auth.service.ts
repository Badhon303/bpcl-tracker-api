import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { CompanyService } from '../company/company.service';
import { CompanyResponseDTO } from '../company/dto/company-response.dto';
import { RoleResponseDTO } from '../role/dto/role-response.dto';
import { UserRole } from '../role/entities/user-role.entity';
import { RoleService } from '../role/role.service';
import { AuthResponseDTO } from './dto/auth-response.dto';
import { LoginResponseDTO } from './dto/login-response.dto';
import { LoginDTO } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';
import { UserResponseDTO } from './dto/user-response.dto';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private jwtService: JwtService,
    private roleService: RoleService,
    private companyService: CompanyService,
  ) {}

  async register(registerDto: RegisterDTO): Promise<AuthResponseDTO> {
    try {
      const role = await this.roleService.findById(registerDto.roleId);

      await this.companyService.findById(registerDto.companyId);

      const existingUser = await this.profileRepository.findOne({
        where: [
          { username: registerDto.username },
          { email: registerDto.email },
        ],
      });
      if (existingUser) {
        throw new BadRequestException('Username or email already exists');
      }

      registerDto.password = await bcrypt.hash(registerDto.password, 10);

      const profile = this.profileRepository.create(registerDto);

      const savedProfile = await this.profileRepository.save(profile);

      const userRole = this.userRoleRepository.create({
        userid: savedProfile.id,
        roleid: role.id,
      });
      await this.userRoleRepository.save(userRole);

      const fullProfile = await this.profileRepository.findOne({
        where: { id: savedProfile.id },
        relations: [
          'userRoles',
          'userRoles.role',
          'userRoles.role.roleFeatures',
          'userRoles.role.roleFeatures.feature',
          'company',
        ],
      });

      if (!fullProfile) {
        throw new NotFoundException('Failed to load user profile');
      }

      return plainToClass(AuthResponseDTO, {
        profile: plainToClass(UserResponseDTO, {
          id: fullProfile.id,
          username: fullProfile.username,
          email: fullProfile.email,
          firstName: fullProfile.firstName,
          lastName: fullProfile.lastName,
          contact: fullProfile.contact,
          dateOfBirth: fullProfile.dateOfBirth,
          gender: fullProfile.gender,
          address: fullProfile.address,
          profileImg: fullProfile.profileImg,
          roles: fullProfile.userRoles.map((userRole) =>
            plainToClass(RoleResponseDTO, {
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
            }),
          ),
          company: plainToClass(CompanyResponseDTO, fullProfile.company),
        }),
      });
    } catch (error) {
      // console.error('AuthService.register error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(loginDto: LoginDTO): Promise<LoginResponseDTO> {
    try {
      const profile = await this.profileRepository.findOne({
        where: [
          { username: loginDto.usernameOrEmail },
          { email: loginDto.usernameOrEmail },
        ],
        relations: [
          'userRoles',
          'userRoles.role',
          'userRoles.role.roleFeatures',
          'userRoles.role.roleFeatures.feature',
          'company',
        ],
      });

      if (!profile) {
        throw new UnauthorizedException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        profile.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        contact: profile.contact,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        address: profile.address,
        profileImg: profile.profileImg,
        roles: profile.userRoles.map((userRole) => ({
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
        company: profile.company,
      };

      return plainToClass(LoginResponseDTO, {
        access_token: this.jwtService.sign(payload),
        profile: plainToClass(UserResponseDTO, {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          contact: profile.contact,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          address: profile.address,
          profileImg: profile.profileImg,
          roles: profile.userRoles.map((userRole) =>
            plainToClass(RoleResponseDTO, {
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
            }),
          ),
          company: plainToClass(CompanyResponseDTO, profile.company),
        }),
      });
    } catch (error) {
      // console.error('AuthService.login error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to authenticate user');
    }
  }

  async findById(id: number): Promise<UserResponseDTO | null> {
    try {
      const profile = await this.profileRepository.findOne({
        where: { id },
        relations: [
          'userRoles',
          'userRoles.role',
          'userRoles.role.roleFeatures',
          'userRoles.role.roleFeatures.feature',
          'company',
        ],
      });

      if (!profile) {
        throw new NotFoundException('User not found');
      }

      return plainToClass(UserResponseDTO, {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        contact: profile.contact,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        address: profile.address,
        profileImg: profile.profileImg,
        roles: profile.userRoles.map((userRole) =>
          plainToClass(RoleResponseDTO, {
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
          }),
        ),
        company: plainToClass(CompanyResponseDTO, profile.company),
      });
    } catch (error) {
      console.error('AuthService.findById error:', error);
      if (error instanceof BadRequestException || NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<UserResponseDTO | null> {
    try {
      const profile = await this.profileRepository.findOne({
        where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        relations: [
          'userRoles',
          'userRoles.role',
          'userRoles.role.roleFeatures',
          'userRoles.role.roleFeatures.feature',
          'company',
        ],
      });

      if (!profile) {
        throw new UnauthorizedException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(password, profile.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return plainToClass(UserResponseDTO, {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        contact: profile.contact,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        address: profile.address,
        profileImg: profile.profileImg,
        roles: profile.userRoles.map((userRole) =>
          plainToClass(RoleResponseDTO, {
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
          }),
        ),
        company: plainToClass(CompanyResponseDTO, profile.company),
      });
    } catch (error) {
      console.error('AuthService.validateUser error:', error);
      return null;
    }
  }
}
