import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoleFeature } from '../../feature/entities/role-feature.entity';
import { UserRole } from './user-role.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rolename: string;

  @Column()
  description: string;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RoleFeature, (roleFeature) => roleFeature.role)
  roleFeatures: RoleFeature[];
}
